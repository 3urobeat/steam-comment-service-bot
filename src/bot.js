//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!


module.exports.run = async (logOnOptions, loginindex) => {
  const SteamUser = require('steam-user');
  const SteamCommunity = require('steamcommunity');
  const SteamID = require('steamid');
  const fs = require("fs");
  const xml2js = require('xml2js');
  const https = require('https')

  var updater = require('../updater.js');
  var controller = require("./controller.js");
  var config = require('../config.json');
  var extdata = require('./data.json');
  var cachefile = require('./cache.json');
  var lastcomment = require("./lastcomment.json");

  var logger = controller.logger
  var commentedrecently = false; //global cooldown for the comment command
  accstoadd = []

  if (loginindex == 0) var thisbot = "Main"
    else var thisbot = `Bot ${loginindex}`

  //Get proxy of this bot account
  if ((loginindex + 1) - (Object.keys(controller.logininfo).length / controller.proxies.length * controller.proxyShift) > Object.keys(controller.logininfo).length / controller.proxies.length) controller.proxyShift++ //if loginindex is greater than how often one proxie can be used -> raise proxy number
  var thisproxy = controller.proxies[controller.proxyShift]

  const bot = new SteamUser({ httpProxy: thisproxy });
  const community = new SteamCommunity();

  
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
  var loggedininterval = setInterval(() => { //set an interval to check if previous acc is logged on
    if(controller.accisloggedin) {
      clearInterval(loggedininterval) //stop interval
      controller.accisloggedin = false; //set to false again
      if (thisproxy == null) logger(`[${thisbot}] Trying to log in without proxy...`, false, true)
        else logger(`[${thisbot}] Trying to log in with proxy ${controller.proxyShift}...`, false, true)
      bot.logOn(logOnOptions)
    }
  }, 250);

  bot.on('error', (err) => { //Handle errors that were caused during logOn
    logger(`Error while trying to log in bot${loginindex}: ${err}`, true)
    if (thisproxy != null) logger(`Your proxy ${controller.proxyShift} might be blocked by Steam...`, true)

    if (loginindex == 0) {
      logger("\nAborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true)
      process.exit(0)
    } else {
      logger(`Failed account is not bot0. Skipping account...`, true)
      controller.accisloggedin = true; //set to true to log next account in
      updater.skippedaccounts.push(loginindex)
      controller.skippednow.push(loginindex) }
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
    if (loginindex == 0) bot.gamesPlayed(config.playinggames); //set game only for the "leader" bot
      else if (config.childaccsplaygames) { config.playinggames.shift(); bot.gamesPlayed(config.playinggames); }

    controller.communityobject[loginindex] = community //export this community instance to the communityobject to access it from controller.js
    controller.botobject[loginindex] = bot //export this bot instance to the botobject to access it from controller.js
  });

  bot.on("webSession", (sessionID, cookies) => { //get websession (log in to chat)
    community.setCookies(cookies); //set cookies (otherwise the bot is unable to comment)
    if (loginindex == 0) controller.botobject[0]["configgroup64id"] = configgroup64id //export configgroup64id to access it from controller.js when botsgroup == yourgroup
    controller.accisloggedin = true; //set to true to log next account in

    //Accept offline group & friend invites
    logger(`[${thisbot}] Got websession and set cookies.`, false, true)
    logger(`[${thisbot}] Accepting offline friend & group invites...`, false, true)
    for (let i = 0; i < Object.keys(bot.myFriends).length; i++) { //Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/  
      if (!lastcomment[Object.keys(bot.myFriends)[i] + loginindex]) { //always check if user is on lastcomment to avoid errors
        lastcomment[Object.keys(bot.myFriends)[i] + loginindex] = {
          time: Date.now() - (config.commentcooldown * 60000),
          bot: bot.steamID.accountid } }

        if (bot.myFriends[Object.keys(bot.myFriends)[i]] == 2) {
            bot.addFriend(Object.keys(bot.myFriends)[i]); //accept friend request
            logger(`[${thisbot}] Added user while I was offline! User: ` + Object.keys(bot.myFriends)[i])
            bot.chatMessage(String(Object.keys(bot.myFriends)[i]), 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more commands or !about for more information!')

            lastcomment[Object.keys(bot.myFriends)[i] + loginindex] = { //add user to lastcomment file in order to also unfriend him when he never used !comment
              time: Date.now() - (config.commentcooldown * 60000), //subtract unfriendtime to enable comment usage immediately
              bot: bot.steamID.accountid }
            if (configgroup64id.length > 1 && Object.keys(bot.myGroups).includes(configgroup64id)) { 
              bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID(configgroup64id)); 

              if (configgroup64id !== "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
                bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID("103582791464712227")); }} //invite the user to your group
        }

        if (i + 1 === Object.keys(bot.myFriends).length) { //check for last iteration
          fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
            if (err) logger(`[${thisbot}] add user to lastcomment.json error: ${err}`) }) } }

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
        bot.chatMessage(steamID, 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more commands or !about for more information!') }

      if (configgroup64id.length > 1 && Object.keys(bot.myGroups).includes(configgroup64id)) { 
              bot.inviteToGroup(steamID, new SteamID(configgroup64id)); //invite the user to your group
              
              if (configgroup64id != "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
                bot.inviteToGroup(steamID, new SteamID("103582791464712227")); }}

      lastcomment[new SteamID(String(steamID)).getSteamID64() + loginindex] = { //add user to lastcomment file in order to also unfriend him when he never used !comment
        time: Date.now() - (config.commentcooldown * 60000), //subtract unfriendtime to enable comment usage immediately
        bot: bot.steamID.accountid }
      fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
        if (err) logger(`[${thisbot}] delete user from lastcomment.json error: ${err}`) })
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
    logger(`[${thisbot}] Friend message from ${steam64id}: ${message}`); //log message

    if (loginindex === 0) { //check if this is the main bot
      var msgrecievedtime = Date.now() //timestamp to calculate time needed to process request
      var lastcommentsteamID = steam64id + loginindex

      var cont = message.slice("!").split(" ");
      var args = cont.slice(1);

      if (!lastcomment[lastcommentsteamID]) { //user is somehow not in lastcomment.json? oh god not again... write user to lastcomment.json to avoid errors
        logger(`Missing user (${steam64id}) from lastcomment.json! Writing to prevent error...`)

        lastcomment[steam64id + loginindex] = {
          time: Date.now() - (config.commentcooldown * 60000), //subtract unfriendtime to enable comment usage immediately
          bot: bot.steamID.accountid }
        fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
          if (err) logger(`[${thisbot}] add missing user to lastcomment.json error: ${err}`) }) }

      switch(cont[0].toLowerCase()) {
        case '!help':
          var ownercheck = config.ownerid.includes(steam64id)
          if (ownercheck) {
            if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commenttext = `'!comment (amount/"all") [profileid]' - Request x many or the max amount of comments (max ${Object.keys(controller.communityobject).length * config.repeatedComments}). Provide a profileid to comment on a specific profile.`
              else var commenttext = `'!comment ("1") [profileid]' - Request 1 comment (max amount with current settings). Provide a profile id to comment on a specific profile.`
          } else {
            if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commenttext = `'!comment (amount/"all")' - Request x many or the max amount of comments (max ${Object.keys(controller.communityobject).length * config.repeatedComments}).`
              else var commenttext = `'!comment' - Request a comment on your profile!` }

          if (ownercheck) var resetcooldowntext = `\n'!resetcooldown [profileid]'                 - Clear your or the profileid's comment cooldown.`; else var resetcooldowntext = "";
          if (ownercheck) var addfriendtext =     `\n'!addfriend (profileid)'                          - Add friend with all bot accounts.`; else var addfriendtext = "";
          if (ownercheck) var unfriendtext =      `\n'!unfriend (profileid)'                            - Unfriend the user from all bot accounts.`; else var unfriendtext = "";
          if (ownercheck) var leavegrouptext =    `\n'!leavegroup (groupid64/group url)' - Leave this group with all bot accounts.`; else var leavegrouptext = "";
          if (ownercheck) var evaltext =          `\n'!eval (javascript code)'                       - Run javascript code from the steam chat.`; else var evaltext = "";
          if (ownercheck) var restarttext =       `\n'!restart'                                                  - Restart the bot.`; else var restarttext = "";
          if (ownercheck) var updatetext =        `\n'!update [true]'                                      - Check for an available update. 'true' forces an update.`; else var updatetext = "";
          if (config.yourgroup.length > 1) var yourgrouptext = "\nJoin my '!group'!"; else var yourgrouptext = "";
          bot.chatMessage(steamID, `
            () <-- needed argument\n[] <-- optional argument\n\nCommand list:\n
            ${commenttext}
            '!ping'                                                       - Get a pong and heartbeat in ms.
            '!info'                                                        - Get useful information about the bot and you.${resetcooldowntext}${addfriendtext}${unfriendtext}${leavegrouptext}
            '!failed'                                                     - See the exact errors of your last comment request.
            '!about'                                                    - Returns information what this is about.
            '!owner'                                                   - Get a link to the profile of the operator of this bot instance.${evaltext}${restarttext}${updatetext}
            ${yourgrouptext}
          `)
          break;

        /* ------------------ Comment command ------------------ */
        case '!comment':

          /* --------- Check for disabled comment cmd or if update is queued --------- */
          if (updater.activeupdate) return bot.chatMessage(steamID, "The bot is currently waiting for the last requested comment to be finished in order to download an update!\nPlease wait a moment and try again.");
          if (config.allowcommentcmdusage === false && !config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "The bot owner set this command to owners only.\nType !owner to get information who the owner is.\nType !about to get a link to the bot creator.") 


          /* --------- Define command usage messages for each user's priviliges --------- */
          var ownercheck = config.ownerid.includes(steam64id)
          if (ownercheck) {
            if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commentcmdusage = `'!comment number_of_comments/"all" profileid' for X many or the max amount of comments (max ${Object.keys(controller.communityobject).length * config.repeatedComments}). Provide a profile id to comment on a specific profile.`
              else var commentcmdusage = `'!comment 1 profileid'. Provide a profile id to comment on a specific profile.`
          } else {
            if (Object.keys(controller.communityobject).length > 1 || config.repeatedComments > 1) var commentcmdusage = `'!comment number_of_comments/"all"' for X many or the max amount of comments (max ${Object.keys(controller.communityobject).length * config.repeatedComments}).`
              else var commentcmdusage = `'!comment' for a comment on your profile!` }


          /* ------------------ Check for cooldowns ------------------ */
          if (config.commentcooldown !== 0) { //check for user specific cooldown
            if ((Date.now() - lastcomment[lastcommentsteamID].time) < (config.commentcooldown * 60000)) { //check if user has cooldown applied
              var remainingcooldown = Math.abs(((Date.now() - lastcomment[lastcommentsteamID].time) / 1000) - (config.commentcooldown * 60))
              var remainingcooldownunit = "seconds"
              if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "minutes" }
              if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "hours" }

              bot.chatMessage(steamID, `You requested a comment in the last ${config.commentcooldown} minutes. Please wait the remaining ${controller.round(remainingcooldown, 2)} ${remainingcooldownunit}.`) //send error message
              return; }
            } else {
              if (controller.activecommentprocess.indexOf(String(steam64id)) !== -1) { //is the user already getting comments? (-1 means not included)
                return bot.chatMessage(steamID, "You are currently recieving previously requested comments. Please wait for them to be completed.") }}

          if (config.globalcommentcooldown !== 0) { //check for global cooldown
            if (commentedrecently) { 
              bot.chatMessage(steamID, `Someone else requested a comment in the last ${config.globalcommentcooldown / 1000} seconds. Please wait a moment.`) //send error message
              return; }}


          var requesterSteamID = new SteamID(String(steamID)).getSteamID64() //save steamID of comment requesting user so that messages are being send to the requesting user and not to the reciever if a profileid has been provided


          /* --------- Check numberofcomments argument if it was provided --------- */
          if (args[0] !== undefined) {
            if (isNaN(args[0])) { //isn't a number?
              if (args[0].toLowerCase() == "all") {
                args[0] = Object.keys(controller.communityobject).length * config.repeatedComments //replace the argument with the max amount of comments
              } else {
                return bot.chatMessage(steamID, `This is not a valid number!\nCommand usage: ${commentcmdusage}`) 
              }
            }

            if (args[0] > Object.keys(controller.communityobject).length * config.repeatedComments) { //number is greater than accounts * repeatedComments?
              return bot.chatMessage(steamID, `You can request max. ${Object.keys(controller.communityobject).length * config.repeatedComments} comments.\nCommand usage: ${commentcmdusage}`) }
            var numberofcomments = args[0]

            //Code by: https://github.com/HerrEurobeat/ 


            /* --------- Check profileid argument if it was provided --------- */
            if (args[1] !== undefined) {
              if (config.ownerid.includes(new SteamID(String(steamID)).getSteamID64()) || args[1] == new SteamID(String(steamID)).getSteamID64()) { //check if user is a bot owner or if he provided his own profile id
                if (isNaN(args[1])) return bot.chatMessage(steamID, `This is not a valid profileid! A profile id must look like this: 76561198260031749\nCommand usage: ${commentcmdusage}`)
                if (new SteamID(args[1]).isValid() === false) return bot.chatMessage(steamID, `This is not a valid profileid! A profile id must look like this: 76561198260031749\nCommand usage: ${commentcmdusage}`)

                steamID.accountid = parseInt(new SteamID(args[1]).accountid) //edit accountid value of steamID parameter of friendMessage event and replace requester's accountid with the new one
              } else {
                bot.chatMessage(steamID, "Specifying a profileid is only allowed for bot owners.\nIf you are a bot owner, make sure you added your ownerid to the config.json.")
                return; }} } //arg[0] if statement ends here


          /* --------- Check if user did not provide numberofcomments --------- */
          if (numberofcomments === undefined) { //no numberofcomments given? ask again
            if (Object.keys(controller.botobject).length == 1 && config.repeatedComments == 1) { var numberofcomments = 1 } else { //if only one account is active, set 1 automatically
              bot.chatMessage(requesterSteamID, `Please specify how many comments out of ${Object.keys(controller.communityobject).length * config.repeatedComments} you would like to request.\nCommand usage: ${commentcmdusage}`)
              return; }}


          /* --------- Check for steamcommunity related errors/limitations --------- */
          //Check all accounts if they are limited and send user profile link if not friends
          accstoadd[requesterSteamID] = []

          for (i in controller.botobject) {
            if (Number(i) + 1 <= numberofcomments && Number(i) + 1 <= Object.keys(controller.botobject).length) { //only check if this acc is wanted for a comment
              if (controller.botobject[i].limitations.limited == true && !Object.keys(controller.botobject[i].myFriends).includes(steam64id)) {
                accstoadd[requesterSteamID].push(`\n 'https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[i].steamID)).getSteamID64()}'`) }}

            if (Number(i) + 1 == numberofcomments && accstoadd[requesterSteamID].length > 0 || Number(i) + 1 == Object.keys(controller.botobject).length && accstoadd[requesterSteamID].length > 0) {
              bot.chatMessage(steamID, `In order to request ${numberofcomments} comments you will first need to add this/these accounts: (limited bot accounts)\n` + accstoadd[requesterSteamID])
              return; } } //stop right here criminal

          community.getSteamUser(steamID, (err, user) => { //check if profile is private
            if (err) return logger(`[${thisbot}] comment check for private account error: ${err}`)
            if (user.privacyState != "public") return bot.chatMessage(steamID, "Your/the recieving profile seems to be private. Please edit your/the privacy settings on your/the recieving profile and try again!") });


          /* --------- Actually start the commenting process --------- */
          var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; 
          var comment = randomstring(controller.quotes); //get random quote

          community.postUserComment(steamID, comment, (error) => { //post comment
            if(error) {
              bot.chatMessage(requesterSteamID, `Oops, an error occurred! Details: \n[${thisbot}] postUserComment error: ${error}\nPlease try again in a moment!`); 
              logger(`[${thisbot}] postUserComment error: ${error}`); 
              return; }

            logger(`\x1b[32m[${thisbot}] ${numberofcomments} Comment(s) requested. Comment on ${steam64id}: ${comment}\x1b[0m`)
            if (numberofcomments == 1) bot.chatMessage(requesterSteamID, 'Okay I commented on your/the recieving profile! If you are a nice person then leave a +rep on my profile!')
              else {
                var waittime = ((numberofcomments - 1) * config.commentdelay) / 1000 //calculate estimated wait time (first comment is instant -> remove 1 from numberofcomments)
                var waittimeunit = "seconds"
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }
                bot.chatMessage(requesterSteamID, `Estimated wait time for ${numberofcomments} comments: ${Number(Math.round(waittime+'e'+3)+'e-'+3)} ${waittimeunit}.`)

                controller.commenteverywhere(steamID, numberofcomments, requesterSteamID) //Let all other accounts comment
              }


            /* --------- Activate globalcooldown & give user cooldown --------- */ 
            if (config.globalcommentcooldown !== 0) {
              commentedrecently = true;
              setTimeout(() => { //global cooldown
                commentedrecently = false;
              }, config.globalcommentcooldown) }

            if (controller.botobject[loginindex].myFriends[requesterSteamID] === 3) {
              lastcomment[requesterSteamID + loginindex] = {
                time: Date.now(),
                bot: bot.steamID.accountid }
              fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                if (err) logger(`[${thisbot}] delete user from lastcomment.json error: ${err}`) }) } })

          //This was the critical part of this bot. Let's carry on and hope that everything holds together.
          break;

        case '!ping':
          bot.chatMessage(steamID, `Pong!\nHeartbeat: ${Date.now() - msgrecievedtime}ms`)
          break;
        case '!info':
          bot.chatMessage(steamID, `
            -----------------------------------~~~~~------------------------------------ 
            >   ${extdata.mestr}'s Comment Bot [Version ${extdata.version}] (More info: !about)
            >   Uptime: ${Number(Math.round(((new Date() - controller.bootstart) / 3600000)+'e'+2)+'e-'+2)} hours | Heartbeat: ${Date.now() - msgrecievedtime}ms
            >   'node.js' Version: ${process.version} | RAM Usage (RSS): ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB
            >   Accounts logged in: ${Object.keys(controller.communityobject).length} | Branch: ${updater.releasemode}
            |
            >   Your steam64ID: ${steam64id}
            >   Your last comment request: ${(new Date(lastcomment[lastcommentsteamID].time)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (UTC/GMT time)
            -----------------------------------~~~~~------------------------------------
          `)
          break;
        case '!owner':
          if (config.owner.length < 1) return bot.chatMessage(steamID, "I don't know that command. Type !help for more info.\n(Bot Owner didn't include link to him/herself.)")
          bot.chatMessage(steamID, "Check out my owner's profile: (for more information about the bot type !about)\n" + config.owner)
          break;
        case '!group':
          if (config.yourgroup.length < 1 || configgroup64id.length < 1) return bot.chatMessage(steamID, "The botowner of this instance hasn't provided any group or the group doesn't exist.") //no group info at all? stop.
          if (configgroup64id.length > 1 && Object.keys(bot.myGroups).includes(configgroup64id)) { 
            bot.inviteToGroup(steamID, configgroup64id); bot.chatMessage(steamID, "I send you an invite! Thanks for joining!"); 
            
            if (configgroup64id != "103582791464712227") { //https://steamcommunity.com/groups/3urobeatGroup
              bot.inviteToGroup(steamID, new SteamID("103582791464712227")); } 
            return; } //id? send invite and stop

          bot.chatMessage(steamID, "Join my group here: " + config.yourgroup) //seems like no id has been saved but an url. Send the user the url
          break;
        case '!resetcooldown':
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          if (config.commentcooldown === 0) { //is the cooldown enabled?
            return bot.chatMessage(steamID, "The cooldown is disabled in the config!") }
          if (args[0]) { 
            if (isNaN(args[0])) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749") 
            if (new SteamID(args[0]).isValid() === false) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749") 
            var lastcommentsteamID = args[0] + loginindex }

          if ((Date.now() - lastcomment[lastcommentsteamID].time) < (config.commentcooldown * 60000)) { //check if user has cooldown applied
            lastcomment[lastcommentsteamID].time = Date.now() - (config.commentcooldown * 60000)
            fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
              if (err) logger(`[${thisbot}] remove ${lastcommentsteamID} from lastcomment.json error: ${err}`) })
            bot.chatMessage(steamID, `${lastcommentsteamID.toString().slice(0, -1)}'s cooldown has been cleared.`) } else {
              bot.chatMessage(steamID, `There is no cooldown for ${lastcommentsteamID.toString().slice(0, -1)} applied.`) }
          break;
        case '!failed':
          if (!controller.failedcomments[steam64id] || Object.keys(controller.failedcomments[steam64id]).length < 1) return bot.chatMessage(steamID, "I can't remember any failed comments you have requested.");
          bot.chatMessage(steamID, `Your last request for '${steam64id}' from '${(new Date(lastcomment[lastcommentsteamID].time)).toISOString().replace(/T/, ' ').replace(/\..+/, '')}' (UTC/GMT time) had these errors:\n\n${JSON.stringify(controller.failedcomments[steam64id], null, 4)}`)
          break;
        case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
          bot.chatMessage(steamID, controller.aboutstr)
          break;
        case '!addfriend':
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          if (isNaN(args[0])) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749")
          if (new SteamID(args[0]).isValid() === false) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749")
          if (controller.botobject[0].limitations.limited == true) {
            bot.chatMessage(steamID, `Can't add friend ${args[0]} with bot0 because the bot account is limited.`) 
            return; }

          bot.chatMessage(steamID, `Adding friend ${args[0]} with all bots... This will take ~${5 * Object.keys(controller.botobject).length} seconds. Please check the terminal for potential errors.`)
          logger(`Adding friend ${args[0]} with all bots. This will take ~${5 * Object.keys(controller.botobject).length} seconds.`)

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
              }, 5000 * i);
            } else {
              logger(`bot${i} is already friend with ${args[0]} or the account was blocked/blocked you.`) //somehow logs steamIDs in seperate row?!
            } })
          break;
        case '!unfriend':
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          if (isNaN(args[0])) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749")
          if (new SteamID(args[0]).isValid() === false) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749")

          Object.keys(controller.botobject).forEach((i) => {
            if (controller.botobject[i].myFriends[new SteamID(args[0])] === 3) { //check if provided user is really a friend
              controller.botobject[i].removeFriend(new SteamID(args[0])) }})
          bot.chatMessage(steamID, `Removed friend ${args[0]} from all bots.`)
          logger(`Removed friend ${args[0]} from all bots.`)
          break;
        case '!leavegroup':
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          if (isNaN(args[0]) && !String(args[0]).startsWith('https://steamcommunity.com/groups/')) return bot.chatMessage(steamID, "This is not a valid group id or group url! \nA groupid must look like this: '103582791464712227' \n...or a group url like this: 'https://steamcommunity.com/groups/3urobeatGroup'")

          if (String(args[0]).startsWith('https://steamcommunity.com/groups/')) {
            leavegroupoutput = ""
            https.get(`${args[0]}/memberslistxml/?xml=1`, function(leavegroupres) { //get group64id from code to simplify config
              leavegroupres.on('data', function (chunk) {
                leavegroupoutput += chunk });

              leavegroupres.on('end', () => {
                if (!String(leavegroupoutput).includes("<?xml") || !String(leavegroupoutput).includes("<groupID64>")) { //Check if botsgroupoutput is steam group xml data before parsing it
                  logger("\x1b[0m[\x1b[31mNotice\x1b[0m] Your leave group link doesn't seem to be valid!", true); 
                  bot.chatMessage("\x1b[0m[\x1b[31mNotice\x1b[0m] Your leave group link doesn't seem to be valid!\n")
                } else {
                  new xml2js.Parser().parseString(leavegroupoutput, function(err, leavegroupResult) {
                    if (err) return logger("error parsing leavegroup xml: " + err, true)

                    args[0] = leavegroupResult.memberList.groupID64
                    startleavegroup()
                  }) } }) 
              }).on("error", function(err) {
                logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get leavegroup information. Either Steam is down or your internet isn't working.\n          Error: " + err)
                bot.chatMessage(steamID, "\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get leavegroup information. Either Steam is down or your internet isn't working.\n          Error: " + err)
              return;
            })
            } else { startleavegroup() }

          function startleavegroup() {
            var argsSteamID = new SteamID(String(args[0]))
            if (argsSteamID.isValid() === false || argsSteamID["type"] !== 7) return bot.chatMessage(steamID, "This is not a valid group id or group url! \nA groupid must look like this: '103582791464712227' \n...or a group url like this: 'https://steamcommunity.com/groups/3urobeatGroup'")

            Object.keys(controller.botobject).forEach((i) => {
              if (controller.botobject[i].myGroups[argsSteamID] === 3) {
                controller.communityobject[i].leaveGroup(argsSteamID) }})
            bot.chatMessage(steamID, `Left group '${args[0]}' with all bots.`)
            logger(`Left group ${args[0]} with all bots.`) }
          break;
        case '!restart':
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          bot.chatMessage(steamID, 'Restarting...')
          require('../start.js').restart(updater.skippedaccounts)
          break;
        case '!update':
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")

          if (args[0] == "true") { updater.checkforupdate(true, steamID); bot.chatMessage(steamID, `Forcing an update from the ${extdata.branch} branch...`) }
            else { updater.checkforupdate(false, steamID); bot.chatMessage(steamID, `Checking for an update in the ${extdata.branch} branch...`) }
          break;
        case '!eval':
          if (config.enableevalcmd !== true) return bot.chatMessage(steamID, "The eval command has been turned off!")
          if (!config.ownerid.includes(steam64id)) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          const clean = text => {
            if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
              else return text; }

            try {
              const code = args.join(" ");
              if (code.includes('logininfo')) return bot.chatMessage(steamID, "Your code includes 'logininfo'. In order to protect passwords this is not allowed.") //not 100% save but should be at least some protection (only owners can use this cmd)
              let evaled = eval(code);
              if (typeof evaled !== "string")
              evaled = require("util").inspect(evaled);
      
              bot.chatMessage(steamID, `Code executed. Result:\n\n${clean(evaled)}`)
              logger('\n\x1b[33mEval result:\x1b[0m \n' + clean(evaled) + "\n", true)
            } catch (err) {
              bot.chatMessage(steamID, `Error:\n${clean(err)}`)
              logger('\n\x1b[33mEval error:\x1b[0m \n' + clean(err) + "\n", true)                                                                                                                                                                                                                                                                                                                 //Hi I'm a comment that serves no purpose
              return; }
          break;
        default: //cmd not recognized
          bot.chatMessage(steamID, "I don't know that command. Type !help for more info.") }
    } else {
      switch(message.toLowerCase()) {
        case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
          bot.chatMessage(steamID, controller.aboutstr)
          break;
        default:
          bot.chatMessage(steamID, `This is one account running in a bot cluster.\nPlease add the main bot and send him a !help message.\nIf you want to check out what this is about, type: !about\nhttps://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[0].steamID)).getSteamID64()}`)
      }
    }
  });

  bot.on("disconnected", (eresult, msg) => {
    logger(`[${thisbot}] Lost connection to Steam. EResult: ${eresult} | Message: ${msg}`) })

  module.exports={
    bot
  }
}

//Code by: https://github.com/HerrEurobeat/ 