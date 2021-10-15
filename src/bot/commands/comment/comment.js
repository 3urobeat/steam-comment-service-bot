/*
 * File: comment.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 15.10.2021 21:43:35
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


//Needs to be made modular! Mix with groupcomment.js

/**
 * Runs the comment command
 * @param {function} chatmsg The chatmsg function from bot.js or null if called from webserver
 * @param {SteamID} steamID The steamID object of the requesting user
 * @param {Array} args The args array made from the arguments the user provided
 * @param res The webserver response or null if called from friendMessage.js
 * @param lastcommentdoc The nedb document of lastcomment.db of the last request of this user
 */
module.exports.run = (chatmsg, steamID, args, res, lastcommentdoc) => {
    const SteamID  = require('steamid');

    var updater    = require('../../../updater/updater.js'); //paths get a 10/10 from me
    var mainfile   = require("../../main.js")
    var loginfile  = require("../../../controller/login.js")
    var controller = require("../../../controller/controller.js");
    var round      = require("../../../controller/helpers/round.js")

    var accstoadd  = []
    var lastquotes = [] //array to track last comments

    var lang       = mainfile.lang
    
    
    var requesterSteamID = new SteamID(String(steamID)).getSteamID64() //save steamID of comment requesting user so that messages are being send to the requesting user and not to the reciever if a profileid has been provided

    
    function respondmethod(rescode, msg) { //we need a function to get each response back to the user (web request & steam chat)
        if (typeof (rescode) != "number") return logger("error", "comment respondmethod call has invalid response code: rescode must be a Number!")

        if (res) {
            logger("info", "Web Comment Request response: " + msg.replace("/me ", "")) //replace steam chat format prefix with nothing if this message should use one
            res.status(rescode).send(msg + "</br></br>The log will contain further information and errors (if one should occur). You can display the log in your browser by visiting: /output")
        } else {
            chatmsg(requesterSteamID, msg)
        }
    }

    var ownercheck = config.ownerid.includes(requesterSteamID)
    var quoteselection = mainfile.quotes

    /* --------- Check for cmd spamming --------- */
    if (Date.now() - mainfile.lastcommentrequestmsg[requesterSteamID] < 2500 && !ownercheck) {
        return respondmethod(403, lang.pleasedontspam) }

    mainfile.lastcommentrequestmsg[requesterSteamID] = Date.now()

    /* --------- Check for disabled comment cmd or if update is queued --------- */
    if (updater.activeupdate) return respondmethod(403, lang.commentactiveupdate);
    if (config.allowcommentcmdusage === false && !ownercheck) return respondmethod(403, lang.commentcmdowneronly) 


    /* --------- Define command usage messages & maxrequestamount for each user's privileges --------- */ //Note: Web Comment Requests always use config.ownerid[0]
    var maxrequestamount = config.maxComments //set to default value and if the requesting user is an owner it gets changed below

    if (ownercheck) {
        maxrequestamount = config.maxOwnerComments

        if (Object.keys(controller.communityobject).length > 1 || maxrequestamount) var commentcmdusage = lang.commentcmdusageowner.replace("maxrequestamount", maxrequestamount) //typed confog here accidentaly and somehow found that really funny
            else var commentcmdusage = lang.commentcmdusageowner2
    } else {
        if (Object.keys(controller.communityobject).length > 1 || maxrequestamount) var commentcmdusage = lang.commentcmdusage.replace("maxrequestamount", maxrequestamount)
            else var commentcmdusage = lang.commentcmdusage2 
    }


    /* --------- Check numberofcomments argument if it was provided --------- */
    if (args[0] !== undefined) {
        if (isNaN(args[0])) { //isn't a number?
            if (args[0].toLowerCase() == "all") {
                args[0] = maxrequestamount //replace the argument with the max amount of comments this user is allowed to request
            } else {
                return respondmethod(400, lang.commentinvalidnumber.replace("commentcmdusage", commentcmdusage)) 
            }
        }

        if (args[0] > maxrequestamount) { //number is greater than maxrequestamount?
            return respondmethod(403, lang.commentrequesttoohigh.replace("maxrequestamount", maxrequestamount).replace("commentcmdusage", commentcmdusage)) 
        }

        var numberofcomments = args[0]

        //Code by: https://github.com/HerrEurobeat/ 


        /* --------- Check profileid argument if it was provided --------- */
        if (args[1] !== undefined) {
            if (config.ownerid.includes(requesterSteamID) || args[1] == requesterSteamID) { //check if user is a bot owner or if he provided his own profile id
                if (isNaN(args[1])) return respondmethod(400, lang.commentinvalidprofileid.replace("commentcmdusage", commentcmdusage))
                if (new SteamID(args[1]).isValid() == false) return respondmethod(400, lang.commentinvalidprofileid.replace("commentcmdusage", commentcmdusage))

                steamID.accountid = parseInt(new SteamID(args[1]).accountid) //edit accountid value of steamID parameter of friendMessage event and replace requester's accountid with the new one
            } else {
                respondmethod(403, lang.commentprofileidowneronly)
                return; 
            }
        }

        /* --------- Check if custom quotes were provided --------- */
        if (args[2] !== undefined) {
            quoteselection = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); //change default quotes to custom quotes
        }
        
    } //arg[0] if statement ends here

    var recieverSteamID = new SteamID(String(steamID)).getSteamID64(); //define recieverSteamID just like requesterSteamID to reduce future SteamID().getSteamID64() calls


    /* --------- Check if user did not provide numberofcomments --------- */
    if (numberofcomments === undefined) { //no numberofcomments given? ask again
        if (Object.keys(controller.botobject).length == 1 && maxrequestamount == 1) { 
            var numberofcomments = 1 //if only one account is active, set 1 automatically
        } else {
            respondmethod(400, lang.commentmissingnumberofcomments.replace("maxrequestamount", maxrequestamount).replace("commentcmdusage", commentcmdusage))
            return;
        } 
    }


    /* ------------------ Check for cooldowns ------------------ */
    if (config.commentcooldown !== 0 && !res) { //check for user specific cooldown (ignore if it is a webrequest)
        if ((Date.now() - lastcommentdoc.time) < (config.commentcooldown * 60000)) { //check if user has cooldown applied
            var remainingcooldown = Math.abs(((Date.now() - lastcommentdoc.time) / 1000) - (config.commentcooldown * 60))
            var remainingcooldownunit = "seconds"
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "minutes" }
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "hours" }

            respondmethod(403, lang.commentuseroncooldown.replace("commentcooldown", config.commentcooldown).replace("remainingcooldown", round(remainingcooldown, 2)).replace("timeunit", remainingcooldownunit)) //send error message
            return;
        } else {
            if (mainfile.activecommentprocess[recieverSteamID] && mainfile.activecommentprocess[recieverSteamID].status == "active") { //is the profile already recieving comments?
                return respondmethod(403, lang.commentuseralreadyrecieving)
            }
        }
    }


    /* --------- Calculate the amount of accounts needed for this request ---------  */
    //Method 1: Use as many accounts as possible to maximise the spread (Default)
    if (numberofcomments <= Object.keys(controller.communityobject).length) var accountsneeded = numberofcomments
        else var accountsneeded = Object.keys(controller.communityobject).length //cap accountsneeded at amount of accounts because if numberofcomments is greater we will start at account 1 again

    //Method 2: Use as few accounts as possible to maximise the amount of parallel requests (Not implemented yet, probably coming in 2.12)


    /* --------- Check if enough bot accounts are available for this rerquest --------- */
    logger("info", `Checking for available bot accounts for this request...`, false, false, logger.animation("loading"))

    //Sort activecommentprocess obj by highest until value, decreasing, so that we can tell the user how long he/she has to wait if not enough accounts were found
    let sortedvals = Object.keys(mainfile.activecommentprocess).sort((a, b) => {
        return mainfile.activecommentprocess[b].until - mainfile.activecommentprocess[a].until;
    })
    
    if (sortedvals.length > 0) mainfile.activecommentprocess = Object.assign(...sortedvals.map(k => ( {[k]: mainfile.activecommentprocess[k] } ) )) //map sortedvals back to object if array is not empty - credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/


    var whenavailable; //we will save the until value of the activecommentprocess entry that the user has to wait for here
    var allaccounts = [ ... Object.keys(controller.communityobject) ] //clone keys array of communityobject
    

    if (Object.keys(mainfile.activecommentprocess).length > 0) { //we only need to run the loop below if the obj is not empty
        Object.keys(mainfile.activecommentprocess).forEach((e) => { //loop over activecommentprocess obj and remove all valid entries from allaccounts array

            if (Date.now() < mainfile.activecommentprocess[e].until + (config.globalcommentcooldown * 60000)) { //check if entry is not finished yet

                mainfile.activecommentprocess[e].accounts.forEach((f) => { //loop over every account used in this request
                    allaccounts.splice(allaccounts.indexOf(f), 1) //remove that accountindex from the allaccounts array
                })

                if (allaccounts - mainfile.activecommentprocess[e].accounts.length < numberofcomments) {
                    whenavailable = mainfile.activecommentprocess[e].until + (config.globalcommentcooldown * 60000)
                }
            } else {
                delete mainfile.activecommentprocess[e] //remove entry from object if it is finished to keep the object clean
            }
        })
    }

    if (allaccounts.length < accountsneeded) { //if not enough accounts are available respond with error message
        //Calculate how far away whenavailable is from Date.now()
        var remaining     = Math.abs((whenavailable - Date.now()) / 1000)
        var remainingunit = "seconds"
        if (remaining > 120) { var remaining = remaining / 60; var remainingunit = "minutes" }
        if (remaining > 120) { var remaining = remaining / 60; var remainingunit = "hours" }

        //Respond with note about how many comments can be requested right now if more than 0 accounts are available
        if (allaccounts.length > 0) respondmethod(500, lang.commentnotenoughavailableaccs.replace("waittime", round(remaining, 2)).replace("timeunit", remainingunit).replace("availablenow", allaccounts.length)) //using allaccounts.length works for the "spread requests on as many accounts as possible" method
            else respondmethod(500, lang.commentzeroavailableaccs.replace("waittime", round(remaining, 2)).replace("timeunit", remainingunit))
            
        logger("info", `Found only ${allaccounts.length} available account(s) but ${accountsneeded} account(s) are needed to send ${numberofcomments} comments.`)
        return;
    } else {
        logger("info", `Found ${allaccounts.length} available account(s)!`)
    }


    /* --------- Check for steamcommunity related errors/limitations --------- */
    //Randomize order of accounts already here so that the new order will be used for the next limited & not friend check
    var accountorder = [ ... allaccounts ]
    if (config.randomizeAccounts) accountorder.sort(() => Math.random() - 0.5); //randomize order if enabled in config

    //Remove accounts that are not needed in this request
    accountorder = accountorder.slice(0, accountsneeded);

    //Check all accounts if they are limited and send user profile link if not friends
    accstoadd[requesterSteamID] = []

    for (let i in accountorder) {       
        if (Number(i) + 1 <= numberofcomments && Number(i) + 1 <= Object.keys(controller.botobject).length) { //only check if this acc is needed for a comment
            try {
                //if bot account limitations can be read from obj and bot account is limited and hasn't target account in friend list
                if (controller.botobject[accountorder[i]].limitations && controller.botobject[accountorder[i]].limitations.limited == true && !Object.keys(controller.botobject[accountorder[i]].myFriends).includes(recieverSteamID)) {
                    accstoadd[requesterSteamID].push(`\n ' https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[accountorder[i]].steamID)).getSteamID64()} '`) //...then push profile URL into array
                }
            } catch (err) {
                logger("error", "Error checking if comment requester is friend with limited bot accounts: " + err) //This error check was implemented as a temporary solution to fix this error (and should be fine since it seems that this error is rare and at least prevents from crashing the bot): https://github.com/HerrEurobeat/steam-comment-service-bot/issues/54
            }
        } 

        if (Number(i) + 1 == numberofcomments && accstoadd[requesterSteamID].length > 0 || Number(i) + 1 == Object.keys(controller.botobject).length && accstoadd[requesterSteamID].length > 0) { //if all accounts needed for this request are processed and at least one account to add was found
            respondmethod(403, lang.commentaddbotaccounts.replace("numberofcomments", numberofcomments) + "\n" + accstoadd[requesterSteamID]) //send message
            return; //stop right here criminal
        }
    }

    controller.communityobject[0].getSteamUser(steamID, (err, user) => { //check if profile is private
        if (err) {
            logger("warn", `[Main] comment check for private account error: ${err}\n       Trying to comment anyway and hoping no error occurs...`) //this can happen sometimes and most of the times commenting will still work
        } else {
            if (user.privacyState != "public") { 
                return respondmethod(403, lang.commentuserprofileprivate) //only check if getting the Steam user's data didn't result in an error
            }
        }
        

        /* --------- Actually start the commenting process --------- */
        var breakloop = false
        var alreadyskippedproxies = []
        mainfile.failedcomments[recieverSteamID] = {}

        mainfile.activecommentprocess[recieverSteamID] = { 
            status: "active",
            type: "profile",
            amount: numberofcomments,
            requestedby: requesterSteamID,
            accounts: accountorder,
            until: Date.now() + (numberofcomments * config.commentdelay) //globalcommentcooldown should start after the last comment was processed
        }


        function comment(k, i) {
            setTimeout(() => {
                /* --------- Check if this iteration should still run --------- */
                //(both checks are designed to run through every failed iteration)
                if (!mainfile.activecommentprocess[recieverSteamID] || mainfile.activecommentprocess[recieverSteamID].status == "aborted") { //Check if profile is not anymore in mainfile.activecommentprocess obj or status is not active anymore (for example by using !abort)
                    mainfile.failedcomments[recieverSteamID][`c${i} bot${k} p${loginfile.additionalaccinfo[k].thisproxyindex}`] = "Skipped because user aborted comment process." //push reason to mainfile.failedcomments obj
                    return; //Stop further execution and skip to next iteration
                }

                //regex is confusing so I hope this pattern isn't too terrible
                let regexPattern1 = /postUserComment error: Error: HTTP error 429.*\n.*/gm //Thanks: https://stackoverflow.com/a/49277142

                //skip comments on failed proxies
                var thisproxy = loginfile.additionalaccinfo[k].thisproxyindex
                var failedproxies = []
                
                Object.keys(mainfile.failedcomments[recieverSteamID]).forEach((e) => {
                    let affectedproxy = Number(e.split(" ")[2].replace("p", "")) //get the index of the affected proxy from the String

                    //Check if this entry matches a HTTP 429 error
                    if (regexPattern1.test(mainfile.failedcomments[recieverSteamID][e])) {
                        if (!failedproxies.includes(affectedproxy)) failedproxies.push(affectedproxy) //push proxy index to array if it isn't included yet
                    }
                })
                
                //push all comments that would be made by an account with an affected proxy to failedcomments
                if (failedproxies.includes(thisproxy)) {
                    if (!alreadyskippedproxies.includes(thisproxy)) { //only push if this proxy doesn't have a "skipped because of previous http 429 error" entry already 
                        logger("warn", `HTTP 429 error on proxy ${thisproxy} detected. Skipping all other comments on this proxy because they will fail too!`)
                        
                        if (!alreadyskippedproxies.includes(thisproxy)) alreadyskippedproxies.push(thisproxy)

                        //push all other comments by accounts with an affected proxy to failedcomments
                        var m = 0;

                        for (var l = 1; l <= numberofcomments; l++) { //start with l = 1 because of reasons
                            if (m + 1 > Object.keys(controller.communityobject).length) { //reset variable tracking communityobject index if it is greater than the amount of accounts
                                m = 0;
                            }

                            if (l > i && loginfile.additionalaccinfo[m].thisproxyindex == thisproxy) { //only push if we arrived at an iteration that uses a failed proxy and has not been sent already
                                mainfile.failedcomments[recieverSteamID][`c${l} bot${m} p${thisproxy}`] = `postUserComment error: Skipped because of previous HTTP 429 error.` //push reason to mainfile.failedcomments obj
                            }

                            m++
                        }

                        //sort failedcomments by comment number so that it is easier to read
                        let sortedvals = Object.keys(mainfile.failedcomments[recieverSteamID]).sort((a, b) => {
                            return Number(a.split(" ")[0].replace("c", "")) - Number(b.split(" ")[0].replace("c", ""));
                        })
                        
                        if (sortedvals.length > 0) mainfile.failedcomments[recieverSteamID] = Object.assign(...sortedvals.map(k => ( {[k]: mainfile.failedcomments[recieverSteamID][k] } ) )) //map sortedvals back to object if array is not empty - credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/
                    

                        //Send message to user if all proxies failed
                        if (failedproxies.length == loginfile.proxies.length) {
                            respondmethod(500, `${lang.comment429stop.replace("failedamount", numberofcomments - i + 1).replace("numberofcomments", numberofcomments)}\n\n${lang.commentfailedcmdreference}`) //add !failed cmd reference to message
                            logger("warn", "Stopped comment process because all proxies had a HTTP 429 (IP cooldown) error!")

                            breakloop = true;

                            mainfile.activecommentprocess[recieverSteamID].status = "error" //update status in activecommentprocess obj
                            mainfile.commentcounter += numberofcomments - (numberofcomments - i + 1) //add numberofcomments minus failedamount to commentcounter
                        }
                    }

                    return; //stop further execution
                }

                if (breakloop) return; //stop here with every other iteration if we should not attempt to comment anymore


                /* --------- Try to comment --------- */

                //Function to get random quote that wasn't chosen for a comment that is more recent than 5 comments
                function getQuote(quotecallback) {
                    var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; //smol function to get random string from array
                    let selection = randomstring(quoteselection); //get random quote for this iteration

                    if (lastquotes.length > 4) lastquotes.splice(0, 1) //remove first element from array if we have more than 4 in it
                    if (lastquotes.includes(selection)) getQuote(cb => { quotecallback(cb) }); //call this function again to get a new quote and pass cb to get callback from another execution back to the first one
                        else { 
                            if (quoteselection.length > 5) lastquotes.push(selection) //push this comment to lastquotes array to not get it the next 5 times if the quotes.txt has more than 5 quotes
                            quotecallback(selection) 
                        }
                }
                
                getQuote(comment => { //get a random quote to comment with and wait for callback to ensure a quote has been found before trying to comment
                    controller.communityobject[k].postUserComment(steamID, comment, (error) => { //post comment
                        if (k == 0) var thisbot = `Main`; else var thisbot = `Bot ${k}`; //call bot 0 the main bot in logging messages

                        /* --------- Handle errors thrown by this comment attempt --------- */
                        if (error) {
                            var errordesc = ""

                            switch (error) {
                                case "Error: HTTP error 429":
                                    errordesc = "This account has commented too often recently and has been blocked by Steam for a few minutes.\nPlease wait a moment and then try again."

                                    //add 5 minutes of cooldown to all bot accounts
                                    mainfile.activecommentprocess[recieverSteamID].accounts = mainfile.activecommentprocess[recieverSteamID].accounts.concat(Object.keys(controller.communityobject)) //add all bot accounts to this request and add cooldown since all will be blocked (IP)
                                    mainfile.activecommentprocess[recieverSteamID].until = Date.now() + 300000 //now + 5 min

                                    break;
                                case "Error: HTTP Error 502":
                                    errordesc = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us"
                                    break;
                                case "Error: HTTP Error 504":
                                    errordesc = "The steam servers are slow atm/are down. Check Steam's status here: https://steamstat.us"
                                    break;
                                case "Error: You've been posting too frequently, and can't make another post right now":
                                    errordesc = "This account has commented too often recently and has been blocked by Steam for a few minutes.\nPlease wait a moment and then try again."

                                    mainfile.activecommentprocess[recieverSteamID].until = Date.now() + 300000 //add 5 minutes to cooldown of accounts used in this request
                                    break;
                                case "Error: There was a problem posting your comment. Please try again":
                                    errordesc = "Unknown reason - please wait a minute and try again."
                                    break;
                                case "Error: The settings on this account do not allow you to add comments":
                                    errordesc = "The profile's comment section the account is trying to comment on is private or the account doesn't meet steams regulations."
                                    break;
                                case "Error: To post this comment, your account must have Steam Guard enabled":
                                    errordesc = "The account trying to comment doesn't seem to have steam guard enabled."
                                    break;
                                case "Error: socket hang up":
                                    errordesc = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us"
                                    break;
                                default:
                                    errordesc = "Please wait a moment and try again!"
                            }

                            if (i == 0) { //If the error occurred on the first comment then stop and return an error message
                                //Get last successful comment time to display it in error message
                                mainfile.lastsuccessfulcomment(cb => {
                                    let localoffset = new Date().getTimezoneOffset() * 60000

                                    if (loginfile.proxies.length > 1) {
                                        respondmethod(500, `${lang.commenterroroccurred}\n${errordesc}\n\nDetails: \n[${thisbot}] postUserComment error (using proxy ${loginfile.additionalaccinfo[k].thisproxyindex}): ${error}\n\nLast successful comment: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`)

                                        //Add local time offset (and make negative number postive/positive number negative because the function returns the difference between local time to utc) to cb to convert it to local time
                                        logger("error", `[${thisbot}] postUserComment error (using proxy ${loginfile.additionalaccinfo[k].thisproxyindex}): ${error}\n${errordesc}\nLast successful comment: ${(new Date(cb + (localoffset *= -1))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`) 
                                    } else {
                                        respondmethod(500, `${lang.commenterroroccurred}\n${errordesc}\n\nDetails: \n[${thisbot}] postUserComment error: ${error}\n\nLast successful comment: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`)

                                        //Add local time offset (and make negative number postive/positive number negative because the function returns the difference between local time to utc) to cb to convert it to local time
                                        logger("error", `[${thisbot}] postUserComment error: ${error}\n${errordesc}\nLast successful comment: ${(new Date(cb + (localoffset *= -1))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`)
                                    }
                                })

                                mainfile.activecommentprocess[recieverSteamID].status = "error" //update status in activecommentprocess obj
                                breakloop = true; //stop whole loop when an error occurred
                                
                                return; //stop further execution in this iteration

                            } else { //if the error occurred on another account then log the error and push the error to mainfile.failedcomments

                                if (loginfile.proxies.length > 1) {
                                    logger("error", `[${thisbot}] postUserComment ${i + 1}/${numberofcomments} error (using proxy ${loginfile.additionalaccinfo[k].thisproxyindex}): ${error}\nRequest info - noc: ${numberofcomments} - accs: ${Object.keys(controller.botobject).length} - delay: ${config.commentdelay} - reciever: ${recieverSteamID}`); 

                                    mainfile.failedcomments[recieverSteamID][`c${i + 1} bot${k} p${loginfile.additionalaccinfo[k].thisproxyindex}`] = `postUserComment error: ${error} [${errordesc}]`
                                } else {
                                    logger("error", `[${thisbot}] postUserComment ${i + 1}/${numberofcomments} error: ${error}\nRequest info - noc: ${numberofcomments} - accs: ${Object.keys(controller.botobject).length} - delay: ${config.commentdelay} - reciever: ${recieverSteamID}`); 

                                    mainfile.failedcomments[recieverSteamID][`c${i + 1} bot${k} p${loginfile.additionalaccinfo[k].thisproxyindex}`] = `postUserComment error: ${error} [${errordesc}]`
                                }
                                
                            }
                        }


                        /* --------- No error, run this on every successful iteration --------- */
                        if (i == 0) { //Stuff below should only run in first iteration (main bot)
                            //converting steamID again to SteamID64 because it could have changed by a profileid argument
                            if (loginfile.proxies.length > 1) logger("info", `\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment on ${recieverSteamID} with proxy ${loginfile.additionalaccinfo[k].thisproxyindex}: ${String(comment).split("\n")[0]}\x1b[0m`)
                                else logger("info", `\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment on ${recieverSteamID}: ${String(comment).split("\n")[0]}\x1b[0m`) //splitting \n to only get first line of multi line comments

                            
                            if (numberofcomments == 1) {
                                respondmethod(200, lang.commentsuccess1)

                                mainfile.activecommentprocess[recieverSteamID].status = "cooldown"
                                mainfile.commentcounter += 1

                            } else {
                                var waittime = ((numberofcomments - 1) * config.commentdelay) / 1000 //calculate estimated wait time (first comment is instant -> remove 1 from numberofcomments)
                                var waittimeunit = "seconds"
                                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }

                                respondmethod(200, lang.commentprocessstarted.replace("numberofcomments", numberofcomments).replace("waittime", Number(Math.round(waittime+'e'+3)+'e-'+3)).replace("timeunit", waittimeunit))
                            }


                            /* --------- Give user cooldown --------- */ 
                            //add estimated wait time in ms to start the cooldown after the last recieved comment
                            controller.lastcomment.update({ id: requesterSteamID }, { $set: { time: Date.now() + ((numberofcomments - 1) * config.commentdelay) } }, {}, (err) => { 
                                if (err) logger("error", "Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err) 
                            })

                        } else { //Stuff below should only run for child accounts
                            if (!error) {
                                if (loginfile.proxies.length > 1) logger("info", `[${thisbot}] Comment ${i + 1}/${numberofcomments} on ${recieverSteamID} with proxy ${loginfile.additionalaccinfo[k].thisproxyindex}: ${String(comment).split("\n")[0]}`)
                                    else logger("info", `[${thisbot}] Comment ${i + 1}/${numberofcomments} on ${recieverSteamID}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments
                            }
                        }


                        /* --------- Run this code on last iteration --------- */
                        if (i == numberofcomments - 1 && numberofcomments > 1) { //last iteration (run only when more than one comment is requested)
                            var failedcmdreference = ""

                            if (Object.keys(mainfile.failedcomments[recieverSteamID]).length > 0) {
                                failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems" 
                            }

                            if (!res) respondmethod(200, `${lang.commentsuccess2.replace("failedamount", Object.keys(mainfile.failedcomments[recieverSteamID]).length).replace("numberofcomments", numberofcomments)}\n${failedcmdreference}`); //only send if not a webrequest

                            mainfile.activecommentprocess[recieverSteamID].status = "cooldown"
                            mainfile.commentcounter += numberofcomments - Object.keys(mainfile.failedcomments[recieverSteamID]).length //add numberofcomments minus failedamount to commentcounter

                            if (Object.values(mainfile.failedcomments[recieverSteamID]).includes("Error: The settings on this account do not allow you to add comments.") && !res) {
                                accstoadd[requesterSteamID] = []

                                for (i in controller.botobject) {
                                    if (!Object.keys(controller.botobject[i].myFriends).includes(recieverSteamID)) {
                                        accstoadd[requesterSteamID].push(`\n ' https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[i].steamID)).getSteamID64()} '`)
                                    }

                                    if (i == Object.keys(controller.botobject).length - 1) respondmethod(403, lang.commentlimitederror.replace("accstoadd", accstoadd[requesterSteamID])) //this error message should never show as the bot will always check for limited bot accounts before starting to comment
                                }
                            }
                        }
                    })
                })
            }, config.commentdelay * i); //delay every comment
        }


        var k = 0;

        for (var i = 0; i < numberofcomments && !breakloop; i++) {  //run comment process for as many times as numberofcomments when breakloop is false (Remember: i starts to count at 0, noc at 1)
            /* 
                i = integer, counts total executions (numberofcomments)
                k = integer, defines account to use for this iteration and resets if greater than amount of bot accounts
            */
            comment(accountorder[k], i) //run actual comment function
            
            k++

            if (k + 1 > Object.keys(controller.communityobject).length) {
                const lastaccountint = String(accountorder[k - 1]) //save last used account (which is -1 because k++ was already executed again)

                k = 0; //reset k if it is greater than the amount of accounts

                //shuffle accountorder again if randomizeAccounts is true but check that the last used account isn't the first one
                if (config.randomizeAccounts) accountorder.sort(() => Math.random() - 0.5);
                if (config.randomizeAccounts && accountorder[0] == lastaccountint) accountorder.push(accountorder.shift()) //if lastaccountint is first account in new order then move it to the end
            }
        }
    }) //This was the critical part of this bot. Let's carry on and hope that everything holds together.
}