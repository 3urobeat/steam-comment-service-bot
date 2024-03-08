/*
 * File: vote.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-05-28 12:02:24
 * Author: 3urobeat
 *
 * Last Modified: 2024-03-08 18:36:55
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler  = require("../commandHandler.js"); // eslint-disable-line
const { getMiscArgs } = require("../helpers/getMiscArgs.js");
const { getAvailableBotsForVoting } = require("../helpers/getVoteBots.js");
const { syncLoop, timeToString }    = require("../../controller/helpers/misc.js");
const { handleVoteIterationSkip, logVoteError } = require("../helpers/handleMiscErrors.js");


/**
 * Processes a up-/down-/funnyvote request
 * @param {"upvote"|"downvote"|"funnyvote"} origin Type of vote requested
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Array} args Array of arguments that will be passed to the command
 * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
 * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
 * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 */
async function processVoteRequest(origin, commandHandler, args, respondModule, context, resInfo) {
    let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

    // Get the correct ownerid array for this request
    let owners = commandHandler.data.cachefile.ownerid;
    if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

    let requesterID = resInfo.userID;
    let ownercheck  = owners.includes(requesterID);


    /* --------- Various checks  --------- */
    if (!resInfo.userID) {
        respond(await commandHandler.data.getLang("nouserid")); // Reject usage of command without an userID to avoid cooldown bypass
        return logger("err", `The ${origin} command was called without resInfo.userID! Blocking the command as I'm unable to apply cooldowns, which is required for this command!`);
    }
    if (commandHandler.controller.info.readyAfter == 0)             return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, requesterID)); // Bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained
    if (commandHandler.controller.info.activeLogin)                 return respond(await commandHandler.data.getLang("activerelog", null, requesterID));      // Bot is waiting for relog
    if (commandHandler.data.config.maxRequests == 0 && !ownercheck) return respond(await commandHandler.data.getLang("commandowneronly", null, requesterID)); // Command is restricted to owners only


    // Check and get arguments from user
    let { err, amountRaw, id, idType } = await getMiscArgs(commandHandler, args, origin, resInfo, respond); // eslint-disable-line no-unused-vars

    if (!amountRaw && !id) return; // Looks like the helper aborted the request


    // Check if this id is already receiving something right now
    let idReq = commandHandler.controller.activeRequests[id];

    if (idReq && idReq.status == "active") return respond(await commandHandler.data.getLang("idalreadyreceiving", null, requesterID)); // Note: No need to check for user as that is supposed to be handled by a cooldown


    // Check if user has cooldown
    let { until, untilStr } = await commandHandler.data.getUserCooldown(requesterID);

    if (until > Date.now()) return respond(await commandHandler.data.getLang("idoncooldown", { "remainingcooldown": untilStr }, requesterID));


    // Get all available bot accounts
    let { amount, availableAccounts, whenAvailableStr } = await getAvailableBotsForVoting(commandHandler, amountRaw, id, origin, resInfo);

    if ((availableAccounts.length < amount || availableAccounts.length == 0) && !whenAvailableStr) { // Check if this bot has not enough accounts suitable for this request and there won't be more available at any point. The < || == 0 check is intentional, as providing "all" will set amount to 0 if 0 accounts have been found
        if (availableAccounts.length == 0) respond(await commandHandler.data.getLang("genericnounlimitedaccs", { "cmdprefix": resInfo.cmdprefix }, requesterID)); // Send specific nounlimitedaccs message as we always need unlimited accs and to let users know this situation won't change
            else respond(await commandHandler.data.getLang("genericrequestless", { "availablenow": availableAccounts.length }, requesterID));

        return;
    }

    if (availableAccounts.length < amount) { // Check if not enough available accounts were found because of cooldown
        respond(await commandHandler.data.getLang("genericnotenoughavailableaccs", { "waittime": whenAvailableStr, "availablenow": availableAccounts.length }, requesterID));
        return;
    }


    // Register this vote process in activeRequests
    let capitilizedOrigin = origin.charAt(0).toUpperCase() + origin.slice(1); // Capitilize first char of origin to achieve camelCase

    let activeReqEntry = {
        status: "active",
        type: idType + capitilizedOrigin,
        amount: amount,
        requestedby: requesterID,
        accounts: availableAccounts,
        thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
        retryAttempt: 0,
        until: Date.now() + ((amount - 1) * commandHandler.data.config.requestDelay), // Calculate estimated wait time (first vote is instant -> remove 1 from numberOfComments)
        failed: {}
    };


    // Get the correct voting function and its params based on type
    let voteFunc;
    let voteArgs = { id: null };
    let idArr;

    switch (idType) {
        case "sharedfile":
            voteArgs = { id: null };

            // Get sid by scraping sharedfile DOM - Quick hack to await function that only supports callbacks
            await (() => {
                return new Promise((resolve) => {
                    commandHandler.controller.main.community.getSteamSharedFile(id, async (err, obj) => {
                        if (err) {
                            respond((await commandHandler.data.getLang("errloadingsharedfile", null, requesterID)) + err);
                            return;
                        }

                        voteArgs.id = obj.id;
                        resolve();
                    });
                });
            })();
            break;
        case "review":
            idArr = id.split("/");

            voteArgs = { id: null };

            // Get rid by scraping review DOM - Quick hack to await function that only supports callbacks
            await (() => {
                return new Promise((resolve) => {
                    commandHandler.controller.main.community.getSteamReview(idArr[0], idArr[1], async (err, obj) => {
                        if (err) {
                            respond((await commandHandler.data.getLang("errloadingreview", null, requesterID)) + err);
                            return;
                        }

                        voteArgs.id = obj.reviewID;
                        resolve();
                    });
                });
            })();
            break;
        default:
            logger("warn", `[Main] Unsupported voting type '${activeReqEntry.type}'! Rejecting request...`);
            respond(await commandHandler.data.getLang("voteunsupportedtype", null, requesterID));
            return;
    }

    switch (activeReqEntry.type) {
        case "sharedfileUpvote":
            voteFunc = commandHandler.controller.main.community.voteUpSharedFile;
            break;
        case "reviewUpvote":
            voteFunc = commandHandler.controller.main.community.voteReviewHelpful;
            break;
        case "sharedfileDownvote":
            voteFunc = commandHandler.controller.main.community.voteDownSharedFile;
            break;
        case "reviewDownvote":
            voteFunc = commandHandler.controller.main.community.voteReviewUnhelpful;
            break;
        case "reviewFunnyvote":
            voteFunc = commandHandler.controller.main.community.voteReviewFunny;
            break;
        default:
            logger("warn", `[Main] Unsupported voting type '${activeReqEntry.type}'! Rejecting request...`);
            respond(await commandHandler.data.getLang("voteunsupportedtype", null, requesterID));
            return;
    }

    // Overwrite voteFunc with pure *nothingness* if debug mode is enabled
    if (commandHandler.data.advancedconfig.disableSendingRequests) {
        logger("warn", "Replacing voteFunc with nothingness because 'disableSendingRequests' is enabled in 'advancedconfig.json'!");
        voteFunc = (a, callback) => callback(null);
        voteArgs = { nothing: null };
    }


    // Register this voting process
    commandHandler.controller.activeRequests[id] = activeReqEntry;


    // Log request start and give user cooldown on the first iteration
    if (activeReqEntry.thisIteration == -1) {
        logger("info", `${logger.colors.fggreen}[${commandHandler.controller.main.logPrefix}] ${activeReqEntry.amount} ${capitilizedOrigin}(s) requested. Starting to vote on ${id}...`);

        // Only send estimated wait time message for multiple votes
        if (activeReqEntry.amount > 1) {
            let waitTime = timeToString(Date.now() + ((activeReqEntry.amount - 1) * commandHandler.data.config.requestDelay)); // Amount - 1 because the first vote is instant. Multiply by delay and add to current time to get timestamp when last vote was sent

            respond(await commandHandler.data.getLang("voteprocessstarted", { "numberOfVotes": activeReqEntry.amount, "waittime": waitTime }, requesterID));
        }

        // Give requesting user cooldown. Set timestamp to now if cooldown is disabled to avoid issues when a process is aborted but cooldown can't be cleared
        if (commandHandler.data.config.requestCooldown == 0) commandHandler.data.setUserCooldown(activeReqEntry.requestedby, Date.now());
            else commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);
    }


    // Start voting with all available accounts
    syncLoop(amount, (loop, i) => {
        setTimeout(() => {

            let bot = commandHandler.controller.bots[availableAccounts[i]];
            activeReqEntry.thisIteration++;

            if (!handleVoteIterationSkip(commandHandler, loop, bot, id)) return; // Skip iteration if false was returned


            /* --------- Try to vote --------- */
            voteFunc.call(bot.community, ...Object.values(voteArgs), (error) => { // Note: Steam does not return an error for a duplicate request here

                /* --------- Handle errors thrown by this vote attempt or update ratingHistory db and log success message --------- */
                if (error) {
                    logVoteError(error, commandHandler, bot, id);

                } else {

                    // Set or insert entry for this account on this id for this type
                    commandHandler.data.ratingHistoryDB.update(
                        { id: id, accountName: activeReqEntry.accounts[i], $or: [{ type: "upvote" }, { type: "downvote" }, { type: "funnyvote" }] }, // Match all records of this account for this id, with one of the three possible types supported by this command,
                        { $set: { type: origin, time: Date.now() } },                                                                                // ...then update the type to the one of this request
                        { upsert: true },                                                                                                            // ...or insert a new entry if none was found
                        (err) => {
                            if (err) logger("warn", `Failed to update entry for '${activeReqEntry.accounts[i]}' on '${id}' in ratingHistory database to '${origin}'! Error: ` + err);
                        });

                    // Log success msg
                    if (commandHandler.data.proxies.length > 1) logger("info", `[${bot.logPrefix}] ${capitilizedOrigin.slice(0, -1)}ing ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} on ${id} with proxy ${bot.loginData.proxyIndex}...`);
                        else logger("info", `[${bot.logPrefix}] ${capitilizedOrigin.slice(0, -1)}ing ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} on ${id}...`);
                }

                // Continue with the next iteration
                loop.next();

            });

        }, commandHandler.data.config.requestDelay * (i > 0));

    }, async () => { // Function that will run on exit, aka the last iteration: Respond to the user

        /* ------------- Send finished message for corresponding status -------------  */
        if (activeReqEntry.status == "aborted") {

            respond(await commandHandler.data.getLang("requestaborted", { "successAmount": activeReqEntry.amount - Object.keys(activeReqEntry.failed).length, "totalAmount": activeReqEntry.amount }, requesterID));

        } else {

            // Add reference to !failed command to finished message if at least one vote failed
            let failedcmdreference = "";

            if (Object.keys(commandHandler.controller.activeRequests[id].failed).length > 0) {
                failedcmdreference = `\nTo get detailed information why which request failed please type '${resInfo.cmdprefix}failed'. You can read why your error was probably caused here: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/errors_doc.md`;
            }

            // Send finished message
            respond(`${await commandHandler.data.getLang("votesuccess", { "failedamount": Object.keys(activeReqEntry.failed).length, "numberOfVotes": activeReqEntry.amount }, requesterID)}\n${failedcmdreference}`);

            // Set status of this request to cooldown and add amount of successful comments to our global commentCounter
            activeReqEntry.status = "cooldown";

        }

    });
}


module.exports.upvote = {
    names: ["upvote"],
    description: "Upvotes a sharedfile/review with all bot accounts that haven't yet voted on that item. Requires unlimited accounts!",
    args: [
        {
            name: "amount",
            description: "The amount of upvotes to request",
            type: "string",
            isOptional: false,
            ownersOnly: false
        },
        {
            name: "ID",
            description: "The link/id of the sharedfile or link of the review to vote on",
            type: "string",
            isOptional: false,
            ownersOnly: false
        }
    ],
    ownersOnly: false,

    /**
     * The upvote command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        processVoteRequest("upvote", commandHandler, args, respondModule, context, resInfo);
    }
};


module.exports.downvote = {
    names: ["downvote"],
    description: "Downvotes a sharedfile/review with all bot accounts that haven't yet voted on that item. Requires unlimited accounts!",
    args: [
        {
            name: "amount",
            description: "The amount of downvotes to request",
            type: "string",
            isOptional: false,
            ownersOnly: true
        },
        {
            name: "ID",
            description: "The link/id of the sharedfile or link of the review to vote on",
            type: "string",
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true, // I would like to prevent users from abusing this feature to dislike other peoples creations

    /**
     * The downvote command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        processVoteRequest("downvote", commandHandler, args, respondModule, context, resInfo);
    }
};


module.exports.funnyvote = {
    names: ["funnyvote"],
    description: "Votes with funny on a review with all bot accounts that haven't yet voted on that item. Requires unlimited accounts!",
    args: [
        {
            name: "amount",
            description: "The amount of funnyvotes to request",
            type: "string",
            isOptional: false,
            ownersOnly: false
        },
        {
            name: "ID",
            description: "The link of the review to vote on",
            type: "string",
            isOptional: false,
            ownersOnly: false
        }
    ],
    ownersOnly: false,

    /**
     * The funnyvote command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        processVoteRequest("funnyvote", commandHandler, args, respondModule, context, resInfo);
    }
};
