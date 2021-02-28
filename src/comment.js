//This file contains the code of the comment command and is called by bot.js
//I did this to reduce the amount of lines in bot.js to make finding stuff easier

const SteamID = require('steamid');
var updater = require('./updater.js');
var controller = require("./controller.js");
var config = require('../config.json');
var accstoadd = []

module.exports.run = (logger, chatmsg, lang, community, thisbot, steamID, args, res, lastcommentdoc, failedcomments, activecommentprocess, lastcommentrequestmsg, commentedrecently, lastsuccessfulcomment, callback) => {
    var requesterSteamID = new SteamID(String(steamID)).getSteamID64() //save steamID of comment requesting user so that messages are being send to the requesting user and not to the reciever if a profileid has been provided

    function respondmethod(rescode, msg) { //we need a function to get each response back to the user (web request & steam chat)
        if (typeof (rescode) != "number") return logger("comment respondmethod call has invalid response code: rescode must be a Number!")

        if (res) {
            logger("Web Comment Request response: " + msg.replace("/me ", "")) //replace steam chat format prefix with nothing if this message should use one
            res.status(rescode).send(msg + "</br></br>The log will contain further information and errors (if one should occur). You can display it by visiting: /output")
        } else {
            chatmsg(requesterSteamID, msg) }
    }

    var ownercheck = config.ownerid.includes(requesterSteamID)
    var quoteselection = controller.quotes

    /* --------- Check for cmd spamming --------- */
    if (Date.now() - lastcommentrequestmsg[requesterSteamID] < 2500 && !ownercheck) {
        return respondmethod(403, lang.pleasedontspam) }

    lastcommentrequestmsg[requesterSteamID] = Date.now()

    /* --------- Check for disabled comment cmd or if update is queued --------- */
    if (updater.activeupdate) return respondmethod(403, lang.commentactiveupdate);
    if (config.allowcommentcmdusage === false && !config.ownerid.includes(requesterSteamID)) return respondmethod(403, lang.commentcmdowneronly) 


    /* --------- Define command usage messages for each user's privileges --------- */ //Note: Web Comment Requests always use config.ownerid[0]
    if (ownercheck) {
        if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commentcmdusage = lang.commentcmdusageowner.replace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments)
            else var commentcmdusage = lang.commentcmdusageowner2
    } else {
        if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commentcmdusage = lang.commentcmdusage.replace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments)
            else var commentcmdusage = lang.commentcmdusage2 }


    /* ------------------ Check for cooldowns ------------------ */
    if (config.commentcooldown !== 0) { //check for user specific cooldown
        if ((Date.now() - lastcommentdoc.time) < (config.commentcooldown * 60000)) { //check if user has cooldown applied
            var remainingcooldown = Math.abs(((Date.now() - lastcommentdoc.time) / 1000) - (config.commentcooldown * 60))
            var remainingcooldownunit = "seconds"
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "minutes" }
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "hours" }

            respondmethod(403, lang.commentuseroncooldown.replace("commentcooldown", config.commentcooldown).replace("remainingcooldown", controller.round(remainingcooldown, 2)).replace("timeunit", remainingcooldownunit)) //send error message
            return;
        } else {
            if (activecommentprocess.indexOf(String(requesterSteamID)) !== -1) { //is the user already getting comments? (-1 means not included)
            return respondmethod(403, lang.commentuseralreadyrecieving) }
        }
    }

    if (config.globalcommentcooldown != 0) { //check for global cooldown
        if ((Date.now() - commentedrecently) < config.globalcommentcooldown) {
            var remainingglobalcooldown = Math.abs((((Date.now() - commentedrecently)) - (config.globalcommentcooldown)) / 1000)
            var remainingglobalcooldownunit = "seconds"
            if (remainingglobalcooldown > 120) { var remainingglobalcooldown = remainingglobalcooldown / 60; var remainingglobalcooldownunit = "minutes" }
            if (remainingglobalcooldown > 120) { var remainingglobalcooldown = remainingglobalcooldown / 60; var remainingglobalcooldownunit = "hours" }

            respondmethod(403, lang.commentglobaloncooldown.replace("remainingglobalcooldown", controller.round(remainingglobalcooldown, 2)).replace("timeunit", remainingglobalcooldownunit)) //send error message
            return; } }

    /* --------- Check numberofcomments argument if it was provided --------- */
    if (args[0] !== undefined) {
        if (isNaN(args[0])) { //isn't a number?
            if (args[0].toLowerCase() == "all") {
                args[0] = Object.keys(controller.communityobject).length * config.repeatedComments //replace the argument with the max amount of comments
            } else {
                return respondmethod(400, lang.commentinvalidnumber.replace("commentcmdusage", commentcmdusage)) 
            }
        }

        if (args[0] > Object.keys(controller.communityobject).length * config.repeatedComments) { //number is greater than accounts * repeatedComments?
            return respondmethod(403, lang.commentrequesttoohigh.replace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments).replace("commentcmdusage", commentcmdusage)) }
        var numberofcomments = args[0]

        //Code by: https://github.com/HerrEurobeat/ 


        /* --------- Check profileid argument if it was provided --------- */
        if (args[1] !== undefined) {
            if (config.ownerid.includes(new SteamID(String(steamID)).getSteamID64()) || args[1] == new SteamID(String(steamID)).getSteamID64()) { //check if user is a bot owner or if he provided his own profile id
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
            quoteselection = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); } //change default quotes to custom quotes
        
    } //arg[0] if statement ends here

    /* --------- Check if user did not provide numberofcomments --------- */
    if (numberofcomments === undefined) { //no numberofcomments given? ask again
        if (Object.keys(controller.botobject).length == 1 && config.repeatedComments == 1) { 
            var numberofcomments = 1 //if only one account is active, set 1 automatically
        } else {
            respondmethod(400, lang.commentmissingnumberofcomments.replace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments).replace("commentcmdusage", commentcmdusage))
            return; } 
    }


    /* --------- Check for steamcommunity related errors/limitations --------- */
    //Check all accounts if they are limited and send user profile link if not friends
    accstoadd[requesterSteamID] = []

    for (let i in controller.botobject) {
        if (Number(i) + 1 <= numberofcomments && Number(i) + 1 <= Object.keys(controller.botobject).length) { //only check if this acc is needed for a comment
            try {
                if (controller.botobject[i].limitations.limited == true && !Object.keys(controller.botobject[i].myFriends).includes(new SteamID(String(steamID)).getSteamID64())) {
                    accstoadd[requesterSteamID].push(`\n 'https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[i].steamID)).getSteamID64()}'`) }
            } catch (err) {
                logger("Error checking if comment requester is friend with limited bot accounts: " + err) } } //This error check was implemented as a temporary solution to fix this error (and should be fine since it seems that this error is rare and at least prevents from crashing the bot): https://github.com/HerrEurobeat/steam-comment-service-bot/issues/54

        if (Number(i) + 1 == numberofcomments && accstoadd[requesterSteamID].length > 0 || Number(i) + 1 == Object.keys(controller.botobject).length && accstoadd[requesterSteamID].length > 0) {
            respondmethod(403, lang.commentaddbotaccounts.replace("numberofcomments", numberofcomments) + "\n" + accstoadd[requesterSteamID])
            return; } //stop right here criminal
    } 

    community.getSteamUser(steamID, (err, user) => { //check if profile is private
        if (err) {
            logger(`[${thisbot}] comment check for private account error: ${err}\nTrying to comment anyway and hoping no error occurs...`) //this can happen sometimes and most of the times commenting will still work
        } else {
            if (user.privacyState != "public") { return respondmethod(403, lang.commentuserprofileprivate) } } //only check if getting the Steam user's data didn't result in an error

        /* --------- Actually start the commenting process --------- */
        var breakloop = false
        failedcomments[requesterSteamID] = {}
        activecommentprocess.push(requesterSteamID)
        callback(failedcomments, activecommentprocess, commentedrecently) //callback updated acp

        function comment(k, i) {
            setTimeout(() => {
                /* --------- Check if this iteration should still run --------- */
                //(both checks are designed to run through every failed iteration)
                if (!activecommentprocess.includes(requesterSteamID)) { //Check if user is not anymore in activecommentprocess array (for example by using !abort)
                    failedcomments[requesterSteamID][`Comment ${i} (bot${k})`] = "Skipped because user aborted comment process." //push reason to failedcomments obj
                    return; } //Stop further execution and skip to next iteration
    
                if (Object.values(failedcomments[requesterSteamID]).includes("postUserComment error: Error: HTTP error 429")) { //Check if we got IP blocked (cooldown) by checking for a HTTP 429 error pushed into the failedcomments array by a previous iteration and send message
                    if (!Object.values(failedcomments[requesterSteamID]).includes("postUserComment error: Skipped because of previous HTTP 429 error.")) { //send chat.sendFriendMessage only the first time
                        respondmethod(500, `${lang.commenteverywhere429stop.replace("failedamount", numberofcomments - i + 1).replace("numberofcomments", numberofcomments)}\n\n${lang.commenteverywherefailedcmdreference}`) //add !failed cmd reference to message

                        //push all other comments to instanly complete the failedcomments obj
                        var m = 0;
                        for (var l = i + 1; l <= numberofcomments; l++) { //start with next comment process iteration by setting the starting variable l to i + 1
                            if (m + 1 > Object.keys(controller.communityobject).length) { //reset variable tracking communityobject index if it is greater than the amount of accounts
                                m = 0; }
    
                            failedcomments[requesterSteamID][`Comment ${l} (bot${m})`] = `postUserComment error: Skipped because of previous HTTP 429 error.` //push reason to failedcomments obj
                            m++
                        }

                        callback(failedcomments, activecommentprocess.filter(item => item != requesterSteamID), commentedrecently)
                    }
                    return; } //stop further execution

                if (breakloop) return; //stop here with every other iteration if we should not attempt to comment anymore


                /* --------- Try to comment --------- */
                var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; //smol function to get random string from array
                var comment = randomstring(quoteselection); //get random quote for this iteration

                controller.communityobject[k].postUserComment(steamID, comment, (error) => { //post comment
                    if (k == 0) var thisbot = `Main`; else var thisbot = `Bot ${k}`; //call bot 0 the main bot in logging messages

                    /* --------- Handle errors thrown by this comment attempt --------- */
                    if (error) {
                        var errordesc = ""

                        switch (error) {
                            case "Error: HTTP error 429":
                                errordesc = "This account has commented too often recently and has been blocked by Steam for a few minutes.\nPlease wait a moment and then try again."
                                commentedrecently = Date.now() + 300000 //add 5 minutes to commentedrecently if cooldown error
                                break;
                            case "Error: HTTP Error 502":
                                errordesc = "The steam servers seem to have a problem/are down. Check Steam's status here: https://steamstat.us"
                                break;
                            case "Error: HTTP Error 504":
                                errordesc = "The steam servers are slow atm/are down. Check Steam's status here: https://steamstat.us"
                                break;
                            case "Error: You've been posting too frequently, and can't make another post right now":
                                errordesc = "This account has commented too often recently and has been blocked by Steam for a few minutes.\nPlease wait a moment and then try again."
                                commentedrecently = Date.now() + 300000 //add 5 minutes to commentedrecently if cooldown error
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

                        if (i == 0) { //If the error occurred on the main bot then stop and return an error message
                            //Get last successful comment time to display it in error message
                            lastsuccessfulcomment(cb => {
                                let localoffset = new Date().getTimezoneOffset() * 60000

                                respondmethod(500, `${lang.commenterroroccurred}\n${errordesc}\n\nDetails: \n[${thisbot}] postUserComment error: ${error}\n\nLast successful comment: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`)
                                logger(`[${thisbot}] postUserComment error: ${error}\n${errordesc}\nLast successful comment: ${(new Date(cb + (localoffset *= -1))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`) }) //Add local time offset (and make negative number postive/positive number negative because the function returns the difference between local time to utc) to cb to convert it to local time

                            if (error == "Error: HTTP error 429" || error == "Error: You've been posting too frequently, and can't make another post right now") {
                                commentedrecently = Date.now() + 300000 } //add 5 minutes to commentedrecently if cooldown error

                            breakloop = true; //stop whole loop when an error occurred
                            callback(failedcomments, activecommentprocess.filter(item => item != requesterSteamID), commentedrecently)
                            return; //stop further execution in this iteration

                        } else { //if the error occurred on a child account then log the error and push the error to failedcomments

                            logger(`[${thisbot}] postUserComment error: ${error}\nRequest info - noc: ${numberofcomments} - accs: ${Object.keys(controller.botobject).length} - reciever: ${new SteamID(String(steamID)).getSteamID64()}`); 
                            failedcomments[requesterSteamID][`Comment ${i + 1} (bot${k})`] = `postUserComment error: ${error} [${errordesc}]`
                        }
                    }


                    /* --------- No error, run this on every successful iteration --------- */
                    if (i == 0) { //Stuff below should only run in first iteration (main bot)
                        //converting steamID again to SteamID64 because it could have changed by a profileid argument
                        logger(`\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment on ${new SteamID(String(steamID)).getSteamID64()}: ${String(comment).split("\n")[0]}\x1b[0m`) //splitting \n to only get first line of multi line comments

                        if (numberofcomments == 1) respondmethod(200, lang.commentsuccess)
                            else {
                                var waittime = ((numberofcomments - 1) * config.commentdelay) / 1000 //calculate estimated wait time (first comment is instant -> remove 1 from numberofcomments)
                                var waittimeunit = "seconds"
                                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }
                                respondmethod(200, lang.commentprocessstarted.replace("numberofcomments", numberofcomments).replace("waittime", Number(Math.round(waittime+'e'+3)+'e-'+3)).replace("timeunit", waittimeunit))
                            }


                        /* --------- Activate globalcooldown & give user cooldown --------- */ 
                        if (config.globalcommentcooldown !== 0) {
                            commentedrecently = Date.now() }

                        //add estimated wait time in ms to start the cooldown after the last recieved comment
                        controller.lastcomment.update({ id: requesterSteamID }, { $set: { time: Date.now() + (((numberofcomments - 1) * config.commentdelay)) } }, {}, (err) => { 
                            if (err) logger("Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err) 
                        })

                    } else { //Stuff below should only run for child accounts
                        logger(`[${thisbot}] Comment on ${new SteamID(String(steamID)).getSteamID64()}: ${String(comment).split("\n")[0]}`) //splitting \n to only get first line of multi line comments
                    }


                    /* --------- Run this code on last iteration --------- */
                    if (i == numberofcomments - 1) { //last iteration
                        var failedcmdreference = ""

                        if (Object.keys(failedcomments[requesterSteamID]).length > 0) {
                            failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems" 
                        }

                        respondmethod(200, `${lang.commenteverywheresuccess.replace("failedamount", Object.keys(failedcomments[requesterSteamID]).length).replace("numberofcomments", numberofcomments)}\n${failedcmdreference}`);
                        callback(failedcomments, activecommentprocess.filter(item => item != requesterSteamID), commentedrecently)

                        if (Object.values(failedcomments[requesterSteamID]).includes("Error: The settings on this account do not allow you to add comments.")) {
                            accstoadd[requesterSteamID] = []

                            for (i in controller.botobject) {
                                if (!Object.keys(controller.botobject[i].myFriends).includes(new SteamID(String(steamID)).getSteamID64())) {
                                    accstoadd[requesterSteamID].push(`\n 'https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[i].steamID)).getSteamID64()}'`) }

                                if (i == Object.keys(controller.botobject).length - 1)
                                    respondmethod(403, lang.commenteverywherelimitederror.replace("accstoadd", accstoadd[requesterSteamID])) //this error message should never show as the bot will always check for limited bot accounts before starting to comment
                            } }
                    }
                })
            }, config.commentdelay * i); //delay every comment
        }

        
        var k = 0;

        for (var i = 0; i < numberofcomments && !breakloop; i++) {  //run comment process for as many times as numberofcomments when breakloop is false (Remember: i starts to count at 0, noc at 1)
            /* 
                i = counts total executions (numberofcomments)
                k = defines account to use for this iteration and resets if greater than amount of bot accounts
            */
            comment(k, i) //run actual comment function
            
            k++
            if (k + 1 > Object.keys(controller.communityobject).length) k = 0; //reset k if it is greater than the amount of accounts
        }
    }) //This was the critical part of this bot. Let's carry on and hope that everything holds together.
}