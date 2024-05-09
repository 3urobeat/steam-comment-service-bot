/*
 * File: follow.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-09-24 15:04:33
 * Author: 3urobeat
 *
 * Last Modified: 2024-02-27 22:02:30
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler = require("../commandHandler.js"); // eslint-disable-line
const { getFollowArgs }                 = require("../helpers/getFollowArgs.js");
const { getAvailableBotsForFollowing }  = require("../helpers/getFollowBots.js");
const { syncLoop, timeToString }        = require("../../controller/helpers/misc.js");
const { handleFollowIterationSkip, logFollowError } = require("../helpers/handleFollowErrors.js");


module.exports.follow = {
    names: ["follow"],
    description: "Follows a user with all bot accounts that haven't yet done so",
    args: [
        {
            name: "amount",
            description: "The amount of follows to request",
            type: "string",
            isOptional: false,
            ownersOnly: false
        },
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile to follow",
            type: "string",
            isOptional: true,
            ownersOnly: true
        }
    ],
    ownersOnly: false,

    /**
     * The follow command
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

        const requesterID = resInfo.userID;
        const ownercheck  = owners.includes(requesterID);


        /* --------- Various checks  --------- */
        if (!resInfo.userID) {
            respond(await commandHandler.data.getLang("nouserid")); // Reject usage of command without an userID to avoid cooldown bypass
            return logger("err", "The follow command was called without resInfo.userID! Blocking the command as I'm unable to apply cooldowns, which is required for this command!");
        }
        if (commandHandler.controller.info.readyAfter == 0)             return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, requesterID)); // Bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        if (commandHandler.controller.info.activeLogin)                 return respond(await commandHandler.data.getLang("activerelog", null, requesterID));      // Bot is waiting for relog
        if (commandHandler.data.config.maxRequests == 0 && !ownercheck) return respond(await commandHandler.data.getLang("commandowneronly", null, requesterID)); // Command is restricted to owners only


        // Check and get arguments from user
        const { amountRaw, id, idType } = await getFollowArgs(commandHandler, args, "follow", resInfo, respond);

        if (!amountRaw && !id) return; // Looks like the helper aborted the request


        // Check if this id is already receiving something right now
        const idReq = commandHandler.controller.activeRequests[id];

        if (idReq && idReq.status == "active") return respond(await commandHandler.data.getLang("idalreadyreceiving", null, requesterID)); // Note: No need to check for user as that is supposed to be handled by a cooldown


        // Check if user has cooldown
        const { until, untilStr } = await commandHandler.data.getUserCooldown(requesterID);

        if (until > Date.now()) return respond(await commandHandler.data.getLang("idoncooldown", { "remainingcooldown": untilStr }, requesterID));


        // Get all available bot accounts. Block limited accounts from following curators
        const allowLimitedAccounts = (idType != "curator");
        const { amount, availableAccounts, whenAvailableStr } = await getAvailableBotsForFollowing(commandHandler, amountRaw, allowLimitedAccounts, id, idType, "follow", resInfo);

        if ((availableAccounts.length < amount || availableAccounts.length == 0) && !whenAvailableStr) { // Check if this bot has not enough accounts suitable for this request and there won't be more available at any point. The < || == 0 check is intentional, as providing "all" will set amount to 0 if 0 accounts have been found
            if (availableAccounts.length == 0) {
                if (!allowLimitedAccounts) respond(await commandHandler.data.getLang("genericnounlimitedaccs", { "cmdprefix": resInfo.cmdprefix }, requesterID));
                    else respond(await commandHandler.data.getLang("genericnoaccounts", null, requesterID));
            } else {
                respond(await commandHandler.data.getLang("genericrequestless", { "availablenow": availableAccounts.length }, requesterID));
            }

            return;
        }

        if (availableAccounts.length < amount) { // Check if not enough available accounts were found because of cooldown
            respond(await commandHandler.data.getLang("genericnotenoughavailableaccs", { "waittime": whenAvailableStr, "availablenow": availableAccounts.length }, requesterID));
            return;
        }


        // Register this follow process in activeRequests
        commandHandler.controller.activeRequests[id] = {
            status: "active",
            type: idType + "Follow",
            amount: amount,
            requestedby: requesterID,
            accounts: availableAccounts,
            thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
            retryAttempt: 0,
            until: Date.now() + ((amount - 1) * commandHandler.data.config.requestDelay), // Calculate estimated wait time (first follow is instant -> remove 1 from numberOfComments)
            failed: {}
        };

        const activeReqEntry = commandHandler.controller.activeRequests[id]; // Make using the obj shorter


        // Log request start and give user cooldown on the first iteration
        if (activeReqEntry.thisIteration == -1) {
            logger("info", `${logger.colors.fggreen}[${commandHandler.controller.main.logPrefix}] ${activeReqEntry.amount} Follow(s) requested. Starting to follow ${idType} ${id}...`);

            // Only send estimated wait time message for multiple follow
            if (activeReqEntry.amount > 1) {
                const waitTime = timeToString(Date.now() + ((activeReqEntry.amount - 1) * commandHandler.data.config.requestDelay)); // Amount - 1 because the first fav is instant. Multiply by delay and add to current time to get timestamp when last fav was sent

                respond(await commandHandler.data.getLang("followprocessstarted", { "totalamount": activeReqEntry.amount, "waittime": waitTime }, requesterID));
            }

            // Give requesting user cooldown. Set timestamp to now if cooldown is disabled to avoid issues when a process is aborted but cooldown can't be cleared
            if (commandHandler.data.config.requestCooldown == 0) commandHandler.data.setUserCooldown(activeReqEntry.requestedby, Date.now());
                else commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);
        }


        // Start voting with all available accounts
        syncLoop(amount, (loop, i) => {
            setTimeout(() => {

                const bot = commandHandler.controller.bots[availableAccounts[i]];
                activeReqEntry.thisIteration++;

                if (!handleFollowIterationSkip(commandHandler, loop, bot, id)) return; // Skip iteration if false was returned

                /* --------- Try to follow --------- */
                let followFunc = activeReqEntry.type == "curatorFollow" ? bot.community.followCurator : bot.community.followUser; // Get the correct function, depending on if the user provided a curator id or a user id

                // Overwrite followFunc with pure *nothingness* if debug mode is enabled
                if (commandHandler.data.advancedconfig.disableSendingRequests) {
                    logger("warn", "Replacing followFunc with nothingness because 'disableSendingRequests' is enabled in 'advancedconfig.json'!");
                    followFunc = (a, callback) => callback(null);
                }

                followFunc.call(bot.community, id, (error) => { // Very important! Using call() and passing the bot's community instance will keep context (this.) as it was lost by our postComment variable assignment!

                    /* --------- Handle errors thrown by this follow attempt or update ratingHistory db and log success message --------- */
                    if (error) {
                        logFollowError(error, commandHandler, bot, id);
                    }

                    if (!error || error.eresult == 2) { // Steam returns Enum 2 ("Fail") for duplicate requests

                        // Add follow entry
                        commandHandler.data.ratingHistoryDB.insert({ id: id, accountName: activeReqEntry.accounts[i], type: idType + "Follow", time: Date.now() }, (err) => {
                            if (err) logger("warn", `Failed to insert '${idType}Follow' entry for '${activeReqEntry.accounts[i]}' for '${id}' into ratingHistory database! Error: ` + err);
                        });

                        // Log success message
                        if (commandHandler.data.proxies.length > 1) logger("info", `[${bot.logPrefix}] Sending follow ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} for ${idType} ${id} with proxy ${bot.loginData.proxyIndex}...`);
                            else logger("info", `[${bot.logPrefix}] Sending follow ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} for ${idType} ${id}...`);

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

                // Add reference to !failed command to finished message if at least one follow failed
                let failedcmdreference = "";

                if (Object.keys(commandHandler.controller.activeRequests[id].failed).length > 0) {
                    failedcmdreference = `\nTo get detailed information why which request failed please type '${resInfo.cmdprefix}failed'. You can read why your error was probably caused here: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/errors_doc.md`;
                }

                // Send finished message
                respond(`${await commandHandler.data.getLang("followsuccess", { "failedamount": Object.keys(activeReqEntry.failed).length, "totalamount": activeReqEntry.amount }, requesterID)}\n${failedcmdreference}`);

                // Set status of this request to cooldown and add amount of successful comments to our global commentCounter
                activeReqEntry.status = "cooldown";

            }

        });
    }
};


module.exports.unfollow = {
    names: ["unfollow"],
    description: "Unfollows a user with all bot accounts that have followed them",
    args: [
        {
            name: "amount",
            description: "The amount of unfollows to request",
            type: "string",
            isOptional: false,
            ownersOnly: false
        },
        {
            name: "ID",
            description: "The link, steamID64 or vanity of the profile to unfollow",
            type: "string",
            isOptional: true,
            ownersOnly: true
        }
    ],
    ownersOnly: false,

    /**
     * The unfollow command
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

        const requesterID = resInfo.userID;
        const ownercheck  = owners.includes(requesterID);


        /* --------- Various checks  --------- */
        if (!resInfo.userID) {
            respond(await commandHandler.data.getLang("nouserid")); // Reject usage of command without an userID to avoid cooldown bypass
            return logger("err", "The unfollow command was called without resInfo.userID! Blocking the command as I'm unable to apply cooldowns, which is required for this command!");
        }
        if (commandHandler.controller.info.readyAfter == 0)             return respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("botnotready", null, requesterID)); // Bot isn't fully started yet - Pass new resInfo object which contains prefix and everything the original resInfo obj contained
        if (commandHandler.controller.info.activeLogin)                 return respond(await commandHandler.data.getLang("activerelog", null, requesterID));      // Bot is waiting for relog
        if (commandHandler.data.config.maxRequests == 0 && !ownercheck) return respond(await commandHandler.data.getLang("commandowneronly", null, requesterID)); // Command is restricted to owners only


        // Check and get arguments from user
        const { amountRaw, id, idType } = await getFollowArgs(commandHandler, args, "unfollow", resInfo, respond);

        if (!amountRaw && !id) return; // Looks like the helper aborted the request


        // Check if this id is already receiving something right now
        const idReq = commandHandler.controller.activeRequests[id];

        if (idReq && idReq.status == "active") return respond(await commandHandler.data.getLang("idalreadyreceiving", null, requesterID)); // Note: No need to check for user as that is supposed to be handled by a cooldown


        // Check if user has cooldown
        const { until, untilStr } = await commandHandler.data.getUserCooldown(requesterID);

        if (until > Date.now()) return respond(await commandHandler.data.getLang("idoncooldown", { "remainingcooldown": untilStr }, requesterID));


        // Get all available bot accounts. Block limited accounts from following curators
        const allowLimitedAccounts = (idType != "curator");
        const { amount, availableAccounts, whenAvailableStr } = await getAvailableBotsForFollowing(commandHandler, amountRaw, allowLimitedAccounts, id, idType, "unfollow", resInfo);

        if ((availableAccounts.length < amount || availableAccounts.length == 0) && !whenAvailableStr) { // Check if this bot has not enough accounts suitable for this request and there won't be more available at any point. The < || == 0 check is intentional, as providing "all" will set amount to 0 if 0 accounts have been found
            if (availableAccounts.length == 0) {
                if (!allowLimitedAccounts) respond(await commandHandler.data.getLang("genericnounlimitedaccs", { "cmdprefix": resInfo.cmdprefix }, requesterID));
                    else respond(await commandHandler.data.getLang("genericnoaccounts", null, requesterID));
            } else {
                respond(await commandHandler.data.getLang("genericrequestless", { "availablenow": availableAccounts.length }, requesterID));
            }

            return;
        }

        if (availableAccounts.length < amount) { // Check if not enough available accounts were found because of cooldown
            respond(await commandHandler.data.getLang("genericnotenoughavailableaccs", { "waittime": whenAvailableStr, "availablenow": availableAccounts.length }, requesterID));
            return;
        }


        // Register this unfollow process in activeRequests
        commandHandler.controller.activeRequests[id] = {
            status: "active",
            type: idType + "Unfollow",
            amount: amount,
            requestedby: requesterID,
            accounts: availableAccounts,
            thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
            retryAttempt: 0,
            until: Date.now() + ((amount - 1) * commandHandler.data.config.requestDelay), // Calculate estimated wait time (first unfollow is instant -> remove 1 from numberOfComments)
            failed: {}
        };

        const activeReqEntry = commandHandler.controller.activeRequests[id]; // Make using the obj shorter


        // Log request start and give user cooldown on the first iteration
        if (activeReqEntry.thisIteration == -1) {
            logger("info", `${logger.colors.fggreen}[${commandHandler.controller.main.logPrefix}] ${activeReqEntry.amount} Unfollow(s) requested. Starting to unfollow ${idType} ${id}...`);

            // Only send estimated wait time message for multiple unfollow
            if (activeReqEntry.amount > 1) {
                const waitTime = timeToString(Date.now() + ((activeReqEntry.amount - 1) * commandHandler.data.config.requestDelay)); // Amount - 1 because the first fav is instant. Multiply by delay and add to current time to get timestamp when last fav was sent

                respond(await commandHandler.data.getLang("followprocessstarted", { "totalamount": activeReqEntry.amount, "waittime": waitTime }, requesterID));
            }

            // Give requesting user cooldown. Set timestamp to now if cooldown is disabled to avoid issues when a process is aborted but cooldown can't be cleared
            if (commandHandler.data.config.requestCooldown == 0) commandHandler.data.setUserCooldown(activeReqEntry.requestedby, Date.now());
                else commandHandler.data.setUserCooldown(activeReqEntry.requestedby, activeReqEntry.until);
        }


        // Start voting with all available accounts
        syncLoop(amount, (loop, i) => {
            setTimeout(() => {

                const bot = commandHandler.controller.bots[availableAccounts[i]];
                activeReqEntry.thisIteration++;

                if (!handleFollowIterationSkip(commandHandler, loop, bot, id)) return; // Skip iteration if false was returned

                /* --------- Try to unfollow --------- */
                let followFunc = activeReqEntry.type == "curatorUnfollow" ? bot.community.unfollowCurator : bot.community.unfollowUser; // Get the correct function, depending on if the user provided a curator id or a user id

                // Overwrite followFunc with pure *nothingness* if debug mode is enabled
                if (commandHandler.data.advancedconfig.disableSendingRequests) {
                    logger("warn", "Replacing followFunc with nothingness because 'disableSendingRequests' is enabled in 'advancedconfig.json'!");
                    followFunc = (a, callback) => callback(null);
                }

                followFunc.call(bot.community, id, (error) => { // Very important! Using call() and passing the bot's community instance will keep context (this.) as it was lost by our postComment variable assignment!

                    /* --------- Handle errors thrown by this unfollow attempt or update ratingHistory db and log success message --------- */
                    if (error) {
                        logFollowError(error, commandHandler, bot, id);
                    }

                    if (!error || error.eresult == 2) { // Steam returns Enum 2 ("Fail") for duplicate requests

                        // Remove follow entry
                        commandHandler.data.ratingHistoryDB.remove({ id: id, accountName: activeReqEntry.accounts[i], type: idType + "Follow" }, (err) => {
                            if (err) logger("warn", `Failed to remove '${idType}Follow' entry for '${activeReqEntry.accounts[i]}' for '${id}' from ratingHistory database! Error: ` + err);
                        });

                        // Log success message
                        if (commandHandler.data.proxies.length > 1) logger("info", `[${bot.logPrefix}] Sending unfollow ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} for ${idType} ${id} with proxy ${bot.loginData.proxyIndex}...`);
                            else logger("info", `[${bot.logPrefix}] Sending unfollow ${activeReqEntry.thisIteration + 1}/${activeReqEntry.amount} for ${idType} ${id}...`);

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

                // Add reference to !failed command to finished message if at least one unfollow failed
                let failedcmdreference = "";

                if (Object.keys(commandHandler.controller.activeRequests[id].failed).length > 0) {
                    failedcmdreference = `\nTo get detailed information why which request failed please type '${resInfo.cmdprefix}failed'. You can read why your error was probably caused here: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/errors_doc.md`;
                }

                // Send finished message
                respond(`${await commandHandler.data.getLang("followsuccess", { "failedamount": Object.keys(activeReqEntry.failed).length, "totalamount": activeReqEntry.amount }, requesterID)}\n${failedcmdreference}`);

                // Set status of this request to cooldown and add amount of successful comments to our global commentCounter
                activeReqEntry.status = "cooldown";

            }

        });
    }
};
