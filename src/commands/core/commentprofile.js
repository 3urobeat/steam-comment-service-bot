/*
 * File: commentprofile.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 23.04.2023 15:11:09
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line
const { getCommentArgs }                       = require("../helpers/getCommentArgs.js");
const { syncLoop, timeToString }               = require("../../controller/helpers/misc.js");
const { logCommentError, handleIterationSkip } = require("../helpers/handleCommentSkips.js");


module.exports.commentProfile = {
    names: ["comment"],
    description: "",
    ownersOnly: false,

    /**
     * The comment command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        if (commandHandler.data.advancedconfig.disableCommentCmd) return respond(commandHandler.data.lang.botmaintenance);

        let requesterSteamID64 = steamID64;
        let receiverSteamID64  = requesterSteamID64;
        let ownercheck         = commandHandler.data.cachefile.ownerid.includes(requesterSteamID64);


        /* --------- Check for disabled comment cmd or if update is queued --------- */
        if (commandHandler.controller.info.activeRelog) return respond(commandHandler.data.lang.commentactiverelog);
        if (commandHandler.data.config.maxComments == 0 && !ownercheck) return respond(commandHandler.data.lang.commentcmdowneronly);


        /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */
        let { maxRequestAmount, numberOfComments, profileID, quotesArr } = await getCommentArgs(commandHandler, args, requesterSteamID64, SteamID.Type.INDIVIDUAL, respond);

        if (!maxRequestAmount && !numberOfComments && !quotesArr) return; // Looks like the helper aborted the request


        // Update receiverSteamID64 if profileID was returned
        if (profileID && profileID != requesterSteamID64) {
            logger("debug", "Custom profileID provided that is != requesterSteamID64, modifying steamID object...");

            receiverSteamID64 = profileID; // Update receiverSteamID64
        }


        // Check if user is already receiving comments right now
        let activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64];

        if (activeReqEntry && activeReqEntry.status == "active" && activeReqEntry.type == "profileComment") return respond(commandHandler.data.lang.commentuseralreadyreceiving);


        // Check if user has cooldown
        let { until, untilStr } = commandHandler.data.getUserCooldown(requesterSteamID64);

        if (until > Date.now()) return respond(commandHandler.lang.commentuseroncooldown.replace("remainingcooldown", untilStr));


        // Get all currently available bot accounts
        let { accsNeeded, availableAccounts, accsToAdd, whenAvailableStr } = commandHandler.controller.getAvailableAccountsForCommenting(numberOfComments, true, receiverSteamID64);

        if (availableAccounts.length - accsToAdd.length < accsNeeded && !whenAvailableStr) { // Check if user needs to add accounts first. Make sure the lack of accounts is caused by accsToAdd, not cooldown
            let addStr = commandHandler.data.lang.commentaddbotaccounts;
            accsToAdd.forEach(e => addStr += `\n' steamcommunity.com/profiles/${commandHandler.data.cachefile.botaccid[commandHandler.controller.bots[e].index]} '`);

            logger("info", `Found enough available accounts but user needs to add ${accsToAdd.length} limited accounts first before I'm able to comment.`);

            respond(addStr);
            return;
        }

        if (availableAccounts.length < accsNeeded) { // Check if not enough available accounts were found because of cooldown
            if (availableAccounts.length > 0) respond(commandHandler.data.lang.commentnotenoughavailableaccs.replace("waittime", whenAvailableStr).replace("availablenow", availableAccounts.length)); // Using allAccounts.length works for the "spread requests on as many accounts as possible" method
                else respond(commandHandler.data.lang.commentzeroavailableaccs.replace("waittime", whenAvailableStr));

            logger("info", `Found only ${availableAccounts.length} available account(s) but ${accsNeeded} account(s) are needed to send ${numberOfComments} comments.`);
            return;
        }


        /* --------- Check if profile is private ---------  */
        commandHandler.controller.main.community.getSteamUser(new SteamID(receiverSteamID64), (err, user) => {
            if (err) {
                logger("warn", `[Main] Failed to check if ${steamID64}: ${err}\n       Trying to comment anyway and hoping no error occurs...`); // This can happen sometimes and most of the times commenting will still work
            } else {
                logger("debug", "Successfully checked privacyState of receiving user: " + user.privacyState);

                if (user.privacyState != "public") {
                    return respond(commandHandler.data.lang.commentuserprofileprivate); // Only check if getting the Steam user's data didn't result in an error
                }
            }

            // Make new entry in activecommentprocess obj to register this comment process
            commandHandler.controller.activeRequests[receiverSteamID64] = {
                status: "active",
                type: "profileComment",
                amount: numberOfComments,
                quotesArr: quotesArr,
                requestedby: requesterSteamID64,
                accounts: availableAccounts,
                thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
                retryAttempt: 0,
                until: Date.now() + (numberOfComments * commandHandler.data.config.commentdelay), // Botaccountcooldown should start after the last comment was processed
                failed: {}
            };

            logger("debug", "Made activeRequest entry for user, starting comment loop...");

            comment(commandHandler, respond, receiverSteamID64); // Start commenting
        });
    }
};


/**
 * Internal function that actually does the commenting
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {function(string)} respond Shortened respondModule call
 * @param {String} receiverSteamID64 steamID64 of the profile to receive the comments
 */
function comment(commandHandler, respond, receiverSteamID64) {
    let activeReqEntry = commandHandler.controller.activeRequests[receiverSteamID64]; // Make using the obj shorter

    // Comment numberOfComments times using our syncLoop helper
    syncLoop(activeReqEntry.amount - (activeReqEntry.thisIteration + 1), (loop, i) => { // eslint-disable-line no-unused-vars

        setTimeout(async () => {

            /* --------- Get the correct account for this iteration and update iteration in activeRequests obj --------- */
            let bot = commandHandler.controller.bots[activeReqEntry.accounts[i % activeReqEntry.accounts.length]]; // Iteration modulo amount of accounts gives us index of account to use inside the accounts array. This returns the bot account name which we can lookup in the bots object.
            activeReqEntry.thisIteration++;


            /* --------- Check for critical errors and decide if this iteration should still run --------- */
            if (!handleIterationSkip(commandHandler, loop, bot, receiverSteamID64)) return; // Skip iteration if false was returned


            /* --------- Try to comment --------- */
            let quote = await commandHandler.data.getQuote(activeReqEntry.quotesArr); // Get a random quote to comment with

            bot.community.postUserComment(new SteamID(receiverSteamID64), quote, (error) => { // Post comment

                /* --------- Handle errors thrown by this comment attempt --------- */
                if (error) logCommentError(error, commandHandler, bot, receiverSteamID64);


                /* --------- No error, run this on every successful iteration --------- */
                if (activeReqEntry.thisIteration == 0) { // Stuff below should only run in first iteration
                    if (commandHandler.data.proxies.length > 1) logger("info", `${logger.colors.fggreen}[${bot.logPrefix}] ${activeReqEntry.amount} Comment(s) requested. Comment on ${receiverSteamID64} with proxy ${bot.loginData.proxyIndex}: ${String(quote).split("\n")[0]}`);
                        else logger("info", `${logger.colors.fggreen}[${bot.logPrefix}] ${activeReqEntry.amount} Comment(s) requested. Comment on ${receiverSteamID64}: ${String(quote).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments


                    // Calculate estimated wait time (first comment is instant -> remove 1 from numberOfComments)
                    let waitTime = Date.now() + ((activeReqEntry.amount - 1) * commandHandler.data.config.commentdelay);


                    // Send success message or estimated wait time message
                    if (activeReqEntry.amount == 1) {
                        respond(commandHandler.data.lang.commentsuccess1);

                        // Instantly set status of this request to cooldown
                        activeReqEntry.status = "cooldown";
                        commandHandler.controller.info.commentCounter += 1;

                    } else {

                        respond(commandHandler.data.lang.commentprocessstarted.replace("numberOfComments", activeReqEntry.amount).replace("waittime", timeToString(waitTime)));
                    }


                    // Give requesting user cooldown
                    commandHandler.data.setUserCooldown(activeReqEntry.requestedby, waitTime);

                } else { // Stuff below should only run for child accounts

                    if (!error) {
                        if (commandHandler.data.proxies.length > 1) logger("info", `[${bot.logPrefix}] Comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} on ${receiverSteamID64} with proxy ${this.loginData.proxyIndex}: ${String(quote).split("\n")[0]}`);
                            else logger("info", `[${bot.logPrefix}] Comment ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} on ${receiverSteamID64}: ${String(quote).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments
                    }
                }


                // Continue with next iteration
                loop.next();
            });

        }, commandHandler.data.config.commentdelay * (i > 0)); // Delay every comment that is not the first one

    }, () => { // Function that will run on exit, aka the last iteration: Respond to the user

        // TODO: Implement retryComments functionality
        // TODO: Check for aborted status and send different message

        // Check if comment process stopped because of a HTTP 429 error and send a different message
        if (activeReqEntry.status == "error") {

            respond(`${commandHandler.data.lang.comment429stop.replace("failedamount", activeReqEntry.amount - activeReqEntry.thisIteration + 1).replace("numberOfComments", activeReqEntry.amount)}\n\n${commandHandler.data.lang.commentfailedcmdreference}`); // Add !failed cmd reference to message
            logger("warn", "Stopped comment process because all proxies had a HTTP 429 (IP cooldown) error!");

            commandHandler.controller.info.commentCounter += activeReqEntry.amount - (activeReqEntry.amount - activeReqEntry.thisIteration + 1); // Add numberOfComments minus failedamount to commentCounter

        } else {

            // Add reference to !failed command to finished message if at least one comment failed
            let failedcmdreference = "";

            if (Object.keys(commandHandler.controller.activeRequests[receiverSteamID64].failed).length > 0) {
                failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems";
            }

            // Send finished message
            respond(`${commandHandler.data.lang.commentsuccess2.replace("failedamount", Object.keys(activeReqEntry.failed).length).replace("numberOfComments", activeReqEntry.amount)}\n${failedcmdreference}`); // Only send if not a webrequest

            // Set status of this request to cooldown and add amount of successful comments to our global commentCounter
            activeReqEntry.status = "cooldown";
            commandHandler.controller.info.commentCounter += activeReqEntry.amount - Object.keys(activeReqEntry.failed).length; // Add numberOfComments minus failedamount to commentCounter

        }

    });
}