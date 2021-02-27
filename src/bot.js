//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Code for each bot instance (most of the code only affects the main bot) and handling most of the talking with Steam.

module.exports.run = async (logOnOptions, loginindex) => {
  const SteamUser = require('steam-user');
  const SteamCommunity = require('steamcommunity');
  const SteamID = require('steamid');
  const fs = require("fs");
  const xml2js = require('xml2js');
  const https = require('https')

  var updater = require('./updater.js');
  var controller = require("./controller.js");
  var config = require('../config.json');
  var extdata = require('./data.json');
  var cachefile = require('./cache.json');

  var commandcooldown = 12000 //The bot won't respond if a user sends more than 5 messages in this time frame
  var maxLogOnRetries = 1 //How often a failed logOn will be retried
  var logger = controller.logger
  var lang = controller.lang
  var commentedrecently = false; //global cooldown for the comment command
  var lastmessage = {}
  accstoadd = []
  lastcommentrequestmsg = []

  if (loginindex == 0) var thisbot = "Main"
    else var thisbot = `Bot ${loginindex}`

  //Get proxy of this bot account
  if (controller.proxyShift >= controller.proxies.length) controller.proxyShift = 0; //reset proxy counter
  var thisproxy = controller.proxies[controller.proxyShift]
  controller.proxyShift++ //switch to next proxy

  const bot = new SteamUser({ httpProxy: thisproxy });
  const community = new SteamCommunity();

  //Make chat message method shorter
  function chatmsg(steamID, txt) {
    bot.chat.sendFriendMessage(steamID, txt) }

  //Function to return last successful comment from lastcomment.json
  function lastsuccessfulcomment(callback) {
    var greatesttimevalue = 0

    controller.lastcomment.find({}, (err, docs) => { //get all documents
      docs.forEach((e, i) => {
        if (e.time > greatesttimevalue) greatesttimevalue = Number(e.time)

        if (i == docs.length - 1) {
          return callback(greatesttimevalue) }
      })
    }) }

  //Group stuff
  if (loginindex == 0) { //group64id only needed by main bot -> remove unnecessary load from other bots
    if (cachefile.configgroup == config.yourgroup) { //id is stored in cache file, no need to get it again
      logger(`group64id of yourgroup is stored in cache.json...`, false, true)
      configgroup64id = cachefile.configgroup64id
    } else {
      logger(`group64id of yourgroup not in cache.json...`, false, true)
      configgroup64id = "" //define to avoid not defined errors
      if (config.yourgroup.length < 1) {
        logger('Skipping group64id request of yourgroup because config.yourgroup is empty.', false, true); //log to output for debugging
        configgroup64id = "" 
      } else {

        logger(`Getting group64id of yourgroup...`, false, true)
        yourgroupoutput = ""
        https.get(`${config.yourgroup}/memberslistxml/?xml=1`, function(yourgroupres) { //get group64id from code to simplify config
          yourgroupres.on('data', function (chunk) {
            yourgroupoutput += chunk });

          yourgroupres.on('end', () => {
            if (!String(yourgroupoutput).includes("<?xml") || !String(yourgroupoutput).includes("<groupID64>")) { //Check if botsgroupoutput is steam group xml data before parsing it
              logger("\x1b[0m[\x1b[31mNotice\x1b[0m] Your group (yourgroup in config) doesn't seem to be valid!", true); 
              configgroup64id = "" 
            } else {
              new xml2js.Parser().parseString(yourgroupoutput, function(err, yourgroupResult) {
                if (err) return logger("error parsing yourgroup xml: " + err, true)

                configgroup64id = yourgroupResult.memberList.groupID64

                cachefile.configgroup = config.yourgroup
                cachefile.configgroup64id = String(yourgroupResult.memberList.groupID64)
                fs.writeFile("./src/cache.json", JSON.stringify(cachefile, null, 4), err => { 
                  if (err) logger(`[${thisbot}] error writing configgroup64id to cache.json: ${err}`) })
              }) } })
        }).on("error", function(err) { 
          logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get yourgroup 64id. Either Steam is down or your internet isn't working.\n          Error: " + err, true)
          configgroup64id = ""
      }) } } }
 

  /* ------------ Login & Events: ------------ */
  //Should keep the bot at least from crashing
  process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection Error! Reason: ${reason.stack}`, true) });
  process.on('uncaughtException', (reason, p) => {
    logger(`Uncaught Exception Error! Reason: ${reason.stack}`, true) });
  
  let logOnTries = 0;

  function logOnAccount() {
    var loggedininterval = setInterval(() => { //set an interval to check if previous acc is logged on
      if (controller.accisloggedin || logOnTries > 0) { //start attempt if previous account is logged on or if this call is a retry
        logOnTries++
        clearInterval(loggedininterval) //stop interval
        controller.accisloggedin = false; //set to false again

        if (thisproxy == null) logger(`[${thisbot}] Trying to log in without proxy... (Attempt ${logOnTries}/${maxLogOnRetries + 1})`, false, true)
          else logger(`[${thisbot}] Trying to log in with proxy ${controller.proxyShift - 1}... (Attempt ${logOnTries}/${maxLogOnRetries + 1})`, false, true)
        bot.logOn(logOnOptions)
      }
    }, 250) }
  
  logOnAccount();

  bot.on('error', (err) => { //Handle errors that were caused during logOn
    if (err.eresult == 34) { //LogonSessionReplaced will be thrown here instead of the disconnected event so just log it
      logger(`\x1b[31m[${thisbot}] Lost connection to Steam. Reason: LogonSessionReplaced\x1b[0m`)
      if (loginindex == 0) { logger(`\x1b[31mAccount is bot0. Aborting...\x1b[0m`, true); process.exit(0) }
      return; }
    let blockedEnumsForRetries = [5, 12, 13, 17, 18] //Enums: https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EResult.js

    if (logOnTries > maxLogOnRetries || blockedEnumsForRetries.includes(err.eresult)) {
      logger(`\nCouldn't log in bot${loginindex} after ${logOnTries} attempt(s). Error ${err.eresult}: ${err}`, true)
      if (err.eresult = 5) logger(`Note: The error "InvalidPassword" (${err.eresult}) can also be caused by a wrong Username or shared_secret!\n      Try leaving the shared_secret field empty and check the username & password of bot${loginindex}.`, true)
      if (thisproxy != null) logger(`Is your proxy ${controller.proxyShift} offline or blocked by Steam?`, true)

      if (loginindex == 0) {
        logger("\nAborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true)
        process.exit(0)
      } else {
        logger(`Failed account is not bot0. Skipping account...`, true)
        controller.accisloggedin = true; //set to true to log next account in
        updater.skippedaccounts.push(loginindex)
        controller.skippednow.push(loginindex) }
    } else {
      //Got retries left...
      logger(`Error ${err.eresult} while trying to log in bot${loginindex}. Retrying in 5 seconds...`)
      setTimeout(() => {
        logOnAccount();
      }, 5000) }
  })

  bot.on('steamGuard', function(domain, callback, lastCodeWrong) { //fired when steamGuard code is requested when trying to log in
    function askforcode() { //function to handle code input, manual skipping with empty input and automatic skipping with skipSteamGuard 
      logger(`[${thisbot}] Steam Guard code requested...`, false, true)
      logger('Code Input', true, true) //extra line with info for output.txt because otherwise the text from above get's halfway stuck in the steamGuard input field

      var steamGuardInputStart = Date.now(); //measure time to subtract it later from readyafter time

      if (loginindex == 0) {
        process.stdout.write(`[${logOnOptions.accountName}] Steam Guard Code: `)
      } else {
        process.stdout.write(`[${logOnOptions.accountName}] Steam Guard Code (leave empty and press ENTER to skip account): `) }

      var stdin = process.openStdin(); //start reading input in terminal

      stdin.resume()
      stdin.addListener('data', text => { //fired when input was submitted
        var code = text.toString().trim()
        stdin.pause() //stop reading
        stdin.removeAllListeners('data')

        if (code == "") { //manual skip initated

          if (loginindex == 0) { //first account can't be skipped
            logger("The first account always has to be logged in!", true)
            setTimeout(() => {
              askforcode(); //run function again
            }, 500);
          } else {
            logger(`[${thisbot}] steamGuard input empty, skipping account...`, false, true)
            bot.logOff() //Seems to prevent the steamGuard lastCodeWrong check from requesting again every few seconds
            controller.accisloggedin = true; //set to true to log next account in
            updater.skippedaccounts.push(loginindex)
            controller.skippednow.push(loginindex) }

        } else { //code provided
          logger(`[${thisbot}] Accepting steamGuard code...`, false, true)
          callback(code) } //give code back to node-steam-user

        controller.steamGuardInputTimeFunc(Date.now() - steamGuardInputStart) //measure time and subtract it from readyafter time
      })
    } //function end

    //check if skipSteamGuard is on so we don't need to prompt the user for a code
    if (config.skipSteamGuard) {
      if (loginindex > 0) {
        logger(`[${thisbot}] Skipping account because skipSteamGuard is enabled...`, false, true)
        bot.logOff() //Seems to prevent the steamGuard lastCodeWrong check from requesting again every few seconds
        controller.accisloggedin = true; //set to true to log next account in
        updater.skippedaccounts.push(loginindex)
        controller.skippednow.push(loginindex)
        return;
      } else {
        logger("Even with skipSteamGuard enabled, the first account always has to be logged in.", true)
      } }

    //calling the function:
    if (lastCodeWrong && !controller.skippednow.includes(loginindex)) { //last submitted code seems to be wrong and the loginindex wasn't already skipped (just to make sure)
      logger('', true, true)
      logger('Your code seems to be wrong, please try again!', true)
      setTimeout(() => {
        askforcode(); //code seems to be wrong! ask again...
      }, 500);
    } else {
      askforcode(); //ask first time
    }
  });

  bot.on('loggedOn', () => { //this account is now logged on
    logger(`[${thisbot}] Account logged in! Waiting for websession...`, false, true)
    bot.setPersona(1); //set online status
    if (loginindex == 0) bot.gamesPlayed(config.playinggames); //set game only for the main bot
    if (loginindex != 0 && config.childaccsplaygames) bot.gamesPlayed(config.playinggames.slice(1, config.playinggames.length)) //play game with child bots but remove the custom game

    controller.communityobject[loginindex] = community //export this community instance to the communityobject to access it from controller.js
    controller.botobject[loginindex] = bot //export this bot instance to the botobject to access it from controller.js


    if (loginindex == 0) {
      /* --------- The comment command (outside of friendMessage Event to be able to call it from controller.js) --------- */

      /**
        * The comment command as a function to be able to call it from outside the file
        * @param {Object} steamID steamID Object of the profile to comment on
        * @param {Array<String>} args An array containing all arguments provided in the message by the user
        * @param {Object} res An express response object that will be available if the function is called from the express webserver
        */
      commentcmd = function commentcmd(steamID, args, res) {
        var requesterSteamID = new SteamID(String(steamID)).getSteamID64() //save steamID of comment requesting user so that messages are being send to the requesting user and not to the reciever if a profileid has been provided

        function respondmethod(rescode, msg) { //we need a function to get each response back to the user (web request & steam chat)
          if (res) {
            logger("Web Comment Request response: " + msg.replace("/me ", "")) //replace steam chat format prefix with nothing if this message should use one
            res.status(rescode).send(msg + "</br></br>The log will contain further information and errors (if one should occur). You can display it by visiting: /output")
          } else {
            chatmsg(requesterSteamID, msg)
          } }

        var steam64id = new SteamID(String(steamID)).getSteamID64()
        var ownercheck = config.ownerid.includes(steam64id)
        var lastcommentsteamID = steam64id
        var quoteselection = controller.quotes

        /* --------- Check for cmd spamming --------- */
        if (Date.now() - lastcommentrequestmsg[requesterSteamID] < 2500 && !ownercheck) {
          return respondmethod(403, lang.pleasedontspam) }

        lastcommentrequestmsg[requesterSteamID] = Date.now()

        /* --------- Check for disabled comment cmd or if update is queued --------- */
        if (updater.activeupdate) return respondmethod(403, lang.commentactiveupdate);
        if (config.allowcommentcmdusage === false && !config.ownerid.includes(steam64id)) return respondmethod(403, lang.commentcmdowneronly) 


        /* --------- Define command usage messages for each user's priviliges --------- */ //Note: Web Comment Requests always use config.ownerid[0]
        if (ownercheck) {
          if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commentcmdusage = lang.commentcmdusageowner.replace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments)
            else var commentcmdusage = lang.commentcmdusageowner2
        } else {
          if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commentcmdusage = lang.commentcmdusage.replace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments)
            else var commentcmdusage = lang.commentcmdusage2 }


        /* ------------------ Check for cooldowns ------------------ */
        if (config.commentcooldown !== 0) { //check for user specific cooldown
          controller.lastcomment.findOne({ id: lastcommentsteamID }, (err, doc) => {
            if (!doc) logger("User is missing from database?? How is this possible?! Error maybe: " + err)

            if ((Date.now() - doc.time) < (config.commentcooldown * 60000)) { //check if user has cooldown applied
              var remainingcooldown = Math.abs(((Date.now() - doc.time) / 1000) - (config.commentcooldown * 60))
              var remainingcooldownunit = "seconds"
              if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "minutes" }
              if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "hours" }
  
              respondmethod(403, lang.commentuseroncooldown.replace("commentcooldown", config.commentcooldown).replace("remainingcooldown", controller.round(remainingcooldown, 2)).replace("timeunit", remainingcooldownunit)) //send error message
              return;
            } else {
              if (controller.activecommentprocess.indexOf(String(steam64id)) !== -1) { //is the user already getting comments? (-1 means not included)
                return respondmethod(403, lang.commentuseralreadyrecieving)
            } }
          }) }

        if (config.globalcommentcooldown != 0) { //check for global cooldown
          if ((Date.now() - commentedrecently) < config.globalcommentcooldown) { 
            var remainingglobalcooldown = Math.abs((((Date.now() - commentedrecently)) - (config.globalcommentcooldown)) / 1000)
            var remainingglobalcooldownunit = "seconds"
            if (remainingglobalcooldown > 120) { var remainingglobalcooldown = remainingglobalcooldown / 60; var remainingglobalcooldownunit = "minutes" }
            if (remainingglobalcooldown > 120) { var remainingglobalcooldown = remainingglobalcooldown / 60; var remainingglobalcooldownunit = "hours" }

            respondmethod(403, lang.commentglobaloncooldown.replace("remainingglobalcooldown", controller.round(remainingglobalcooldown, 2)).replace("timeunit", remainingglobalcooldownunit)) //send error message
            return; }}

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
              return; }}

          /* --------- Check if custom quotes were provided --------- */
          if (args[2] !== undefined) {
            quoteselection = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); //change default quotes to custom quotes
          } } //arg[0] if statement ends here

        /* --------- Check if user did not provide numberofcomments --------- */
        if (numberofcomments === undefined) { //no numberofcomments given? ask again
          if (Object.keys(controller.botobject).length == 1 && config.repeatedComments == 1) { var numberofcomments = 1 } else { //if only one account is active, set 1 automatically
            respondmethod(400, lang.commentmissingnumberofcommentsreplace("maxrequestamount", Object.keys(controller.communityobject).length * config.repeatedComments).replace("commentcmdusage", commentcmdusage))
            return; }}


        /* --------- Check for steamcommunity related errors/limitations --------- */
        //Check all accounts if they are limited and send user profile link if not friends
        accstoadd[requesterSteamID] = []

        for (i in controller.botobject) {
          if (Number(i) + 1 <= numberofcomments && Number(i) + 1 <= Object.keys(controller.botobject).length) { //only check if this acc is needed for a comment
            try {
              if (controller.botobject[i].limitations.limited == true && !Object.keys(controller.botobject[i].myFriends).includes(new SteamID(String(steamID)).getSteamID64())) {
                accstoadd[requesterSteamID].push(`\n 'https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[i].steamID)).getSteamID64()}'`) }
            } catch (err) {
              logger("Error checking if comment requester is friend with limited bot accounts: " + err) }} //This error check was implemented as a temporary solution to fix this error (and should be fine since it seems that this error is rare and at least prevents from crashing the bot): https://github.com/HerrEurobeat/steam-comment-service-bot/issues/54


          if (Number(i) + 1 == numberofcomments && accstoadd[requesterSteamID].length > 0 || Number(i) + 1 == Object.keys(controller.botobject).length && accstoadd[requesterSteamID].length > 0) {
            respondmethod(403, lang.commentaddbotaccounts.replace("numberofcomments", numberofcomments) + "\n" + accstoadd[requesterSteamID])
            return; } } //stop right here criminal

        community.getSteamUser(steamID, (err, user) => { //check if profile is private
          if (err) logger(`[${thisbot}] comment check for private account error: ${err}\nTrying to comment anyway and hoping no error occurs...`)
            else { if (user.privacyState != "public") { return respondmethod(403, lang.commentuserprofileprivate) }} //only check if getting the Steam user's data didn't result in an error

          /* --------- Actually start the commenting process --------- */
          var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; 
          var comment = randomstring(quoteselection); //get random quote

          community.postUserComment(steamID, comment, (error) => { //post comment
            if(error) {
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

              //Get last successful comment time to display it in error message
              lastsuccessfulcomment(cb => {
                let localoffset = new Date().getTimezoneOffset() * 60000

                respondmethod(500, `${lang.commenterroroccurred}\n${errordesc}\n\nDetails: \n[${thisbot}] postUserComment error: ${error}\n\nLast successful comment: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`)
                logger(`[${thisbot}] postUserComment error: ${error}\n${errordesc}\nLast successful comment: ${(new Date(cb + (localoffset *= -1))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`) }) //Add local time offset (and make negative number postive/positive number negative because the function returns the difference between local time to utc) to cb to convert it to local time

              if (error == "Error: HTTP error 429" || error == "Error: You've been posting too frequently, and can't make another post right now") commentedrecently = Date.now() + 300000 //add 5 minutes to commentedrecently if cooldown error
              return; }

            logger(`\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment on ${steam64id}: ${String(comment).split("\n")[0]}\x1b[0m`) //splitting \n to only get first line of multi line comments

            if (numberofcomments == 1) respondmethod(200, lang.commentsuccess)
              else {
                var waittime = ((numberofcomments - 1) * config.commentdelay) / 1000 //calculate estimated wait time (first comment is instant -> remove 1 from numberofcomments)
                var waittimeunit = "seconds"
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }
                respondmethod(200, lang.commentprocessstarted.replace("numberofcomments", numberofcomments).replace("waittime", Number(Math.round(waittime+'e'+3)+'e-'+3)).replace("timeunit", waittimeunit))

                controller.commenteverywhere(steamID, numberofcomments, requesterSteamID, res, quoteselection) } //Let all other accounts comment


            /* --------- Activate globalcooldown & give user cooldown --------- */ 
            if (config.globalcommentcooldown !== 0) {
              commentedrecently = Date.now() }

            //add estimated wait time in ms to start the cooldown after the last recieved comment
            controller.lastcomment.update({ id: requesterSteamID }, { $set: { time: Date.now() + (((numberofcomments - 1) * config.commentdelay)) } }, {}, (err) => { 
              if (err) logger("Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err) })
          })
        }) } //This was the critical part of this bot. Let's carry on and hope that everything holds together.

      Object.keys(controller.botobject[0]).push(commentcmd)
      controller.botobject[0].commentcmd = commentcmd

      /* --------- End of comment command --------- */
    }
  });

  bot.on("webSession", (sessionID, cookies) => { //get websession (log in to chat)
    community.setCookies(cookies); //set cookies (otherwise the bot is unable to comment)
    if (loginindex == 0) controller.botobject[0]["configgroup64id"] = configgroup64id //export configgroup64id to access it from controller.js when botsgroup == yourgroup
    controller.accisloggedin = true; //set to true to log next account in

    //Accept offline group & friend invites
    logger(`[${thisbot}] Got websession and set cookies.`, false, true)
    logger(`[${thisbot}] Accepting offline friend & group invites...`, false, true)
    for (let i = 0; i < Object.keys(bot.myFriends).length; i++) { //Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/  
        if (bot.myFriends[Object.keys(bot.myFriends)[i]] == 2) {
            bot.addFriend(Object.keys(bot.myFriends)[i]); //accept friend request
            logger(`[${thisbot}] Added user while I was offline! User: ` + Object.keys(bot.myFriends)[i])
            chatmsg(String(Object.keys(bot.myFriends)[i]), lang.useradded)

            //Add user to lastcomment database
            let lastcommentobj = {
              id: Object.keys(bot.myFriends)[i],
              time: Date.now() - (config.commentcooldown * 60000) } //subtract commentcooldown so that the user is able to use the command instantly

            controller.lastcomment.remove({ id: Object.keys(bot.myFriends)[i] }, {}, (err) => { }) //remove any old entries
            controller.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("Error inserting new user into lastcomment.db database! Error: " + err) })

            if (configgroup64id.length > 1 && Object.keys(bot.myGroups).includes(configgroup64id)) { 
              bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID(configgroup64id));

              if (configgroup64id !== "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
                bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID("103582791464712227")); }} //invite the user to your group
        } }

    for (let i = 0; i < Object.keys(bot.myGroups).length; i++) {
      if (bot.myGroups[Object.keys(bot.myGroups)[i]] == 2) {
        if (config.acceptgroupinvites !== true) { //check if group accept is false
          if (config.botsgroup.length < 1) return; 
          if (Object.keys(bot.myGroups)[i] !== config.botsgroup) { return; }} //check if group id is bot group           
        bot.respondToGroupInvite(Object.keys(bot.myGroups)[i], true)
        logger(`[${thisbot}] Accepted group invite while I was offline: ` + Object.keys(bot.myGroups)[i])
    }}

    if(controller.checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"){process.exit(0)}
  });

  //Accept Friend & Group requests/invites
  bot.on('friendRelationship', (steamID, relationship) => {
    if (relationship === 2) {
      bot.addFriend(steamID); //accept friend request
      logger(`[${thisbot}] Added User: ` + new SteamID(String(steamID)).getSteamID64())
      if (loginindex === 0) {
        chatmsg(steamID, lang.useradded) }

      if (configgroup64id.length > 1 && Object.keys(bot.myGroups).includes(configgroup64id)) { 
        bot.inviteToGroup(steamID, new SteamID(configgroup64id)); //invite the user to your group
        
        if (configgroup64id != "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
          bot.inviteToGroup(steamID, new SteamID("103582791464712227")); } }


      let lastcommentobj = {
        id: new SteamID(String(steamID)).getSteamID64(),
        time: Date.now() - (config.commentcooldown * 60000) } //subtract commentcooldown so that the user is able to use the command instantly

      controller.lastcomment.remove({ id: new SteamID(String(steamID)).getSteamID64() }, {}, (err) => { }) //remove any old entries
      controller.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("Error inserting new user into lastcomment.db database! Error: " + err) })

      controller.friendlistcapacitycheck(loginindex); //check remaining friendlist space
    }
  });

  bot.on('groupRelationship', (steamID, relationship) => {
    if (relationship === 2) {
      if (config.acceptgroupinvites !== true) { //check if group accept is false
        if (config.botsgroup.length < 1) return; 
        if (new SteamID(String(steamID)).getSteamID64() !== config.botsgroup) { return; }} //check if group id is bot group  

      bot.respondToGroupInvite(steamID, true)
      logger(`[${thisbot}] Accepted group invite: ` + new SteamID(String(steamID)).getSteamID64())
    }
  });


  /* ------------ Message interactions: ------------ */
  bot.on('friendMessage', function(steamID, message) {
    var steam64id = new SteamID(String(steamID)).getSteamID64()
    var ownercheck = config.ownerid.includes(steam64id)
    if (bot.myFriends[steam64id] == 1 || bot.myFriends[steam64id] == 6) return; //User is blocked.

    //Spam "protection" because spamming the bot is bad!
    if (!lastmessage[steam64id] || lastmessage[steam64id][0] + commandcooldown < Date.now()) lastmessage[steam64id] = [Date.now(), 0] //Add user to array or Reset time
    if (lastmessage[steam64id] && lastmessage[steam64id][0] + commandcooldown > Date.now() && lastmessage[steam64id][1] > 5) return; //Just don't respond
    if (lastmessage[steam64id] && lastmessage[steam64id][0] + commandcooldown > Date.now() && lastmessage[steam64id][1] > 4) { //Inform the user about the cooldown
      chatmsg(steamID, lang.userspamblock)
      logger(`${steam64id} has been blocked for 60 seconds for spamming.`)
      lastmessage[steam64id][0] += 60000
      lastmessage[steam64id][1]++
      return; }
    if (!ownercheck) lastmessage[steam64id][1]++ //push new message to array if user isn't an owner

    logger(`[${thisbot}] Friend message from ${steam64id}: ${message}`); //log message
    
    //Deny non-friends the use of any command
    if (bot.myFriends[steam64id] != 3) return chatmsg(steamID, lang.usernotfriend)

    if (loginindex === 0) { //check if this is the main bot
      //Check if bot is not fully started yet and block cmd usage if that is the case to prevent errors
      if (controller.readyafter == 0) return chatmsg(steamID, lang.botnotready)

      var lastcommentsteamID = steam64id
      var notownerresponse = (() => { return chatmsg(steamID, lang.commandowneronly) })

      //Check if user is in lastcomment database
      controller.lastcomment.findOne({ id: steam64id }, (err, doc) => {
        if (err) logger("Database error on friendMessage. This is weird. Error: " + err)

        if (!doc) { //add user to database if he/she is missing for some reason
          let lastcommentobj = {
            id: new SteamID(String(steamID)).getSteamID64(),
            time: Date.now() - (config.commentcooldown * 60000) } //subtract commentcooldown so that the user is able to use the command instantly
          
          controller.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("Error inserting new user into lastcomment.db database! Error: " + err) }) }
      })

      var cont = message.slice("!").split(" ");
      var args = cont.slice(1); 

      switch(cont[0].toLowerCase()) {
        case '!h':
        case '!help':
          if (ownercheck) {
            if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commenttext = `'!comment (amount/"all") [profileid] [custom, quotes]' - Request x many or the max amount of comments (max ${Object.keys(controller.communityobject).length * config.repeatedComments}). Provide a profileid to comment on a specific profile.`
              else var commenttext = `'!comment ("1") [profileid] [custom, quotes]' - Request 1 comment (max amount with current settings). Provide a profile id to comment on a specific profile.`
          } else {
            if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commenttext = `'!comment (amount/"all")' - Request x many or the max amount of comments (max ${Object.keys(controller.communityobject).length * config.repeatedComments}).`
              else var commenttext = `'!comment' - Request a comment on your profile!` }

          if (ownercheck) { //idk if this is a good practice to define owner only commands in the same steam message but there are probably worse examples out there
            var resetcooldowntext =  `\n'!resetcooldown [profileid/"global"]' - Clear your, the profileid's or the global comment cooldown. Alias: !rc`;
            var addfriendtext =      `\n'!addfriend (profileid)'                          - Add friend with all bot accounts.`; 
            var unfriendtext =       `\n'!unfriend (profileid)'                            - Unfriend the user from all bot accounts.`; 
            var unfriendalltext =    `\n'!unfriendall ["abort"]'                          - Unfriends everyone with all bot accounts.`
            var leavegrouptext =     `\n'!leavegroup (groupid64/group url)' - Leave this group with all bot accounts.`;
            var leaveallgroupstext = `\n'!leaveallgroups ["abort"]'                   - Leaves all groups with all bot accounts.`
            var blocktext =          `\n'!block (profileid)'                                  - Blocks the user on Steam.`
            var unblocktext =        `\n'!unblock (profileid)'                             - Unblocks the user on Steam. Note: The user still seems to be ignored for a few days by Steam.`
            var evaltext =           `\n'!eval (javascript code)'                       - Run javascript code from the steam chat.`; 
            var restarttext =        `\n'!restart'                                                  - Restart the bot.`; 
            var settingstext =       `\n'!settings' (config key) (new value)  - Change a config value.`; 
            var logtext =            `\n'!log'                                                        - Shows the last 25 lines of the log.`; 
            var updatetext =         `\n'!update [true]'                                      - Check for an available update. 'true' forces an update.`; 
          } else {
            var resetcooldowntext = addfriendtext = unfriendtext = unfriendalltext = leavegrouptext = leaveallgroupstext = blocktext = unblocktext = evaltext = restarttext = settingstext = logtext = updatetext = ""; } //I'm really not proud of this line of "code"

          if (config.yourgroup.length > 1) var yourgrouptext = "\nJoin my '!group'!"; else var yourgrouptext = "";
          chatmsg(steamID, `
            () <-- needed argument\n[] <-- optional argument\n\nCommand list:\n
            ${commenttext}\n
            '!ping'                                                       - Get a pong and heartbeat in ms.
            '!info'                                                        - Get useful information about the bot and you.
            '!abort'                                                     - Abort your own comment process.${resetcooldowntext}${settingstext}${addfriendtext}${unfriendtext}${unfriendalltext}${leavegrouptext}${leaveallgroupstext}${blocktext}${unblocktext}
            '!failed'                                                     - See the exact errors of your last comment request.
            '!about'                                                    - Returns information what this is about.
            '!owner'                                                   - Get a link to the profile of the operator of this bot instance.${evaltext}${restarttext}${logtext}${updatetext}
            ${yourgrouptext}
          `)
          break;

        /* ------------------ Comment command ------------------ */
        case '!comment':
          commentcmd(steamID, args) //Just call the function like normal when the command was used
          break;
        case '!ping':
          var pingstart = Date.now()

          output = ""
          https.get(`https://steamcommunity.com/ping`, function(res){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              output += chunk });

            res.on('end', () => {
              chatmsg(steamID, lang.pingcmdmessage.replace("pingtime", Date.now() - pingstart))
            }) })
          break;
        case '!info':
          controller.lastcomment.findOne({ id: steam64id }, (err, doc) => {
            lastsuccessfulcomment(cb => {
              chatmsg(steamID, `
                -----------------------------------~~~~~------------------------------------ 
                >   ${extdata.mestr}'s Comment Bot [Version ${extdata.version}] (More info: !about)
                >   Uptime: ${Number(Math.round(((new Date() - controller.bootstart) / 3600000)+'e'+2)+'e-'+2)} hours
                >   'node.js' Version: ${process.version} | RAM Usage (RSS): ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB
                >   Accounts logged in: ${Object.keys(controller.communityobject).length} | repeatedComments: ${config.repeatedComments} | Branch: ${extdata.branch}
                |
                >   Your steam64ID: ${steam64id}
                >   Your last comment request: ${(new Date(doc.time)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)
                >   Last processed comment request: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)
                -----------------------------------~~~~~------------------------------------
              `) 
            }) })
          break;
        case '!owner':
          if (config.owner.length < 1) return chatmsg(steamID, lang.ownercmdnolink)
          chatmsg(steamID, lang.ownercmdmsg + "\n" + config.owner)
          break;
        case '!group':
          if (config.yourgroup.length < 1 || configgroup64id.length < 1) return chatmsg(steamID, lang.groupcmdnolink) //no group info at all? stop.
          if (configgroup64id.length > 1 && Object.keys(bot.myGroups).includes(configgroup64id)) { 
            bot.inviteToGroup(steamID, configgroup64id); chatmsg(steamID, lang.groupcmdinvitesent); 
            
            if (configgroup64id != "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
              bot.inviteToGroup(steamID, new SteamID("103582791464712227")); } 
            return; } //id? send invite and stop

          chatmsg(steamID, lang.groupcmdinvitelink + config.yourgroup) //seems like no id has been saved but an url. Send the user the url
          break;
        case '!abort':
          if (!controller.activecommentprocess.includes(steam64id)) return chatmsg(steamID, lang.abortcmdnoprocess)
          let index = controller.activecommentprocess.indexOf(steam64id) //get index of this steam64id
          controller.activecommentprocess.splice(index, 1)
          logger(`Aborting ${steam64id}'s comment process...`)
          chatmsg(steamID, lang.abortcmdsuccess)
          break;
        case '!rc':
        case '!resetcooldown':
          if (!ownercheck) return notownerresponse();
          if (config.commentcooldown === 0) { //is the cooldown enabled?
            return chatmsg(steamID, lang.resetcooldowncmdcooldowndisabled) }
          if (args[0]) { 
            if (args[0] == "global") { //Check if user wants to reset the global cooldown
              commentedrecently -= config.globalcommentcooldown //subtract cooldown on top the stored time
              return chatmsg(steamID, lang.resetcooldowncmdglobalreset) }

            if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid) 
            if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid) 
            var lastcommentsteamID = args[0] }

          controller.lastcomment.update({ id: lastcommentsteamID }, { $set: { time: Date.now() - (config.commentcooldown * 60000) } }, (err) => { 
            if (err) return chatmsg(steamID, "Error updating database entry: " + err)
              else chatmsg(steamID, lang.resetcooldowncmdsuccess.replace("profileid", lastcommentsteamID.toString())) })
          break;
        case '!config':
        case '!settings':
          if (!ownercheck) return notownerresponse();
  
          if (!args[0]) { 
            fs.readFile('./config.json', function(err, data) { //Use readFile to get an unprocessed object
              if (err) return chatmsg(steamID, lang.settingscmdfailedread + err)
              chatmsg(steamID, lang.settingscmdcurrentsettings + "\n" + data.toString().slice(1, -1)) }) //remove first and last character which are brackets
            return; }
          if (!args[1]) return chatmsg(steamID, "Please provide a new value for the key you want to change!")

          //Block those 3 values to don't allow another owner to take over ownership
          if (args[0] == "enableevalcmd" || args[0] == "ownerid" || args[0] == "owner") {
            return chatmsg(steamID, lang.settingscmdblockedvalues) }

          let keyvalue = config[args[0]] //save old value to be able to reset changes

          //I'm not proud of this code but whatever -> used to convert array into usable array
          if (Array.isArray(keyvalue)) {
            let newarr = []
            args.forEach((e, i) => {
              if (i == 0) return; //skip args[0]
              if (i == 1) e = e.slice(1) //remove first char which is a [
              if (i == args.length - 1) e = e.slice(0, -1) //remove last char which is a ]

              e = e.replace(/,/g, "") //Remove ,
              if (e.startsWith('"')) newarr[i - 1] = String(e.replace(/"/g, ""))
                else newarr[i - 1] = Number(e) })

            args[1] = newarr
          }

          //Convert to number or boolean as input is always a String
          if (typeof(keyvalue) == "number") args[1] = Number(args[1])
          if (typeof(keyvalue) == "boolean") { //prepare for stupid code because doing Boolean(value) will always return true
            if (args[1] == "true") args[1] = true
            if (args[1] == "false") args[1] = false } //could have been worse tbh
          
          if (keyvalue == undefined) return chatmsg(steamID, lang.settingscmdkeynotfound)
          if (keyvalue == args[1]) return chatmsg(steamID, lang.settingscmdsamevalue.replace("value", args[1]))

          config[args[0]] = args[1] //apply changes

          //32-bit integer limit check from controller.js's startup checks
          if (typeof(keyvalue) == "number" && config.commentdelay * config.repeatedComments * Object.keys(controller.logininfo).length > 2147483647) { //check this here after the key has been set and reset the changes if it should be true
            config[args[0]] = keyvalue
            return chatmsg(steamID, lang.settingscmdvaluetoobig) }//Just using the check from controller.js

          chatmsg(steamID, lang.settingscmdvaluechanged.replace("targetkey", args[0]).replace("oldvalue", keyvalue).replace("newvalue", args[1]))
          logger(`${args[0]} has been changed from ${keyvalue} to ${args[1]}.`)

          if (args[0] == "playinggames") {
            logger("Refreshing game status of all bot accounts...")
            Object.keys(controller.botobject).forEach((e, i) => {
              if (loginindex == 0) controller.botobject[i].gamesPlayed(config.playinggames); //set game only for the main bot
              if (loginindex != 0 && config.childaccsplaygames) controller.botobject[i].gamesPlayed(config.playinggames.slice(1, config.playinggames.length)) //play game with child bots but remove the custom game
            }) }

          //Get arrays on one line
          var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; },4)
          .replace(/"\[/g, '[')
          .replace(/\]"/g, ']')
          .replace(/\\"/g, '"')
          .replace(/""/g, '""');

          fs.writeFile("./config.json", stringifiedconfig, err => {
            if (err) return logger(`write settings cmd changes to config error: ${err}`)
          
            delete require.cache[require.resolve("../config")]
            config = require("../config.json")
          })
          break;
        case '!failed':
          controller.lastcomment.findOne({ id: steam64id }, (err, doc) => {
            if (!controller.failedcomments[steam64id] || Object.keys(controller.failedcomments[steam64id]).length < 1) return chatmsg(steamID, lang.failedcmdnothingfound);
            chatmsg(steamID, lang.failedcmdmsg.replace("requesttime", new Date(doc.time).toISOString().replace(/T/, ' ').replace(/\..+/, '')) + "\n\n" + JSON.stringify(controller.failedcomments[steam64id], null, 4))
          })
          break;
        case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
          chatmsg(steamID, controller.aboutstr)
          break;
        case '!addfriend':
          if (!ownercheck) return notownerresponse();
          if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
          if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)
          if (controller.botobject[0].limitations.limited == true) {
            chatmsg(steamID, lang.addfriendcmdacclimited.replace("profileid", args[0])) 
            return; }

          chatmsg(steamID, lang.addfriendcmdsuccess.replace("profileid", args[0]).replace("estimatedtime", 5 * Object.keys(controller.botobject).length))
          logger(`Adding friend ${args[0]} with all bot accounts... This will take ~${5 * Object.keys(controller.botobject).length} seconds.`)

          Object.keys(controller.botobject).forEach((i) => {
            if (controller.botobject[i].limitations.limited == true) {
              logger(`Can't add friend ${args[0]} with bot${i} because the bot account is limited.`) 
              return; }

            if (controller.botobject[i].myFriends[new SteamID(args[0])] != 3 && controller.botobject[i].myFriends[new SteamID(args[0])] != 1) { //check if provided user is not friend and not blocked
              setTimeout(() => {
                controller.communityobject[i].addFriend(new SteamID(args[0]).getSteam3RenderedID(), (err) => {
                  if (err) logger(`error adding ${args[0]} with bot${i}: ${err}`) 
                    else logger(`Added ${args[0]} with bot${i} as friend.`)
                  })
                
                controller.friendlistcapacitycheck(i); //check remaining friendlist space
              }, 5000 * i);
            } else {
              logger(`bot${i} is already friend with ${args[0]} or the account was blocked/blocked you.`) //somehow logs steamIDs in seperate row?!
            } })
          break;
        case '!unfriend':
          if (!ownercheck) return notownerresponse();
          if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
          if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

          Object.keys(controller.botobject).forEach((i) => {
            controller.botobject[i].removeFriend(new SteamID(args[0])) })

          chatmsg(steamID, lang.unfriendcmdsuccess.replace("profileid", args[0]))
          logger(`Removed friend ${args[0]} from all bot accounts.`)
          break;
        case '!unfriendall':
          if (!ownercheck) return notownerresponse();

          if (args[0] == "abort") { chatmsg(steamID, lang.unfriendallcmdabort); return abortunfriendall = true; }
          abortunfriendall = false
          chatmsg(steamID, lang.unfriendallcmdpending)

          setTimeout(() => {
            if (abortunfriendall) return logger("unfriendall process was aborted.");
            chatmsg(steamID, lang.unfriendallcmdstart)
            logger("Starting to unfriend everyone...")

            for (let i in controller.botobject) {
              for (let friend in controller.botobject[i].myFriends) {
                try {
                  if (!config.ownerid.includes(friend)) { 
                    controller.botobject[i].removeFriend(new SteamID(friend)) }
                } catch (err) {
                  logger(`[Bot ${i}] unfriendall error unfriending ${friend}: ${err}`)
                }}}
          }, 30000);
          break;
        case '!leavegroup':
          if (!ownercheck) return notownerresponse();
          if (isNaN(args[0]) && !String(args[0]).startsWith('https://steamcommunity.com/groups/')) return chatmsg(steamID, lang.leavegroupcmdinvalidgroup)

          if (String(args[0]).startsWith('https://steamcommunity.com/groups/')) {
            leavegroupoutput = ""
            https.get(`${args[0]}/memberslistxml/?xml=1`, function(leavegroupres) { //get group64id from code to simplify config
              leavegroupres.on('data', function (chunk) {
                leavegroupoutput += chunk });

              leavegroupres.on('end', () => {
                if (!String(leavegroupoutput).includes("<?xml") || !String(leavegroupoutput).includes("<groupID64>")) { //Check if botsgroupoutput is steam group xml data before parsing it
                  chatmsg(steamID, lang.leavegroupcmdnotfound)
                } else {
                  new xml2js.Parser().parseString(leavegroupoutput, function(err, leavegroupResult) {
                    if (err) return logger("error parsing leavegroup xml: " + err, true)

                    args[0] = leavegroupResult.memberList.groupID64
                    startleavegroup()
                  }) } }) 
              }).on("error", function(err) {
                logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get leavegroup information. Either Steam is down or your internet isn't working.\n          Error: " + err)
                chatmsg(steamID, lang.leavegroupcmderror + err)
              return;
            })
            } else { startleavegroup() }

          function startleavegroup() {
            var argsSteamID = new SteamID(String(args[0]))
            if (argsSteamID.isValid() === false || argsSteamID["type"] !== 7) return chatmsg(steamID, lang.leavegroupcmdinvalidgroup)

            Object.keys(controller.botobject).forEach((i) => {
              if (controller.botobject[i].myGroups[argsSteamID] === 3) {
                controller.communityobject[i].leaveGroup(argsSteamID) }})
            chatmsg(steamID, lang.leavegroupcmdsuccess.replace("profileid", args[0]))
            logger(`Left group ${args[0]} with all bot accounts.`) }
          break;
        case '!leaveallgroups':
          if (!ownercheck) return notownerresponse();

          if (args[0] == "abort") { chatmsg(steamID, lang.leaveallgroupscmdabort); return abortleaveallgroups = true; }
          abortleaveallgroups = false
          chatmsg(steamID, lang.leaveallgroupscmdpending)

          setTimeout(() => {
            if (abortleaveallgroups) return logger("leaveallgroups process was aborted.");
            chatmsg(steamID, lang.leaveallgroupscmdstart)
            logger("Starting to leave all groups...")

            for (let i in controller.botobject) {
              for (let group in controller.botobject[i].myGroups) {
                try {
                  if (controller.botobject[i].myGroups[group] == 3) {
                    if (group != cachefile.botsgroupid && group != cachefile.configgroup64id) {
                      controller.communityobject[i].leaveGroup(String(group)) }}
                } catch (err) {
                  logger(`[Bot ${i}] leaveallgroups error leaving ${group}: ${err}`)
                }}}
          }, 10000);
          break;
        case '!block': //Well it kinda works but unblocking doesn't. The friend relationship enum stays at 6
          if (!ownercheck) return notownerresponse();
          if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
          if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

          Object.keys(controller.botobject).forEach((i) => {
            controller.botobject[i].blockUser(new SteamID(args[0]), err => { if (err) logger(`[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) })
          chatmsg(steamID, lang.blockcmdsuccess.replace("profileid", args[0]))
          logger(`Blocked ${args[0]} with all bot accounts.`)
          break;
        case '!unblock':
          if (!ownercheck) return notownerresponse();
          if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
          if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

          Object.keys(controller.botobject).forEach((i) => {
            if (controller.botobject[i].myFriends[new SteamID(args[0])] === 1) {
              controller.botobject[i].unblockUser(new SteamID(args[0]), err => { if (err) logger(`[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) }})
          chatmsg(steamID, lang.unblockcmdsuccess.replace("profileid", args[0]))
          logger(`Unblocked ${args[0]} with all bot accounts.`)
          break;
        case '!rs':
        case '!restart':
          if (!ownercheck) return notownerresponse();
          chatmsg(steamID, lang.restartcmdrestarting)
          require('../start.js').restart(updater.skippedaccounts)
          break;
        case '!stop':
          if (!ownercheck) return notownerresponse();
          chatmsg(steamID, lang.stopcmdstopping)
          require('../start.js').stop()
          break;
        case '!update':
          if (!ownercheck) return notownerresponse();

          if (args[0] == "true") { updater.checkforupdate(true, steamID); chatmsg(steamID, lang.updatecmdforce.replace("branchname", extdata.branch)) }
            else { updater.checkforupdate(false, steamID); chatmsg(steamID, lang.updatecmdcheck.replace(branchname, extdata.branch)) }
          break;
        case '!log':
        case '!output':
          if (!ownercheck) return notownerresponse();
          fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error getting last 25 lines from output for log cmd: " + err)
            chatmsg(steamID, "These are the last 25 lines:\n\n" + data.toString().split('\n').slice(data.toString().split('\n').length - 25).join('\n')) })
          break;
        case '!eval':
          if (config.enableevalcmd !== true) return chatmsg(steamID, lang.evalcmdturnedoff)
          if (!ownercheck) return notownerresponse();
          const clean = text => {
            if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
              else return text; }

            try {
              const code = args.join(" ");
              if (code.includes('logininfo')) return chatmsg(steamID, lang.evalcmdlogininfoblock) //not 100% save but should be at least some protection (only owners can use this cmd)
              let evaled = eval(code);
              if (typeof evaled !== "string")
              evaled = require("util").inspect(evaled);
      
              chatmsg(steamID, `Code executed. Result:\n\n${clean(evaled)}`)
              logger('\n\x1b[33mEval result:\x1b[0m \n' + clean(evaled) + "\n", true)
            } catch (err) {
              chatmsg(steamID, `Error:\n${clean(err)}`)
              logger('\n\x1b[33mEval error:\x1b[0m \n' + clean(err) + "\n", true)                                                                                                                                                                                                                                                                                                                 //Hi I'm a comment that serves no purpose
              return; }
          break;
        default: //cmd not recognized
          if (message.startsWith("!")) chatmsg(steamID, lang.commandnotfound) }
    } else {
      switch(message.toLowerCase()) {
        case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
          chatmsg(steamID, controller.aboutstr)
          break;
        default:
          if (message.startsWith("!")) chatmsg(steamID, `${lang.childbotmessage}\nhttps://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[0].steamID)).getSteamID64()}`)
      }
    }
  });

  bot.on("disconnected", (eresult, msg) => {
    logger(`\x1b[31m[${thisbot}] Lost connection to Steam. Bot should relog automatically. Message: ${msg} | Check: https://steamstat.us\x1b[0m`) })

  module.exports={
    bot
  }
}

//Code by: https://github.com/HerrEurobeat/ 