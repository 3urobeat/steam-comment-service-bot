/*
 * File: comment.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-10-09 22:15:17
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler = require("../commandHandler.js"); // eslint-disable-line
const { getCommentArgs }                = require("../helpers/getCommentArgs.js");
const { getAvailableBotsForCommenting } = require("../helpers/getCommentBots.js");
const { syncLoop, timeToString }        = require("../../controller/helpers/misc.js");
const { logCommentError }     = require("../helpers/handleCommentErrors.js");
const { handleIterationSkip } = require("../helpers/handleRequestSkips.js");


module.exports.comment = {
    names: ["comment", "gcomment", "groupcomment"],
    description: "Request comments from all available bot accounts for a profile, group, sharedfile, discussion or review",
    args: [
        {
            name: "amount",
            description: "The amount of comments to request",
            type: "string",
            isOptional: false,
            ownersOnly: false
        },
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile, group, sharedfile, discussion or review to comment on",
            type: "string",
            isOptional: true,
            ownersOnly: true
        },
        {
            name: "custom quotes",
            description: "Array of strings to use as quotes in this comment request instead of the default quotes.txt set",
            type: "string",
            isOptional: true,
            ownersOnly: true
        }
    ],
    ownersOnly: false,

    /**
     * The comment command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Get the correct ownerid array for this request
        let owners = commandHandler.data.cachefile.ownerid;
        if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

        const requesterID        = resInfo.userID;
        let receiverSteamID64  = requesterID;
        const ownercheck         = owners.includes(requesterID);


        /* --------- Various checks  --------- */
        if (!resInfo.userID) {
            respond(await commandHandler.data.getLang("nouserid")); // Reject usage of command without an userID to avoid cooldown bypass
            return logger("err", "The comment command was called without resInfo.userID! Blocking the command as I'm unable to apply cooldowns, which is required for this command!");
        }
        if (commandHandler.controller.info.readyAfter == 0)             return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, requesterID)); // Bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        if (commandHandler.controller.info.activeLogin)                 return respond(await commandHandler.data.getLang("activerelog", null, requesterID));      // Bot is waiting for relog
        if (commandHandler.data.config.maxRequests == 0 && !ownercheck) return respond(await commandHandler.data.getLang("commandowneronly", null, requesterID)); // Command is restricted to owners only

        // Check for no id param as default behavior is unavailable when calling from outside the Steam Chat
        if (!resInfo.fromSteamChat && !args[1]) return respond(await commandHandler.data.getLang("noidparam", null, requesterID));


        /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */
        const { maxRequestAmount, numberOfComments, profileID, idType, quotesArr } = await getCommentArgs(commandHandler, args, resInfo, respond);

        if (!maxRequestAmount && !numberOfComments && !quotesArr) return; // Looks like the helper aborted the request

        // Deny request if profile is private
        if (idType == "profilePrivate") return respond(await commandHandler.data.getLang("commentuserprofileprivate", null, requesterID));


        // Update receiverSteamID64 if profileID was returned
        if (profileID && profileID != requesterID) {
            logger("debug", "Custom profileID provided that is != requesterID, modifying steamID object...");

            receiverSteamID64 = profileID; // Update receiverSteamID64
        }


        // Check if user is already receiving comments right now
        const activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64];

        if (activeReqEntry && activeReqEntry.status == "active") return respond(await commandHandler.data.getLang("idalreadyreceiving", null, requesterID));


        // Check if user has cooldown
        const { until, untilStr } = await commandHandler.data.getUserCooldown(requesterID);

        if (until > Date.now()) return respond(await commandHandler.data.getLang("idoncooldown", { "remainingcooldown": untilStr }, requesterID));


        // Get all currently available bot accounts. Block limited accounts from being eligible from commenting in groups
        const allowLimitedAccounts = (idType != "group");
        const { accsNeeded, availableAccounts, accsToAdd, whenAvailableStr } = await getAvailableBotsForCommenting(commandHandler, numberOfComments, allowLimitedAccounts, idType, receiverSteamID64); // Await *has* an effect on this expression you idiot

        if (availableAccounts.length == 0 && !whenAvailableStr) { // Check if this bot has no suitable accounts for this request and there won't be any available at any point
            if (!allowLimitedAccounts) respond(await commandHandler.data.getLang("genericnounlimitedaccs", { "cmdprefix": resInfo.cmdprefix }, requesterID)); // Send less generic message for requests which require unlimited accounts
                else respond(await commandHandler.data.getLang("commentnoaccounts", { "cmdprefix": resInfo.cmdprefix }, requesterID));

            return;
        }

        if (availableAccounts.length - accsToAdd.length < accsNeeded && !whenAvailableStr) { // Check if user needs to add accounts first. Make sure the lack of accounts is caused by accsToAdd, not cooldown
            let addStr = await commandHandler.data.getLang("commentaddbotaccounts", null, requesterID);
            accsToAdd.forEach(e => addStr += `\n' steamcommunity.com/profiles/${commandHandler.data.cachefile.botaccid[commandHandler.controller.getBots(null, true)[e].index]} '`);

            logger("info", `Found enough available accounts but user needs to add ${accsToAdd.length} limited accounts first before I'm able to comment.`);

            respondModule(context, { charLimit: 500, cutChars: ["\n"], ...resInfo }, addStr); // Manually limit part length to 500 chars as addStr can cause many messages and only allow cuts at newlines to prevent links from getting embedded
            return;
        }

        if (availableAccounts.length < accsNeeded) { // Check if not enough available accounts were found because of cooldown
            if (availableAccounts.length > 0) respond(await commandHandler.data.getLang("commentnotenoughavailableaccs", { "waittime": whenAvailableStr, "availablenow": availableAccounts.length }, requesterID)); // Using allAccounts.length works for the "spread requests on as many accounts as possible" method
                else respond(await commandHandler.data.getLang("commentzeroavailableaccs", { "waittime": whenAvailableStr }, requesterID));

            logger("info", `Found only ${availableAccounts.length} available account(s) but ${accsNeeded} account(s) are needed to send ${numberOfComments} comments.`);
            return;
        }


        // Prepare activeRequests entry
        const activeRequestsObj = {
            status: "active",
            type: idType + "Comment", // Add "Comment" to the end of type to differentiate a comment process from other requests
            amount: numberOfComments,
            quotesArr: quotesArr,
            requestedby: requesterID,
            accounts: availableAccounts,
            thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
            retryAttempt: 0,
            amountBeforeRetry: 0, // Saves the amount of requested comments before the most recent retry attempt was made to send a correct finished message
            until: Date.now() + ((numberOfComments - 1) * commandHandler.data.config.requestDelay), // Calculate estimated wait time (first comment is instant -> remove 1 from numberOfComments)
            ipCooldownPenaltyAdded: false, // Whether a penalty was already added to until for having triggered an IP cooldown (e.g. HTTP error 429)
            failed: {}
        };


        // Get the correct postComment function based on type
        let postComment;
        let commentArgs = {};
        let idArr;

        switch (activeRequestsObj.type) {
            case "profilePublicComment":
            case "profileFriendsonlyComment":
                postComment = commandHandler.controller.main.community.postUserComment; // Context of the correct bot account is applied later
                commentArgs = { receiverSteamID64: receiverSteamID64, quote: null };
                break;
            case "groupComment":
                postComment = commandHandler.controller.main.community.postGroupComment; // Context of the correct bot account is applied later
                commentArgs = { receiverSteamID64: receiverSteamID64, quote: null };
                break;
            case "sharedfileComment":
                postComment = commandHandler.controller.main.community.postSharedFileComment; // Context of the correct bot account is applied later
                commentArgs = { sharedfileOwnerId: null, sharedfileId: receiverSteamID64, quote: null };

                // Get sharedfileOwnerId by scraping sharedfile DOM - Quick hack to await function that only supports callbacks
                await (() => {
                    return new Promise((resolve) => {
                        commandHandler.controller.main.community.getSteamSharedFile(receiverSteamID64, (err, obj) => {
                            if (err) {
                                logger("error", "Couldn't get sharedfile even though it exists?! Aborting!\n" + err.stack);
                                respond("Error: Couldn't get sharedfile even though it exists?! Aborting!\n" + err);
                                return;
                            }

                            commentArgs.sharedfileOwnerId = obj.owner.getSteamID64();
                            resolve();
                        });
                    });
                })();
                break;
            case "discussionComment":
                postComment = commandHandler.controller.main.community.postDiscussionComment;
                commentArgs = { topicOwner: null, gidforum: null, discussionId: null, quote: null };

                // Get topicOwner & gidforum by scraping discussion DOM - Quick hack to await function that only supports callbacks
                await (() => {
                    return new Promise((resolve) => {
                        commandHandler.controller.main.community.getSteamDiscussion(receiverSteamID64, (err, obj) => { // ReceiverSteamID64 is a URL in this case
                            if (err) {
                                logger("error", "Couldn't get discussion even though it exists?! Aborting!\n" + err.stack);
                                respond("Error: Couldn't get discussion even though it exists?! Aborting!\n" + err);
                                return;
                            }

                            commentArgs.topicOwner = obj.topicOwner;
                            commentArgs.gidforum = obj.gidforum;
                            commentArgs.discussionId = obj.id;
                            resolve();
                        });
                    });
                })();
                break;
            case "reviewComment":
                idArr = receiverSteamID64.split("/");

                postComment = commandHandler.controller.main.community.postReviewComment;
                commentArgs = { receiverSteamID64: idArr[0], appID: idArr[1], quote: null };
                break;
            default:
                logger("warn", `[Main] Unsupported comment type '${activeRequestsObj.type}'! Rejecting request...`);
                respond(await commandHandler.data.getLang("commentunsupportedtype", null, requesterID));
                return;
        }

        // Overwrite postComment with pure *nothingness* if debug mode is enabled
        if (commandHandler.data.advancedconfig.disableSendingRequests) {
            logger("warn", "Replacing postComment with nothingness because 'disableSendingRequests' is enabled in 'advancedconfig.json'!");
            postComment = (a, callback) => callback(null);
            commentArgs = { quote: null };
        }


        // Register this comment process in activeRequests
        commandHandler.controller.activeRequests[receiverSteamID64] = activeRequestsObj;

        // Start commenting
        logger("debug", "Made activeRequest entry for user, starting comment loop...");
        comment(commandHandler, resInfo, respond, postComment, commentArgs, receiverSteamID64); // eslint-disable-line no-use-before-define
    }
};


/**
 * Internal: Do the actual commenting, activeRequests entry with all relevant information was processed by the comment command function above.
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param {function(string): void} respond The shortened respondModule call
 * @param {Function} postComment The correct postComment function for this idType. Context from the correct bot account is being applied later.
 * @param {object} commentArgs All arguments this postComment function needs, without callback. It will be applied and a callback added as last param. Include a key called "quote" to dynamically replace it with a random quote.
 * @param {string} receiverSteamID64 steamID64 of the profile to receive the comments
 */
async function comment(commandHandler, resInfo, respond, postComment, commentArgs, receiverSteamID64) {
    const activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter
    const requesterID    = resInfo.userID;


    // Log request start and give user cooldown on the first iteration
    const whereStr = activeReqEntry.type == "profileComment" ? `on profile ${receiverSteamID64}` : `in/on ${activeReqEntry.type.replace("Comment", "")} ${receiverSteamID64}`; // Shortcut to convey more precise information in the 4 log messages below

    if (activeReqEntry.thisIteration == -1) {
        logger("info", `${logger.colors.fggreen}[${commandHandler.controller.main.logPrefix}] ${activeReqEntry.amount} Comment(s) requested. Starting to comment ${whereStr}...`);

        // Only send estimated wait time message for multiple comments
        if (activeReqEntry.amount > 1) {
            const waitTime = timeToString(Date.now() + ((activeReqEntry.amount - 1) * commandHandler.data.config.requestDelay)); // Amount - 1 because the first comment is instant. Multiply by delay and add to current time to get timestamp when last comment was sent

            respond(await commandHandler.data.getLang("commentprocessstarted", { "numberOfComments": activeReqEntry.amount, "waittime": waitTime }, requesterID));
        }

        // Give requesting user cooldown. Set timestamp to now if cooldown is disabled to avoid issues when a process is aborted but cooldown can't be cleared
        if (commandHandler.data.config.requestCooldown == 0) commandHandler.data.setUserCooldown(activeReqEntry.requestedby, Date.now());
            else commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);
    }


    // Comment numberOfComments times using our syncLoop helper
    syncLoop(activeReqEntry.amount - (activeReqEntry.thisIteration + 1), (loop, i) => {

        setTimeout(async () => {

            /* --------- Get the correct account for this iteration and update iteration in activeRequests obj --------- */
            const bot = commandHandler.controller.getBots("*", true)[activeReqEntry.accounts[i % activeReqEntry.accounts.length]]; // Iteration modulo amount of accounts gives us index of account to use inside the accounts array. This returns the bot account name which we can lookup in the bots object.
            activeReqEntry.thisIteration++;


            /* --------- Check for critical errors and decide if this iteration should still run --------- */
            if (!handleIterationSkip(commandHandler, loop, bot, receiverSteamID64)) return; // Skip iteration if false was returned


            /* --------- Try to comment --------- */
            const quote = await commandHandler.data.getQuote(activeReqEntry.quotesArr); // Get a random quote to comment with
            commentArgs["quote"] = quote; // Replace key "quote" in args obj

            postComment.call(bot.community, ...Object.values(commentArgs), (error) => { // Very important! Using call() and passing the bot's community instance will keep context (this.) as it was lost by our postComment variable assignment!

                /* --------- Handle errors thrown by this comment attempt or log success message --------- */
                if (error) {
                    logCommentError(error, commandHandler, bot, receiverSteamID64);
                } else {
                    if (commandHandler.data.proxies.length > 1) logger("info", `[${bot.logPrefix}] Comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} ${whereStr} with proxy ${bot.loginData.proxyIndex}: ${String(quote).split("\n")[0]}`);
                        else logger("info", `[${bot.logPrefix}] Comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} ${whereStr}: ${String(quote).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments
                }

                // Continue with the next iteration
                loop.next();

            });

        }, commandHandler.data.config.requestDelay * (i > 0)); // Delay every comment that is not the first one

    }, async () => { // Function that will run on exit, aka the last iteration: Respond to the user

        // Handle singular comments separately
        if (activeReqEntry.amount == 1) {
            // Check if an error occurred
            if (Object.keys(activeReqEntry.failed).length > 0) respond(`${await commandHandler.data.getLang("commenterroroccurred", null, requesterID)}\n${Object.values(activeReqEntry.failed)[0]}`); // TODO: Do I want to handle retryComments for singular comments?
                else respond(await commandHandler.data.getLang("commentsuccess", { "failedamount": "0", "numberOfComments": "1" }, requesterID));

            // Instantly set status of this request to cooldown
            activeReqEntry.status = "cooldown";
            commandHandler.controller.info.commentCounter += 1;

            return;
        }


        /* --------- Retry comments if enabled. Skip aborted requests and when max retries are exceeded ---------  */
        if (commandHandler.data.advancedconfig.retryFailedComments && Object.keys(activeReqEntry.failed).length > 0 && activeReqEntry.status != "aborted" && activeReqEntry.retryAttempt < commandHandler.data.advancedconfig.retryFailedCommentsAttempts) {
            activeReqEntry.status        = "active";                  // Keep status alive so that !abort still works
            activeReqEntry.thisIteration = activeReqEntry.amount - 1; // Set thisIteration to last iteration so that the comment function won't get confused
            activeReqEntry.retryAttempt++;

            // Log and notify user about retry attempt starting in retryFailedCommentsDelay ms
            const untilStr = timeToString(Date.now() + commandHandler.data.advancedconfig.retryFailedCommentsDelay);

            respond(await commandHandler.data.getLang("commentretrying", { "failedamount": Object.keys(activeReqEntry.failed).length, "numberOfComments": activeReqEntry.amount - activeReqEntry.amountBeforeRetry, "untilStr": untilStr, "thisattempt": activeReqEntry.retryAttempt, "maxattempt": commandHandler.data.advancedconfig.retryFailedCommentsAttempts }, requesterID));
            logger("info", `${Object.keys(activeReqEntry.failed).length}/${activeReqEntry.amount - activeReqEntry.amountBeforeRetry} comments failed for ${receiverSteamID64}. Retrying in ${untilStr} (Attempt ${activeReqEntry.retryAttempt}/${commandHandler.data.advancedconfig.retryFailedCommentsAttempts})`, false, false, logger.animation("waiting"));

            // Wait retryFailedCommentsDelay ms before retrying failed comments
            setTimeout(async () => {
                // Check if comment process was aborted, send finished message and avoid increasing cooldown etc.
                if (!activeReqEntry || activeReqEntry.status == "aborted") {
                    respond(await commandHandler.data.getLang("requestaborted", { "successAmount": "0", "totalAmount": Object.keys(activeReqEntry.failed).length }, requesterID));
                    logger("info", `Comment process for ${receiverSteamID64} was aborted while waiting for retry attempt ${activeReqEntry.retryAttempt}. Stopping...`);
                    return;
                }

                // Store amountBeforeRetry and increase numberOfComments by amount of failed comments
                activeReqEntry.amountBeforeRetry = activeReqEntry.amount;
                activeReqEntry.amount += Object.keys(activeReqEntry.failed).length;

                // Increase until value (amount of retried comments * requestDelay) + delay before starting retry attempts
                activeReqEntry.until = activeReqEntry.until + (Object.keys(activeReqEntry.failed).length * commandHandler.data.config.requestDelay) + commandHandler.data.advancedconfig.retryFailedCommentsDelay;

                // Update cooldown to new extended until value
                commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);

                // Reset failed comments
                activeReqEntry.failed = {};

                // Call comment function again
                comment(commandHandler, respond, receiverSteamID64);
            }, commandHandler.data.advancedconfig.retryFailedCommentsDelay);

            return;
        }


        if (commandHandler.data.advancedconfig.retryFailedComments) logger("debug", "retryComments: Looks like all retryAttempts have been made or no comments failed. Sending finished message...");
            else logger("debug", "retryComments: retryFailedComments is disabled. Sending finished message...");


        /* ------------- Send finished message for corresponding status -------------  */
        if (activeReqEntry.status == "aborted") {

            respond(await commandHandler.data.getLang("requestaborted", { "successAmount": activeReqEntry.amount - activeReqEntry.amountBeforeRetry - Object.keys(activeReqEntry.failed).length, "totalAmount": activeReqEntry.amount - activeReqEntry.amountBeforeRetry }, requesterID));

        } else if (activeReqEntry.status == "error") {

            respond(`${await commandHandler.data.getLang("comment429stop", { "failedamount": Object.keys(activeReqEntry.failed).length, "numberOfComments": activeReqEntry.amount - activeReqEntry.amountBeforeRetry }, requesterID)}\n\n${await commandHandler.data.getLang("commentfailedcmdreference", { "cmdprefix": resInfo.cmdprefix }, requesterID)}`); // Add !failed cmd reference to message
            logger("warn", "Stopped comment process because all proxies had a HTTP 429 (IP cooldown) error!");

        } else {

            // Add reference to !failed command to finished message if at least one comment failed
            let failedcmdreference = "";

            if (Object.keys(commandHandler.controller.activeRequests[receiverSteamID64].failed).length > 0) {
                failedcmdreference = `\nTo get detailed information why which comment failed please type '${resInfo.cmdprefix}failed'. You can read why your error was probably caused here: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/errors_doc.md`;
            }

            // Send finished message
            respond(`${await commandHandler.data.getLang("commentsuccess", { "failedamount": Object.keys(activeReqEntry.failed).length, "numberOfComments": activeReqEntry.amount - activeReqEntry.amountBeforeRetry }, requesterID)}\n${failedcmdreference}`);

            // Set status of this request to cooldown and add amount of successful comments to our global commentCounter
            activeReqEntry.status = "cooldown";

        }

        commandHandler.controller.info.commentCounter += activeReqEntry.amount - activeReqEntry.amountBeforeRetry - Object.keys(activeReqEntry.failed).length; // Add numberOfComments of this attempt minus failedamount to commentCounter

    });
}
