//Needs to be made modular! Mix with comment.js

/**
 * Quick and dirty groupcomment function to handle group comments for the first beta version of 2.11
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

    var lastquotes = [] //array to track last comments

    var lang                 = mainfile.lang

    var requesterSteamID = new SteamID(String(steamID)).getSteamID64() //save steamID of comment requesting user so that messages are being send to the requesting user and not to the reciever if a profileid has been provided

    
    function respondmethod(rescode, msg) { //we need a function to get each response back to the user (web request & steam chat)
        if (typeof (rescode) != "number") return logger("error", "comment respondmethod call has invalid response code: rescode must be a Number!")

        chatmsg(requesterSteamID, msg)
    }

    var ownercheck = config.ownerid.includes(requesterSteamID)
    var quoteselection = mainfile.quotes

    /* --------- Check for cmd spamming --------- */
    if (Date.now() - mainfile.lastcommentrequestmsg[requesterSteamID] < 2500 && !ownercheck) {
        return respondmethod(403, lang.pleasedontspam) 
    }

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
            if (mainfile.activecommentprocess.indexOf(String(requesterSteamID)) !== -1) { //is the user already getting comments? (-1 means not included)
                return respondmethod(403, lang.commentuseralreadyrecieving)
            }
        }
    }

    if (config.globalcommentcooldown != 0) { //check for global cooldown
        if ((Date.now() - mainfile.commentedrecently) < (config.globalcommentcooldown * 60000)) {
            var remainingglobalcooldown = Math.abs(((Date.now() - mainfile.commentedrecently) - (config.globalcommentcooldown * 60000)) / 1000)
            var remainingglobalcooldownunit = "seconds"
            if (remainingglobalcooldown > 120) { var remainingglobalcooldown = remainingglobalcooldown / 60; var remainingglobalcooldownunit = "minutes" }
            if (remainingglobalcooldown > 120) { var remainingglobalcooldown = remainingglobalcooldown / 60; var remainingglobalcooldownunit = "hours" }

            respondmethod(403, lang.commentglobaloncooldown.replace("globalcommentcooldown", config.globalcommentcooldown).replace("remainingglobalcooldown", round(remainingglobalcooldown, 2)).replace("timeunit", remainingglobalcooldownunit)) //send error message
            return;
        } 
    }

    /* --------- Check numberofcomments argument if it was provided --------- */
    if (args[0] == undefined) return respondmethod(403, "You need to provide number_of_comments because you also need to provide the groupid!")

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


    /* --------- Check if groupid argument was provided --------- */
    if (args[1] == undefined) return respondmethod(403, "You need to provide a groupid!")

    /* --------- Check if custom quotes were provided --------- */
    if (args[2] !== undefined) {
        quoteselection = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); //change default quotes to custom quotes
    }

    /* --------- Check if user did not provide numberofcomments --------- */
    if (numberofcomments === undefined) { //no numberofcomments given? ask again
        if (Object.keys(controller.botobject).length == 1 && maxrequestamount == 1) { 
            var numberofcomments = 1 //if only one account is active, set 1 automatically
        } else {
            respondmethod(400, lang.commentmissingnumberofcomments.replace("maxrequestamount", maxrequestamount).replace("commentcmdusage", commentcmdusage))
            return;
        } 
    }


    /* --------- Check for steamcommunity related errors/limitations --------- */
    //Randomize order of accounts already here so that the new order will be used for the next limited & not friend check
    var accountorder = [ ... Object.keys(controller.communityobject)]
    if (config.randomizeAccounts) accountorder.sort(() => Math.random() - 0.5); //randomize order if enabled in config

    /* --------- Actually start the commenting process --------- */
    var breakloop = false
    mainfile.failedcomments[requesterSteamID] = {}
    mainfile.activecommentprocess.push(requesterSteamID)

    if (config.globalcommentcooldown !== 0) { //activate globalcommentcooldown
        mainfile.commentedrecently = Date.now() + (numberofcomments * config.commentdelay) //globalcommentcooldown should start after the last comment was processed
        if (numberofcomments == 1) mainfile.commentedrecently -= config.commentdelay //subtract commentdelay again if only one comment was requested because there is nothing to wait for
    }


    function groupcomment(k, i) {
        setTimeout(() => {
            /* --------- Check if this iteration should still run --------- */
            //(both checks are designed to run through every failed iteration)
            if (!mainfile.activecommentprocess.includes(requesterSteamID)) { //Check if user is not anymore in mainfile.activecommentprocess array (for example by using !abort)
                mainfile.failedcomments[requesterSteamID][`Comment ${i} (bot${k})`] = "Skipped because user aborted comment process." //push reason to mainfile.failedcomments obj
                return; //Stop further execution and skip to next iteration
            }

            //regex is confusing so I hope this pattern isn't too terrible
            let regexPattern1 = /postGroupComment error: Error: HTTP error 429.*\n.*/gm //Thanks: https://stackoverflow.com/a/49277142
            let regexPattern2 = /postGroupComment error: Skipped because of previous HTTP 429 error.*/gm

            //Array.includes() needs an exact match and since we already want to match with only a part of the string we can do it using Array.some() and regex
            if (Object.values(mainfile.failedcomments[requesterSteamID]).some(e => regexPattern1.test(e))) { //Check if we got IP blocked (cooldown) by checking for a HTTP 429 error pushed into the mainfile.failedcomments array by a previous iteration and send message
                if (!Object.values(mainfile.failedcomments[requesterSteamID]).some(e => regexPattern2.test(e))) { //send chat.sendFriendMessage only the first time
                    respondmethod(500, `${lang.comment429stop.replace("failedamount", numberofcomments - i + 1).replace("numberofcomments", numberofcomments)}\n\n${lang.commentfailedcmdreference}`) //add !failed cmd reference to message

                    //push all other comments to instanly complete the mainfile.failedcomments obj
                    var m = 0;
                    for (var l = i + 1; l <= numberofcomments; l++) { //start with next comment process iteration by setting the starting variable l to i + 1
                        if (m + 1 > Object.keys(controller.communityobject).length) { //reset variable tracking communityobject index if it is greater than the amount of accounts
                            m = 0;
                        }

                        mainfile.failedcomments[requesterSteamID][`Comment ${l} (bot${m})`] = `postGroupComment error: Skipped because of previous HTTP 429 error.` //push reason to mainfile.failedcomments obj
                        m++
                    }

                    mainfile.activecommentprocess = mainfile.activecommentprocess.filter(item => item != requesterSteamID)
                    mainfile.commentcounter += numberofcomments - (numberofcomments - i + 1) //add numberofcomments minus failedamount to commentcounter

                    logger("warn", "HTTP 429 error detected. Skipping all other comments on this proxy because they will fail too!")
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
                controller.communityobject[k].postGroupComment(args[1], comment, (error) => { //post comment
                    if (k == 0) var thisbot = `Main`; else var thisbot = `Bot ${k}`; //call bot 0 the main bot in logging messages

                    /* --------- Handle errors thrown by this comment attempt --------- */
                    if (error) {
                        if (i == 0) { //If the error occurred on the first comment then stop and return an error message
                            //Get last successful comment time to display it in error message
                            mainfile.lastsuccessfulcomment(cb => {
                                let localoffset = new Date().getTimezoneOffset() * 60000

                                if (loginfile.proxies.length > 1) {
                                    respondmethod(500, `${lang.commenterroroccurred}\n\nDetails: \n[${thisbot}] postGroupComment error (using proxy ${loginfile.additionalaccinfo[k].thisproxyindex}): ${error}\n\nLast successful comment: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`)

                                    //Add local time offset (and make negative number postive/positive number negative because the function returns the difference between local time to utc) to cb to convert it to local time
                                    logger("error", `[${thisbot}] postGroupComment error (using proxy ${loginfile.additionalaccinfo[k].thisproxyindex}): ${error}\nLast successful comment: ${(new Date(cb + (localoffset *= -1))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`) 
                                } else {
                                    respondmethod(500, `${lang.commenterroroccurred}\n\n\nDetails: \n[${thisbot}] postGroupComment error: ${error}\n\nLast successful comment: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`)

                                    //Add local time offset (and make negative number postive/positive number negative because the function returns the difference between local time to utc) to cb to convert it to local time
                                    logger("error", `[${thisbot}] postGroupComment error: ${error}\nLast successful comment: ${(new Date(cb + (localoffset *= -1))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`)
                                }
                            })


                            if (error == "Error: HTTP error 429" || error == "Error: You've been posting too frequently, and can't make another post right now") {
                                mainfile.commentedrecently = Date.now() + 300000 //add 5 minutes to commentedrecently if cooldown error
                            }

                            mainfile.activecommentprocess = mainfile.activecommentprocess.filter(item => item != requesterSteamID)

                            breakloop = true; //stop whole loop when an error occurred
                            return; //stop further execution in this iteration

                        } else { //if the error occurred on another account then log the error and push the error to mainfile.failedcomments

                            if (loginfile.proxies.length > 1) {
                                logger("error", `[${thisbot}] postGroupComment ${i + 1}/${numberofcomments} error (using proxy ${loginfile.additionalaccinfo[k].thisproxyindex}): ${error}\nRequest info - noc: ${numberofcomments} - accs: ${Object.keys(controller.botobject).length} - delay: ${config.commentdelay} - group: ${args[1]}`); 

                                mainfile.failedcomments[requesterSteamID][`Comment ${i + 1} (bot${k})`] = `postGroupComment error: ${error}`
                            } else {
                                logger("error", `[${thisbot}] postGroupComment ${i + 1}/${numberofcomments} error: ${error}\nRequest info - noc: ${numberofcomments} - accs: ${Object.keys(controller.botobject).length} - delay: ${config.commentdelay} - group: ${args[1]}`); 

                                mainfile.failedcomments[requesterSteamID][`Comment ${i + 1} (bot${k})`] = `postGroupComment error: ${error}`
                            }

                        }
                    }


                    /* --------- No error, run this on every successful iteration --------- */
                    if (i == 0) { //Stuff below should only run in first iteration (main bot)
                        if (loginfile.proxies.length > 1) logger("info", `\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment in group ${args[1]} with proxy ${loginfile.additionalaccinfo[k].thisproxyindex}: ${String(comment).split("\n")[0]}\x1b[0m`)
                                else logger("info", `\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment in group ${args[1]}: ${String(comment).split("\n")[0]}\x1b[0m`) //splitting \n to only get first line of multi line comments


                        if (numberofcomments == 1) {
                            respondmethod(200, lang.commentsuccess1)

                            mainfile.activecommentprocess = mainfile.activecommentprocess.filter(item => item != requesterSteamID)
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
                            if (loginfile.proxies.length > 1) logger("info", `[${thisbot}] Comment ${i + 1}/${numberofcomments} in group ${args[1]} with proxy ${loginfile.additionalaccinfo[k].thisproxyindex}: ${String(comment).split("\n")[0]}`)
                                else logger("info", `[${thisbot}] Comment ${i + 1}/${numberofcomments} in group ${args[1]}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments
                        }
                    }


                    /* --------- Run this code on last iteration --------- */
                    if (i == numberofcomments - 1 && numberofcomments > 1) { //last iteration (run only when more than one comment is requested)

                        if (!res) respondmethod(200, `${lang.commentsuccess2.replace("failedamount", Object.keys(mainfile.failedcomments[requesterSteamID]).length).replace("numberofcomments", numberofcomments)}`); //only send if not a webrequest

                        mainfile.activecommentprocess = mainfile.activecommentprocess.filter(item => item != requesterSteamID) //remove user from mainfile.activecommentprocess array
                        mainfile.commentcounter += numberofcomments - Object.keys(mainfile.failedcomments[requesterSteamID]).length //add numberofcomments minus failedamount to commentcounter

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
        groupcomment(accountorder[k], i) //run actual comment function
        
        k++

        if (k + 1 > Object.keys(controller.communityobject).length) {
            const lastaccountint = String(accountorder[k - 1]) //save last used account (which is -1 because k++ was already executed again)

            k = 0; //reset k if it is greater than the amount of accounts

            //shuffle accountorder again if randomizeAccounts is true but check that the last used account isn't the first one
            if (config.randomizeAccounts) accountorder.sort(() => Math.random() - 0.5);
            if (config.randomizeAccounts && accountorder[0] == lastaccountint) accountorder.push(accountorder.shift()) //if lastaccountint is first account in new order then move it to the end
        }
    }
}