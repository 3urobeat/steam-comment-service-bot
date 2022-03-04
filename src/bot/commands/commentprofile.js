/*
 * File: comment.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 10:56:38
 * Author: 3urobeat
 * 
 * Last Modified: 04.03.2022 16:01:09
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamID    = require('steamid');

const updater    = require('../../updater/updater.js'); //paths get a 10/10 from me
const mainfile   = require("../main.js");
const loginfile  = require("../../controller/login.js");
const controller = require("../../controller/controller.js");


/**
 * Comments on a profile
 * @param {String} chatmsg The chat message recieved
 * @param {SteamID} steamID The steamID object of the requesting user
 * @param {Array} args The command arguments
 * @param {Object} lang The language object
 * @param {*} res The res parameter if request is coming from the webserver, otherwise null
 * @param {Object} lastcommentdoc The lastcomment db document of the requesting user 
 */
module.exports.run = (chatmsg, steamID, args, lang, res, lastcommentdoc) => {
    var requesterSteamID = new SteamID(String(steamID)).getSteamID64();
    var recieverSteamID  = requesterSteamID;
    var ownercheck       = cachefile.ownerid.includes(requesterSteamID);

    
    //TODO: needs to be replaced with respond module
    function respond(rescode, msg) { //we need a function to get each response back to the user (web request & steam chat)
        if (typeof (rescode) != "number") return logger("error", "comment respond call has invalid response code: rescode must be a Number!")

        if (res) {
            logger("info", "Web Comment Request response: " + msg.replace("/me ", "")) //replace steam chat format prefix with nothing if this message should use one
            res.status(rescode).send(msg + "</br></br>The log will contain further information and errors (if one should occur). You can display the log in your browser by visiting: /output")
        } else {
            chatmsg(requesterSteamID, msg)
        }
    }


    //Check for command spamming
    if (!ownercheck && Date.now() - mainfile.lastcommentrequestmsg[requesterSteamID] < 2500) return chatmsg(lang.pleasedontspam);
    mainfile.lastcommentrequestmsg[requesterSteamID] = Date.now() //add this usage to the obj


    /* --------- Check for disabled comment cmd or if update is queued --------- */
    if (updater.activeupdate) return respond(403, lang.commentactiveupdate);
    if (config.maxComments == 0 && !ownercheck) return respond(403, lang.commentcmdowneronly)


    /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */
    var { maxRequestAmount, numberOfComments, profileID, quotesArr } = require("../helpers/getCommentArgs.js").getCommentArgs(args, steamID, requesterSteamID, lang, respond);

    if (!maxRequestAmount && !numberOfComments && !profileID && !quotesArr) return; //looks like the helper aborted the request

    //Update recieverSteamID if profileID was returned
    if (profileID && profileID != requesterSteamID) {
        logger("debug", "Custom profileID provided that is != requesterSteamID, modifying steamID object...");

        steamID.accountid = parseInt(new SteamID(args[1]).accountid) //edit accountid value of steamID parameter of friendMessage event and replace requester's accountid with the new one
        var recieverSteamID = new SteamID(String(steamID)).getSteamID64(); //update recieverSteamID
    }


    /* --------- Check for cooldowns and calculate the amount of accounts needed for this request ---------  */
    var { allAccounts, accountsNeeded } = require("../helpers/checkAvailability.js").checkAvailability(recieverSteamID, numberOfComments, lang, res, lastcommentdoc, respond);

    if (!allAccounts && !accountsNeeded) return; //looks like the helper aborted the request

    
    /* --------- Get account order and check if user is friend with limited accounts ---------  */
    var accountOrder = require("../helpers/getAccountOrder.js").getAccountOrder(true, allAccounts, accountsNeeded, numberOfComments, requesterSteamID, recieverSteamID, lang, respond);

    if (!accountOrder) return; //looks like the helper aborted the request


    /* --------- Check if profile is private ---------  */
    controller.communityobject[0].getSteamUser(steamID, (err, user) => {
        if (err) {
            logger("warn", `[Main] comment check for private account error: ${err}\n       Trying to comment anyway and hoping no error occurs...`) //this can happen sometimes and most of the times commenting will still work
        } else {
            logger("debug", "Successfully checked privacyState of recieving user: " + user.privacyState);
            
            if (user.privacyState != "public") { 
                return respond(403, lang.commentuserprofileprivate) //only check if getting the Steam user's data didn't result in an error
            }
        }

        /* --------- Start commenting --------- */
        var alreadySkippedProxies = []
        var lastQuotes            = [] //array to track last quotes used

        //Prepare new empty entry in failedcomments obj
        mainfile.failedcomments[recieverSteamID] = {}

        //Make new entry in activecommentprocess obj to register this comment process
        mainfile.activecommentprocess[recieverSteamID] = { 
            status: "active",
            type: "profile",
            amount: numberOfComments,
            requestedby: requesterSteamID,
            accounts: accountOrder,
            until: Date.now() + (numberOfComments * config.commentdelay) //botaccountcooldown should start after the last comment was processed
        }


        //Comment function that will be called numberOfComments times by the loop below
        function comment(botindex, i) {
            setTimeout(() => {

                /* --------- Check for critical errors and decide if this iteration should still run --------- */
                var { skipIteration, aSP } = require("../helpers/handleCommentErrors.js").handleCriticalCommentErrors(botindex, i, "postUserComment", recieverSteamID, alreadySkippedProxies, numberOfComments, res, lang, respond);
                if (aSP) alreadySkippedProxies = aSP;

                logger("debug", `bot${botindex} does comment ${i}: ${config.commentdelay * i}ms timeout is over: skipIteration: ${skipIteration}`);

                if (skipIteration) return; //skip iteration or stop here with every other iteration if we should not attempt to comment anymore


                /* --------- Try to comment --------- */
                require("../helpers/getQuote.js").getQuote(quotesArr, lastQuotes, (comment) => { //get a random quote to comment with and wait for callback to ensure a quote has been found before trying to comment
                    
                    controller.communityobject[botindex].postUserComment(steamID, comment, (error) => { //post comment
                        if (botindex == 0) var thisbot = `Main`; //call bot 0 the main bot in logging messages
                            else var thisbot = `Bot ${botindex}`;

                        /* --------- Handle errors thrown by this comment attempt --------- */
                        if (error) {
                            if (require("../helpers/handleCommentErrors.js").handleCommentErrors(error, botindex, i, "postUserComment", recieverSteamID, numberOfComments)) return;
                        }

                        
                        /* --------- No error, run this on every successful iteration --------- */
                        if (i == 0) { //Stuff below should only run in first iteration (main bot)
                            //converting steamID again to SteamID64 because it could have changed by a profileid argument
                            if (loginfile.proxies.length > 1) logger("info", `${logger.colors.fggreen}[${thisbot}] ${numberOfComments} Comment(s) requested. Comment on ${recieverSteamID} with proxy ${loginfile.additionalaccinfo[botindex].thisproxyindex}: ${String(comment).split("\n")[0]}`)
                                else logger("info", `${logger.colors.fggreen}[${thisbot}] ${numberOfComments} Comment(s) requested. Comment on ${recieverSteamID}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments

                            
                            //Send success message or estimated wait time message
                            if (numberOfComments == 1) {
                                respond(200, lang.commentsuccess1)

                                mainfile.activecommentprocess[recieverSteamID].status = "cooldown"
                                mainfile.commentcounter += 1

                            } else {
                                var waittime = ((numberOfComments - 1) * config.commentdelay) / 1000 //calculate estimated wait time (first comment is instant -> remove 1 from numberOfComments)
                                var waittimeunit = "seconds"
                                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }

                                respond(200, lang.commentprocessstarted.replace("numberOfComments", numberOfComments).replace("waittime", Number(Math.round(waittime+'e'+3)+'e-'+3)).replace("timeunit", waittimeunit))
                            }


                            /* --------- Give user cooldown --------- */ 
                            //add estimated wait time in ms to start the cooldown after the last recieved comment
                            controller.lastcomment.update({ id: requesterSteamID }, { $set: { time: Date.now() + ((numberOfComments - 1) * config.commentdelay) } }, {}, (err) => { 
                                if (err) logger("error", "Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err) 
                            })

                        } else { //Stuff below should only run for child accounts
                            if (!error) {
                                if (loginfile.proxies.length > 1) logger("info", `[${thisbot}] Comment ${i + 1}/${numberOfComments} on ${recieverSteamID} with proxy ${loginfile.additionalaccinfo[botindex].thisproxyindex}: ${String(comment).split("\n")[0]}`)
                                    else logger("info", `[${thisbot}] Comment ${i + 1}/${numberOfComments} on ${recieverSteamID}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments
                            }
                        }


                        /* --------- Run this code on last iteration --------- */
                        if (i == numberOfComments - 1 && numberOfComments > 1) { //last iteration (run only when more than one comment is requested)
                            var failedcmdreference = ""

                            if (Object.keys(mainfile.failedcomments[recieverSteamID]).length > 0) {
                                failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems" 
                            }

                            if (!res) respond(200, `${lang.commentsuccess2.replace("failedamount", Object.keys(mainfile.failedcomments[recieverSteamID]).length).replace("numberOfComments", numberOfComments)}\n${failedcmdreference}`); //only send if not a webrequest

                            mainfile.activecommentprocess[recieverSteamID].status = "cooldown"
                            mainfile.commentcounter += numberOfComments - Object.keys(mainfile.failedcomments[recieverSteamID]).length //add numberOfComments minus failedamount to commentcounter
                        }
                    })
                })
            }, config.commentdelay * i); //delay every comment
        }


        //Call comment function numberOfComments times
        var botindex = 0; //The bot account to be used

        logger("debug", "Added user to activecommentprocess obj, starting comment loop...");

        for (var i = 0; i < numberOfComments; i++) {
            comment(accountOrder[botindex], i) //comment with botindex on user profile

            botindex++;

            if (botindex + 1 > Object.keys(controller.communityobject).length) {
                const lastaccountint = String(accountOrder[botindex - 1]) //save last used account (which is -1 because k++ was already executed again)

                if (Object.keys(controller.communityobject).length > 1) logger("debug", "All accounts used, resetting botindex...");
                
                botindex = 0; //reset botindex if it is greater than the amount of accounts

                //shuffle accountorder again if randomizeAccounts is true but check that the last used account isn't the first one
                if (config.randomizeAccounts) accountOrder.sort(() => Math.random() - 0.5);
                if (config.randomizeAccounts && accountOrder[0] == lastaccountint) accountOrder.push(accountOrder.shift()) //if lastaccountint is first account in new order then move it to the end
            }
        }
    })
}