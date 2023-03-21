/*
 * File: commentprofile.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 20.03.2023 22:03:43
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID    = require("steamid");

const mainfile   = require("../main.js");
const loginfile  = require("../../controller/login.js");
const controller = require("../../controller/controller.js");


/**
 * Comments on a profile
 * @param {String} chatmsg The chat message received
 * @param {SteamID} steamID The steamID object of the requesting user
 * @param {Array} args The command arguments
 * @param {Object} lang The language object
 * @param {*} res The res parameter if request is coming from the webserver, otherwise null
 * @param {Object} lastcommentdoc The lastcomment db document of the requesting user
 */
module.exports.run = async (chatmsg, steamID, args, lang, res, lastcommentdoc) => {
    var requesterSteamID = new SteamID(String(steamID)).getSteamID64();
    var receiverSteamID  = requesterSteamID;
    var ownercheck       = cachefile.ownerid.includes(requesterSteamID);


    // TODO: needs to be replaced with respond module
    function respond(rescode, msg) { // We need a function to get each response back to the user (web request & steam chat)
        if (typeof (rescode) != "number") return logger("error", "comment respond call has invalid response code: rescode must be a Number!");

        if (res) {
            logger("info", "Web Comment Request response: " + msg.replace("/me ", "")); // Replace steam chat format prefix with nothing if this message should use one
            res.status(rescode).send(msg + "</br></br>The log will contain further information and errors (if one should occur). You can display the log in your browser by visiting: /output");
        } else {
            chatmsg(requesterSteamID, msg);
        }
    }


    // Check for command spamming
    if (!ownercheck && Date.now() - mainfile.lastcommentrequestmsg[requesterSteamID] < 2500) return respond(403, lang.pleasedontspam);
    mainfile.lastcommentrequestmsg[requesterSteamID] = Date.now(); // Add this usage to the obj


    /* --------- Check for disabled comment cmd or if update is queued --------- */
    if (controller.activeRelog) return respond(403, lang.commentactiverelog);
    if (config.maxComments == 0 && !ownercheck) return respond(403, lang.commentcmdowneronly);


    /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */
    var { maxRequestAmount, numberOfComments, profileID, quotesArr } = await require("../helpers/getCommentArgs.js").getCommentArgs(args, steamID, requesterSteamID, SteamID.Type.INDIVIDUAL, lang, respond);

    if (!maxRequestAmount && !numberOfComments && !quotesArr) return; // Looks like the helper aborted the request


    // Update receiverSteamID if profileID was returned
    if (profileID && profileID != requesterSteamID) {
        logger("debug", "Custom profileID provided that is != requesterSteamID, modifying steamID object...");

        steamID.accountid = parseInt(new SteamID(profileID).accountid); // Edit accountid value of steamID parameter of friendMessage event and replace requester's accountid with the new one
        var receiverSteamID = new SteamID(String(steamID)).getSteamID64(); // Update receiverSteamID
    }


    /* --------- Check for cooldowns and calculate the amount of accounts needed for this request ---------  */
    var { allAccounts, accountsNeeded } = require("../helpers/checkAvailability.js").checkAvailability(receiverSteamID, numberOfComments, false, lang, res, lastcommentdoc, respond);

    if (!allAccounts && !accountsNeeded) return; // Looks like the helper aborted the request


    /* --------- Get account order and check if user is friend with limited accounts ---------  */
    var accountOrder = require("../helpers/getAccountOrder.js").getAccountOrder(true, allAccounts, accountsNeeded, numberOfComments, requesterSteamID, receiverSteamID, lang, respond);

    if (!accountOrder) return; // Looks like the helper aborted the request


    /* --------- Check if profile is private ---------  */
    controller.communityobject[0].getSteamUser(steamID, (err, user) => {
        if (err) {
            logger("warn", `[Main] comment check for private account error: ${err}\n       Trying to comment anyway and hoping no error occurs...`); // This can happen sometimes and most of the times commenting will still work
        } else {
            logger("debug", "Successfully checked privacyState of receiving user: " + user.privacyState);

            if (user.privacyState != "public") {
                return respond(403, lang.commentuserprofileprivate); // Only check if getting the Steam user's data didn't result in an error
            }
        }

        // Prepare new empty entry in failedcomments obj
        mainfile.failedcomments[receiverSteamID] = {};

        // Make new entry in activecommentprocess obj to register this comment process
        mainfile.activecommentprocess[receiverSteamID] = {
            status: "active",
            type: "profile",
            amount: numberOfComments,
            quotesArr: quotesArr,
            requestedby: requesterSteamID,
            accounts: accountOrder,
            thisIteration: -1, // Set to -1 so that first iteration will increase it to 0
            retryAttempt: 0,
            until: Date.now() + (numberOfComments * config.commentdelay) // Botaccountcooldown should start after the last comment was processed
        };

        logger("debug", "Added user to activecommentprocess obj, starting comment loop...");

        this.comment(receiverSteamID, steamID, lang, res, respond); // Start commenting

    });
};


// Internal function that actually does the commenting
module.exports.comment = (receiverSteamID, steamID, lang, res, respond) => {

    var acpEntry = mainfile.activecommentprocess[receiverSteamID]; // Make using the obj shorter

    var accountOrderIndex = 0; // The bot account to be used

    var alreadySkippedProxies = []; // Array to track proxies that were skipped
    var lastQuotes            = []; // Array to track last quotes used


    // Comment numberOfComments times using our syncLoop helper
    require(srcdir + "/controller/helpers/syncLoop.js").syncLoop(acpEntry.amount - (acpEntry.thisIteration + 1), (loop, i) => { // eslint-disable-line no-unused-vars
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

                controller.communityobject[botindex].postUserComment(steamID, comment, (error) => { // Post comment
                    if (botindex == 0) var thisbot = "Main"; // Call bot 0 the main bot in logging messages
                        else var thisbot = `Bot ${botindex}`;


                    /* --------- Handle errors thrown by this comment attempt --------- */
                    if (error) require("../helpers/handleCommentErrors.js").handleCommentErrors(error, botindex, "postUserComment", receiverSteamID, acpEntry.amount);


                    /* --------- No error, run this on every successful iteration --------- */
                    if (acpEntry.thisIteration == 0) { // Stuff below should only run in first iteration
                        if (loginfile.proxies.length > 1) logger("info", `${logger.colors.fggreen}[${thisbot}] ${acpEntry.amount} Comment(s) requested. Comment on ${receiverSteamID} with proxy ${loginfile.additionalaccinfo[botindex].proxyIndex}: ${String(comment).split("\n")[0]}`);
                            else logger("info", `${logger.colors.fggreen}[${thisbot}] ${acpEntry.amount} Comment(s) requested. Comment on ${receiverSteamID}: ${String(comment).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments


                        // Send success message or estimated wait time message
                        if (acpEntry.amount == 1) {
                            respond(200, lang.commentsuccess1);

                            acpEntry.status = "cooldown";
                            mainfile.commentcounter += 1;

                        } else {
                            var waittime = ((acpEntry.amount - 1) * config.commentdelay) / 1000; // Calculate estimated wait time (first comment is instant -> remove 1 from numberOfComments)
                            var waittimeunit = "seconds";
                            if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes"; }
                            if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours"; }

                            respond(200, lang.commentprocessstarted.replace("numberOfComments", acpEntry.amount).replace("waittime", Number(Math.round(waittime+"e"+3)+"e-"+3)).replace("timeunit", waittimeunit));
                        }


                        /* --------- Give user cooldown --------- */
                        // add estimated wait time in ms to start the cooldown after the last received comment
                        controller.lastcomment.update({ id: acpEntry.requestedby }, { $set: { time: Date.now() + ((acpEntry.amount - 1) * config.commentdelay) } }, {}, (err) => {
                            if (err) logger("error", "Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err);
                        });

                    } else { // Stuff below should only run for child accounts
                        if (!error) {
                            if (loginfile.proxies.length > 1) logger("info", `[${thisbot}] Comment ${acpEntry.thisIteration + 1}/${acpEntry.amount} on ${receiverSteamID} with proxy ${loginfile.additionalaccinfo[botindex].proxyIndex}: ${String(comment).split("\n")[0]}`);
                                else logger("info", `[${thisbot}] Comment ${acpEntry.thisIteration + 1}/${acpEntry.amount} on ${receiverSteamID}: ${String(comment).split("\n")[0]}`); // Splitting \n to only get first line of multi line comments
                        }
                    }


                    /* --------- Run this code on last iteration --------- */
                    if (acpEntry.thisIteration == acpEntry.amount - 1 && acpEntry.amount > 1) { // I didn't put this code in the exit function of syncLoop as this message is not always the last message, it can be replaced by lang.commentsuccess1 as well as by the all proxies failed check

                        // Call retryComments helper that will retry failed comments if retryFailedComments is enabled in advancedconfig.json
                        require("../helpers/retryComments.js").retryComments(receiverSteamID, steamID, lang, res, respond, (finished) => {
                            if (finished) {
                                var failedcmdreference = "";

                                if (Object.keys(mainfile.failedcomments[receiverSteamID]).length > 0) {
                                    failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems";
                                }

                                if (!res) respond(200, `${lang.commentsuccess2.replace("failedamount", Object.keys(mainfile.failedcomments[receiverSteamID]).length).replace("numberOfComments", acpEntry.amount)}\n${failedcmdreference}`); // Only send if not a webrequest

                                acpEntry.status = "cooldown";
                                mainfile.commentcounter += acpEntry.amount - Object.keys(mainfile.failedcomments[receiverSteamID]).length; // Add numberOfComments minus failedamount to commentcounter
                            }
                        });
                    }


                    loop.next(); // Continue with next iteration
                });
            });


            /* --------- Loop Management --------- */
            accountOrderIndex++;

            if (accountOrderIndex + 1 > Object.keys(controller.communityobject).length) {
                const lastaccountint = String(acpEntry.accounts[accountOrderIndex - 1]); // Save last used account (which is -1 because k++ was already executed again)

                accountOrderIndex = 0; // Reset accountOrderIndex if it is greater than the amount of accounts

                // shuffle accountorder again if randomizeAccounts is true but check that the last used account isn't the first one
                if (config.randomizeAccounts) acpEntry.accounts.sort(() => Math.random() - 0.5);
                if (config.randomizeAccounts && acpEntry.accounts[0] == lastaccountint) acpEntry.accounts.push(acpEntry.accounts.shift()); // If lastaccountint is first account in new order then move it to the end
            }

        }, config.commentdelay * (i > 0)); // Delay every comment that is not the first one
    });
};