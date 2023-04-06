/*
 * File: commentprofile.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 06.04.2023 12:04:20
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
const { syncLoop }   = require("../../controller/helpers/misc.js");


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
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). Note: Many core commands expect a steamID: "steamID64" parameter in this object, pointing to the requesting user.
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        if (commandHandler.data.advancedconfig.disableCommentCmd) return respond(commandHandler.data.lang.botmaintenance);

        let requesterSteamID = resInfo.steamID;
        let receiverSteamID  = requesterSteamID;
        let ownercheck       = cachefile.ownerid.includes(requesterSteamID);
        let lastCommentDoc   = commandHandler.data.lastCommentDB.findOneAsync({ id: resInfo.steamID });


        /* --------- Check for disabled comment cmd or if update is queued --------- */
        if (commandHandler.controller.info.activeRelog) return respond(commandHandler.data.lang.commentactiverelog);
        if (commandHandler.data.config.maxComments == 0 && !ownercheck) return respond(commandHandler.data.lang.commentcmdowneronly);


        /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */
        let { maxRequestAmount, numberOfComments, profileID, quotesArr } = await require("../../bot/helpers/getCommentArgs.js").getCommentArgs(args, resInfo.steamID, requesterSteamID, SteamID.Type.INDIVIDUAL, commandHandler.data.lang, respond);

        if (!maxRequestAmount && !numberOfComments && !quotesArr) return; // Looks like the helper aborted the request


        // Update receiverSteamID if profileID was returned
        if (profileID && profileID != requesterSteamID) {
            logger("debug", "Custom profileID provided that is != requesterSteamID, modifying steamID object...");

            // TODO: This previously changed resInfo.steamID, see if this makes a difference
            receiverSteamID = profileID; // Update receiverSteamID
        }


        /* --------- Check for cooldowns and calculate the amount of accounts needed for this request ---------  */
        let { allAccounts, accountsNeeded } = require("../helpers/checkAvailability.js").checkAvailability(receiverSteamID, numberOfComments, false, lang, res, lastcommentdoc, respond);

        if (!allAccounts && !accountsNeeded) return; // Looks like the helper aborted the request


        /* --------- Get account order and check if user is friend with limited accounts ---------  */
        let accountOrder = require("../helpers/getAccountOrder.js").getAccountOrder(true, allAccounts, accountsNeeded, numberOfComments, requesterSteamID, receiverSteamID, lang, respond);

        if (!accountOrder) return; // Looks like the helper aborted the request


        /* --------- Check if profile is private ---------  */
        commandHandler.controller.main.community.getSteamUser(resInfo.steamID, (err, user) => {
            if (err) {
                logger("warn", `[Main] comment check for private account error: ${err}\n       Trying to comment anyway and hoping no error occurs...`); // This can happen sometimes and most of the times commenting will still work
            } else {
                logger("debug", "Successfully checked privacyState of receiving user: " + user.privacyState);

                if (user.privacyState != "public") {
                    return respond(commandHandler.data.lang.commentuserprofileprivate); // Only check if getting the Steam user's data didn't result in an error
                }
            }

            // Make new entry in activecommentprocess obj to register this comment process
            commandHandler.controller.activeRequests[receiverSteamID] = {
                status: "active",
                type: "profileComment",
                amount: numberOfComments,
                quotesArr: quotesArr,
                requestedby: requesterSteamID,
                accounts: accountOrder,
                thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
                retryAttempt: 0,
                until: Date.now() + (numberOfComments * config.commentdelay), // Botaccountcooldown should start after the last comment was processed
                failed: {}
            };

            logger("debug", "Added user to activecommentprocess obj, starting comment loop...");

            comment(commandHandler, respond, resInfo, receiverSteamID); // Start commenting

        });
    }
};


/**
 * Internal function that actually does the commenting
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {function(string)} respond Shortened respondModule call
 * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). Note: Many core commands expect a steamID: "steamID64" parameter in this object, pointing to the requesting user.
 * @param {String} receiverSteamID steamID64 of the profile to receive the comments
 */
function comment(commandHandler, respond, resInfo, receiverSteamID) {

    let acpEntry = commandHandler.controller.activeRequests[receiverSteamID]; // Make using the obj shorter

    let accountOrderIndex = 0; // The bot account to be used

    let alreadySkippedProxies = []; // Array to track proxies that were skipped
    let lastQuotes            = []; // Array to track last quotes used


    // Comment numberOfComments times using our syncLoop helper
    syncLoop(acpEntry.amount - (acpEntry.thisIteration + 1), (loop, i) => { // eslint-disable-line no-unused-vars
        setTimeout(() => {

            var botindex = acpEntry.accounts[accountOrderIndex];
            acpEntry.thisIteration++;

            /* --------- Check for critical errors and decide if this iteration should still run --------- */
            var { skipIteration, aSP } = require("../helpers/handleCommentErrors.js").handleCriticalCommentErrors(botindex, "postUserComment", receiverSteamID, alreadySkippedProxies, acpEntry.amount, res, lang, respond);
            if (aSP) alreadySkippedProxies = aSP;

            if (skipIteration) {
                loop.next(); // Continue with next iteration
                return;
            }


            /* --------- Try to comment --------- */
            require("../helpers/getQuote.js").getQuote(acpEntry.quotesArr, lastQuotes, (comment) => { // Get a random quote to comment with and wait for callback to ensure a quote has been found before trying to comment

                Object.values(commandHandler.controller.bots)[botindex].community.postUserComment(new SteamID(receiverSteamID), comment, (error) => { // Post comment
                    if (botindex == 0) var thisbot = "Main"; // Call bot 0 the main bot in logging messages
                        else var thisbot = `Bot ${botindex}`;


                    /* --------- Handle errors thrown by this comment attempt --------- */
                    if (error) require("../helpers/handleCommentErrors.js").handleCommentErrors(error, botindex, "postUserComment", receiverSteamID, acpEntry.amount);


                    /* --------- No error, run this on every successful iteration --------- */
                    if (acpEntry.thisIteration == 0) { // Stuff below should only run in first iteration
                        if (commandHandler.data.proxies.length > 1) logger("info", `${logger.colors.fggreen}[${thisbot}] ${acpEntry.amount} Comment(s) requested. Comment on ${receiverSteamID} with proxy ${Object.values(commandHandler.controller.bots)[botindex].loginData.proxyIndex}: ${String(comment).split("\n")[0]}`);
                            else logger("info", `${logger.colors.fggreen}[${thisbot}] ${acpEntry.amount} Comment(s) requested. Comment on ${receiverSteamID}: ${String(comment).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments


                        // Send success message or estimated wait time message
                        if (acpEntry.amount == 1) {
                            respond(commandHandler.data.lang.commentsuccess1);

                            acpEntry.status = "cooldown";
                            commandHandler.controller.info.commentcounter += 1;

                        } else {
                            var waittime = ((acpEntry.amount - 1) * config.commentdelay) / 1000; // Calculate estimated wait time (first comment is instant -> remove 1 from numberOfComments)
                            var waittimeunit = "seconds";
                            if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes"; }
                            if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours"; }

                            respond(commandHandler.data.lang.commentprocessstarted.replace("numberOfComments", acpEntry.amount).replace("waittime", Number(Math.round(waittime+"e"+3)+"e-"+3)).replace("timeunit", waittimeunit));
                        }


                        /* --------- Give user cooldown --------- */
                        // add estimated wait time in ms to start the cooldown after the last received comment
                        commandHandler.data.lastCommentDB.update({ id: acpEntry.requestedby }, { $set: { time: Date.now() + ((acpEntry.amount - 1) * config.commentdelay) } }, {}, (err) => {
                            if (err) logger("error", "Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err);
                        });

                    } else { // Stuff below should only run for child accounts
                        if (!error) {
                            if (commandHandler.data.proxies.length > 1) logger("info", `[${thisbot}] Comment ${acpEntry.thisIteration + 1}/${acpEntry.amount} on ${receiverSteamID} with proxy ${this.loginData.proxyIndex}: ${String(comment).split("\n")[0]}`);
                                else logger("info", `[${thisbot}] Comment ${acpEntry.thisIteration + 1}/${acpEntry.amount} on ${receiverSteamID}: ${String(comment).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments
                        }
                    }


                    /* --------- Run this code on last iteration --------- */
                    if (acpEntry.thisIteration == acpEntry.amount - 1 && acpEntry.amount > 1) { // I didn't put this code in the exit function of syncLoop as this message is not always the last message, it can be replaced by commandHandler.data.lang.commentsuccess1 as well as by the all proxies failed check

                        // Call retryComments helper that will retry failed comments if retryFailedComments is enabled in advancedconfig.json
                        require("../helpers/retryComments.js").retryComments(receiverSteamID, steamID, lang, res, respond, (finished) => {
                            if (finished) {
                                var failedcmdreference = "";

                                if (Object.keys(commandHandler.controller.activeRequests[receiverSteamID].failed).length > 0) {
                                    failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems";
                                }

                                if (!res) respond(`${commandHandler.data.lang.commentsuccess2.replace("failedamount", Object.keys(commandHandler.controller.activeRequests[receiverSteamID].failed).length).replace("numberOfComments", acpEntry.amount)}\n${failedcmdreference}`); // Only send if not a webrequest

                                acpEntry.status = "cooldown";
                                commandHandler.controller.info.commentcounter += acpEntry.amount - Object.keys(commandHandler.controller.activeRequests[receiverSteamID].failed).length; // Add numberOfComments minus failedamount to commentcounter
                            }
                        });
                    }


                    loop.next(); // Continue with next iteration
                });
            });


            /* --------- Loop Management --------- */
            accountOrderIndex++;

            if (accountOrderIndex + 1 > Object.keys(commandHandler.controller.bots).length) {
                const lastaccountint = String(acpEntry.accounts[accountOrderIndex - 1]); // Save last used account (which is -1 because k++ was already executed again)

                accountOrderIndex = 0; // Reset accountOrderIndex if it is greater than the amount of accounts

                // shuffle accountorder again if randomizeAccounts is true but check that the last used account isn't the first one
                if (config.randomizeAccounts) acpEntry.accounts.sort(() => Math.random() - 0.5);
                if (config.randomizeAccounts && acpEntry.accounts[0] == lastaccountint) acpEntry.accounts.push(acpEntry.accounts.shift()); // If lastaccountint is first account in new order then move it to the end
            }

        }, config.commentdelay * (i > 0)); // Delay every comment that is not the first one
    });
}