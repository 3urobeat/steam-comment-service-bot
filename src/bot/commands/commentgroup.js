/*
 * File: commentgroup.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 07.03.2022 11:26:27
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
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
 * Comments in a group
 * @param {String} chatmsg The chat message recieved
 * @param {SteamID} steamID The steamID object of the requesting user
 * @param {Array} args The command arguments
 * @param {Object} lang The language object
 * @param {*} res The res parameter if request is coming from the webserver, otherwise null
 * @param {Object} lastcommentdoc The lastcomment db document of the requesting user 
 */
module.exports.run = async (chatmsg, steamID, args, lang, res, lastcommentdoc) => {
    var requesterSteamID = new SteamID(String(steamID)).getSteamID64();
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
    if (!ownercheck && Date.now() - mainfile.lastcommentrequestmsg[requesterSteamID] < 2500) return respond(403, lang.pleasedontspam);
    mainfile.lastcommentrequestmsg[requesterSteamID] = Date.now() //add this usage to the obj


    /* --------- Check for disabled comment cmd or if update is queued --------- */
    if (updater.activeupdate) return respond(403, lang.commentactiveupdate);
    if (config.maxComments == 0 && !ownercheck) return respond(403, lang.commentcmdowneronly)

    
    /* --------- Calculate maxRequestAmount and get arguments from comment request --------- */ 
    var { maxRequestAmount, numberOfComments, profileID, quotesArr } = await require("../helpers/getCommentArgs.js").getCommentArgs(args, steamID, requesterSteamID, SteamID.Type.CLAN, lang, respond);
    var recieverSteamID = profileID;

    if (!maxRequestAmount && !numberOfComments && !quotesArr) return; //looks like the helper aborted the request (don't check for recieverSteamID as it has a default value set above)
    if (recieverSteamID == requesterSteamID) return respond(400, "You need to provide a group link or groupID!"); //send custom error message if user forgot to provide group id


    /* --------- Check for cooldowns and calculate the amount of accounts needed for this request ---------  */
    var { allAccounts, accountsNeeded } = require("../helpers/checkAvailability.js").checkAvailability(recieverSteamID, numberOfComments, lang, res, lastcommentdoc, respond);

    if (!allAccounts && !accountsNeeded) return; //looks like the helper aborted the request


    /* --------- Get account order and check if user is friend with limited accounts ---------  */
    var accountOrder = require("../helpers/getAccountOrder.js").getAccountOrder(false, allAccounts, accountsNeeded, numberOfComments, requesterSteamID, recieverSteamID, lang, respond);

    if (!accountOrder) return; //looks like the helper aborted the request


    /* --------- Start commenting --------- */
    var thisIteration         = 0;
    var botindex              = 0;
    var alreadySkippedProxies = []
    var lastQuotes            = [] //array to track last quotes used

    //Prepare new empty entry in failedcomments obj
    mainfile.failedcomments[recieverSteamID] = {}

    //Make new entry in activecommentprocess obj to register this comment process
    mainfile.activecommentprocess[recieverSteamID] = { 
        status: "active",
        type: "group",
        amount: numberOfComments,
        requestedby: requesterSteamID,
        accounts: accountOrder,
        thisIteration: thisIteration,
        until: Date.now() + (numberOfComments * config.commentdelay) //botaccountcooldown should start after the last comment was processed
    }

    logger("debug", "Added user to activecommentprocess obj, starting comment interval...");


    //Comment function that will be called numberOfComments times by the loop below
    mainfile.activecommentprocess[recieverSteamID]["interval"] = setInterval(() => {
        
        //Get which botindex we should use for this iteration from accountOrder
        var thisindex = accountOrder[botindex];

        //Check if interval ran numberOfComments times and stop comment process
        if (thisIteration >= numberOfComments) return clearInterval(mainfile.activecommentprocess[recieverSteamID].interval);


        /* --------- Check for critical errors and decide if this iteration should still run --------- */
        var { skipIteration, aSP } = require("../helpers/handleCommentErrors.js").handleCriticalCommentErrors(thisindex, thisIteration, "postGroupComment", recieverSteamID, alreadySkippedProxies, numberOfComments, res, lang, respond);
        if (aSP) alreadySkippedProxies = aSP;

        logger("debug", `bot${thisindex} does comment ${thisIteration}: ${config.commentdelay * thisIteration}ms timeout is over: skipIteration: ${skipIteration}`);

        if (skipIteration) return; //skip iteration or stop here with every other iteration if we should not attempt to comment anymore


        /* --------- Try to comment --------- */
        require("../helpers/getQuote.js").getQuote(quotesArr, lastQuotes, (comment) => { //get a random quote to comment with and wait for callback to ensure a quote has been found before trying to comment
            
            controller.communityobject[thisindex].postGroupComment(steamID, comment, (error) => { //post comment
                if (thisindex == 0) var thisbot = `Main`; //call bot 0 the main bot in logging messages
                    else var thisbot = `Bot ${thisindex}`;


                /* --------- Handle errors thrown by this comment attempt --------- */
                if (error) {
                    if (require("../helpers/handleCommentErrors.js").handleCommentErrors(error, thisindex, thisIteration, "postGroupComment", recieverSteamID, numberOfComments)) return;
                }

                
                /* --------- No error, run this on every successful iteration --------- */
                if (thisIteration == 0) { //Stuff below should only run in first iteration (main bot)
                    //converting steamID again to SteamID64 because it could have changed by a profileid argument
                    if (loginfile.proxies.length > 1) logger("info", `${logger.colors.fggreen}[${thisbot}] ${numberOfComments} Comment(s) requested. Comment in group ${recieverSteamID} with proxy ${loginfile.additionalaccinfo[thisindex].thisproxyindex}: ${String(comment).split("\n")[0]}`)
                        else logger("info", `${logger.colors.fggreen}[${thisbot}] ${numberOfComments} Comment(s) requested. Comment in group ${recieverSteamID}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments

                    
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
                        if (loginfile.proxies.length > 1) logger("info", `[${thisbot}] Comment ${thisIteration + 1}/${numberOfComments} in group ${recieverSteamID} with proxy ${loginfile.additionalaccinfo[thisindex].thisproxyindex}: ${String(comment).split("\n")[0]}`)
                            else logger("info", `[${thisbot}] Comment ${thisIteration + 1}/${numberOfComments} in group ${recieverSteamID}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments
                    }
                }


                /* --------- Run this code on last iteration --------- */
                if (thisIteration == numberOfComments - 1 && numberOfComments > 1) { //last iteration (run only when more than one comment is requested)
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


        /* --------- Increase iteration counter, use next account and reset botindex if needed --------- */
        thisIteration++;
        botindex++;

        mainfile.activecommentprocess[recieverSteamID].thisIteration = thisIteration;

        if (botindex + 1 > Object.keys(controller.communityobject).length) {
            const lastaccountint = String(accountOrder[botindex - 1]) //save last used account (which is -1 because k++ was already executed again)
            
            botindex = 0; //reset botindex if it is greater than the amount of accounts

            //shuffle accountorder again if randomizeAccounts is true but check that the last used account isn't the first one
            if (config.randomizeAccounts) accountOrder.sort(() => Math.random() - 0.5);
            if (config.randomizeAccounts && accountOrder[0] == lastaccountint) accountOrder.push(accountOrder.shift()) //if lastaccountint is first account in new order then move it to the end
        }
    }, config.commentdelay); //delay every comment
}