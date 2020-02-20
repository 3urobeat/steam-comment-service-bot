//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!


module.exports.run = async (logOnOptions, loginindex) => {
  const SteamUser = require('steam-user');
  const SteamCommunity = require('steamcommunity');
  const SteamID = require('steamid');
  var start = require("./start.js")
  const config = require('./config.json');
  const logininfo = require('./logininfo.json');
  var fs = require("fs");
  var logger = start.logger

  const bot = new SteamUser();
  const community = new SteamCommunity();
  const usedcommentrecently = new Set(); //user specific cooldown
  var commentedrecently = false; //global cooldown for the comment command

  var thisbot = `Bot ${loginindex}`
  if (config.mode === 2 && loginindex === 0) var thisbot = "Main"

  /* ------------ Login & Events: ------------ */
  var loggedininterval = setInterval(() => { //set an interval to check if previous acc is logged on
    if(start.accisloggedin === true) {
      bot.logOn(logOnOptions) 
      start.accisloggedin = false; //set to false again
      clearInterval(loggedininterval) //stop interval
    }
  }, 250);

  bot.on('steamGuard', function(domain, callback) {
    process.stdout.write(`[${logOnOptions.accountName}] Steam Guard Code: `)
    var stdin = process.openStdin();

    stdin.addListener('data', text => {
      var code = text.toString().trim()
      callback(code);

      stdin.pause() //stop reading
    })
  });

  bot.on('loggedOn', () => { //this account is now logged on
    start.accisloggedin = true; //set to true to log next account in
    bot.setPersona(config.status); //set online status
    if (config.mode === 1) { //individual mode
      bot.gamesPlayed(config.playinggames); //set game for all bots in mode 1
    } else if (config.mode === 2) { //connected mode
      if (loginindex === 0) bot.gamesPlayed(config.playinggames);; //set game only for the "leader" bot in mode 2
    }

    start.communityobject[loginindex] = community //export this community instance to the communityobject to access it from start.js
    start.botobject[loginindex] = bot //export this bot instance to the botobject to access it from start.js
  });

  bot.on("webSession", (sessionID, cookies) => { //get websession (log in to chat)
    community.setCookies(cookies); //set cookies (otherwise the bot is unable to comment)

    //Accept offline group & friend invites
    for (let i = 0; i < Object.keys(bot.myFriends).length; i++) { //Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/  
        if (bot.myFriends[Object.keys(bot.myFriends)[i]] == 2) {
            bot.addFriend(Object.keys(bot.myFriends)[i]);
            logger(`[${thisbot}] Added user while I was offline! User: ` + Object.keys(bot.myFriends)[i])
            bot.chatMessage(Object.keys(bot.myFriends)[i], 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more info!')
            bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID(config.yourgroup64id)); //invite the user to your group
        }}
    for (let i = 0; i < Object.keys(bot.myGroups).length; i++) {
      if (bot.myGroups[Object.keys(bot.myGroups)[i]] == 2) {
        if (config.acceptgroupinvites !== true) { //check if group accept is false
          if (config.botsgroupid.length < 1) return; 
          if (Object.keys(bot.myGroups)[i] !== config.botsgroupid) { return; }} //check if group id is bot group           
        bot.respondToGroupInvite(Object.keys(bot.myGroups)[i], true)
        logger(`[${thisbot}] Accepted group invite while I was offline: ` + Object.keys(bot.myGroups)[i])
    }}
  });

  /* ------------ Message interactions: ------------ */
  bot.on('friendMessage', function(steamID, message) {
    if (config.logcommandusage) logger(`[${thisbot}] Friend message from ${new SteamID(steamID.getSteam3RenderedID()).getSteamID64()}: ${message}`); //log message
    if (loginindex === 0 || config.mode === 1) { //check if this is the main bot or if mode 1 is set
      var cont = message.slice("!").split(" ");
      var args = cont.slice(1);
      switch(cont[0].toLowerCase()) {
        case '!help':
          if (config.owner.length > 1) var ownertext = "\nType '!owner' to check out my owner's profile!"; else var ownertext = "";
          if (config.yourgroup.length > 1) var yourgrouptext = "\n\nJoin my '!group'"; else var yourgrouptext = "";
          if (config.mode === 1) {
            bot.chatMessage(steamID, `Type '!comment' for a free comment!\nType '!ping' for a pong!\nType '!resetcooldown' to clear your cooldown if you are the botowner.\nType '!about' for credit (botcreator).${ownertext}${yourgrouptext}`)
          } else {
            bot.chatMessage(steamID, `Type '!comment number_of_comments profileid' for X many comments. profileid is botowner only.\nType '!ping' for a pong!\nType '!resetcooldown' to clear your cooldown if you are the botowner.\nType '!unfriend profileid' to unfriend this user from the bot if you are the botowner.\nType '!eval javascript code' to run javascript code from the steam chat. Botowner only.\nType '!about' for credit (botcreator).${ownertext}${yourgrouptext}`)
          }
          break;
        case '!comment':
          if (config.allowcommentcmdusage === false && !config.ownerid.includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return bot.chatMessage(steamID, "The bot owner restricted this comment to himself.\nType !owner to get information who the owner is.\nType !about to get a link to the bot creator.") 
          if (config.commentcooldown !== 0) { //is the cooldown enabled?
            if (usedcommentrecently.has(steamID.getSteam3RenderedID())) { //check if user has cooldown applied Credit: https://stackoverflow.com/questions/48432102/discord-js-cooldown-for-a-command-for-each-user-not-all-users
              bot.chatMessage(steamID, `You requested a comment in the last ${config.commentcooldown} minutes. Please wait a moment.`) //send error message
              return; }}
          if (config.globalcommentcooldown !== 0) { //is the cooldown enabled?
            if (commentedrecently === true) { 
              bot.chatMessage(steamID, `Someone else requested a comment in the last ${config.globalcommentcooldown}ms. Please wait a moment.`) //send error message
              return; }}

          if (args[0] !== undefined) {
            if (isNaN(args[0])) //isn't a number?
              return bot.chatMessage(steamID, "This is not a valid number!\nCommand usage: '!comment number_of_comments profileid'  (profileid only available for botowner)")
            if (args[0] > Object.keys(start.communityobject).length) { //number is too big?
              return bot.chatMessage(steamID, `You can request max. ${Object.keys(start.communityobject).length} comments.\nCommand usage: '!comment number_of_comments profileid'  (profileid only available for botowner)`)}
            var numberofcomments = args[0]

            if (args[1] !== undefined) {
              if (config.allowcommentcmdusage === false) {
                if (isNaN(args[1])) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749\nCommand usage: '!comment number_of_comments profileid'  (profileid only available for botowner)")
                if (new SteamID(args[1]).isValid() === false) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749\nCommand usage: '!comment number_of_comments profileid'  (profileid only available for botowner)")
                steamID.accountid = parseInt(new SteamID(args[1]).accountid) //edit accountid value of steamID parameter of friendMessage event and replace requester's accountid with the new one
              } else {
                bot.chatMessage(steamID, "Specifying a profileid is only allowed for the botowner when allowcommentcmdusage is set to false.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
                return; }}}

          if (config.mode === 2) {
            if (numberofcomments === undefined) { //no number given? ask again
              if (Object.keys(start.botobject).length === 1 && config.allowcommentcmdusage === true) { var numberofcomments = 1 } else { //if only one account is active, set 1 automatically
                bot.chatMessage(steamID, `Please specify how many comments out of ${Object.keys(start.communityobject).length} you want to get.\nCommand usage: '!comment number_of_comments'`)
                return;
              }}
          } else {
            var numberofcomments = 1 }

          //actual comment process:
          community.getSteamUser(bot.steamID, (err, user) => { //check if acc is limited and if yes if requester is on friendlist
            if (err) { return logger("comment check acc is limited and friend error: " + err) }
            if (user.isLimitedAccount && !Object.keys(bot.myFriends).includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return bot.chatMessage(steamID, "You have to send me a friend request before I can comment on your profile!")})
          community.getSteamUser(steamID, (err, user) => { //check if profile is private
            if (err) { return logger("comment check for private account error: " + err) }
            if (user.privacyState !== "public") return bot.chatMessage(steamID, "Your profile seems to be private. Please edit your privacy settings on your profile and try again!") });

          var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; 
          var comment = randomstring(start.quotes); //get random quote

          community.postUserComment(steamID, comment, (error) => { //post comment
            if(error) { bot.chatMessage(steamID, `Oops, an error occured! Details: \n[${thisbot}] postUserComment error: ${error}`); logger(`[${thisbot}] postUserComment error: ${error}`); return; }

            logger(`[${thisbot}] ${numberofcomments} Comment(s) on ${new SteamID(steamID.getSteam3RenderedID()).getSteamID64()}: ${comment}`)
            if (numberofcomments == 1) bot.chatMessage(steamID, 'Okay I commented on your profile! If you are a nice person then leave a +rep on my profile!')
              else {
                var waittime = (numberofcomments * config.commentdelay) / 1000 //calculate estimated wait time if mode is 2
                var waittimeunit = "seconds"
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }
                bot.chatMessage(steamID, `Estimated wait time for ${numberofcomments} comments: ${Number(Math.round(waittime+'e'+3)+'e-'+3)} ${waittimeunit}.`)

                start.commenteverywhere(steamID, numberofcomments) //Let all other accounts comment if mode 2 is activated
                bot.chatMessage(steamID, `The other ${numberofcomments} comments should follow with a delay of ${config.commentdelay}ms.`) }

            //Adds the user to the set so that they can't use the command for a minute
            if (config.commentcooldown !== 0) {
              usedcommentrecently.add(steamID.getSteam3RenderedID());
              setTimeout(() => { //user specific cooldown
                usedcommentrecently.delete(steamID.getSteam3RenderedID()) //Removes the user from the set after a minute
              }, config.commentcooldown * 60000) //minutes * 60000 = cooldown in ms 
            }
            //sets the global cooldown to true so the account doesn't get a cooldown
            if (config.globalcommentcooldown !== 0) {
              commentedrecently = true;
              setTimeout(() => { //global cooldown
                usedcommentrecently.delete(steamID.getSteam3RenderedID()) //Removes the user from the set after a minute
                commentedrecently = false;
              }, config.globalcommentcooldown)
            }

            if (config.unfriendtime > 0) { //add user to lastcomment list if the unfriendtime is > 0 days
              if (start.botobject[i].myFriends[new SteamID(steamID.getSteam3RenderedID()).getSteamID64()] === 3) {
                lastcomment[new SteamID(steamID.getSteam3RenderedID()).getSteamID64()] = {
                  time: Date.now(),
                  bot: loginindex }
                fs.writeFile("./lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                  if (err) logger("delete user from lastcomment.json error: " + err) }) }}
          })
          break;
        case '!ping':
          bot.chatMessage(steamID, 'Pong!')
          break;
        case '!owner':
          if (config.owner.length < 1) return bot.chatMessage(steamID, "I don't know that command. Type !help for more info.\n(Bot Owner didn't include link to him/herself.)")
          bot.chatMessage(steamID, "Check my owner's profile: '" + config.owner + "'")
          break;
        case '!group':
          if (config.yourgroup.length < 1 && config.yourgroup64id.length < 1) return bot.chatMessage(steamID, "I don't know that command. Type !help for more info.") //no group info at all? stop.
          if (config.yourgroup64id.length > 1 && Object.keys(bot.myGroups).includes(config.yourgroup64id)) { bot.inviteToGroup(steamID, config.yourgroup64id); bot.chatMessage(steamID, "I send you an invite! Thanks for joining!"); return; } //id? send invite and stop
          bot.chatMessage(steamID, "Join my group here: " + config.yourgroup) //seems like no id has been saved but an url. Send the user the url
          break;
        case '!resetcooldown':
          if (!config.ownerid.includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          if (config.commentcooldown === 0) { //is the cooldown enabled?
            return bot.chatMessage(steamID, "The cooldown is disabled in the config!") }
          if (usedcommentrecently.has(steamID.getSteam3RenderedID())) { //check if user has cooldown applied Credit: https://stackoverflow.com/questions/48432102/discord-js-cooldown-for-a-command-for-each-user-not-all-users
            usedcommentrecently.delete(steamID.getSteam3RenderedID()) //Removes the user from the set after a minute
            bot.chatMessage(steamID, "Your cooldown has been cleared.") } else {
              bot.chatMessage(steamID, "There is no cooldown for you applied.") }
          break;
        case '!about':
          if (config.owner.length > 1) var ownertext = config.owner; else var ownertext = "anonymous (no owner link provided)";
          bot.chatMessage(steamID, `This bot was created by 3urobeat.\nGitHub: https://github.com/HerrEurobeat/steam-comment-service-bot \nSteam: https://steamcommunity.com/id/3urobeat \nDisclaimer: I (the developer) am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.\n\nThis instance of the bot is used and operated by: ${ownertext}`)
          break;
        case '!unfriend':
          if (!config.ownerid.includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          if (isNaN(args[0])) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749")
            if (new SteamID(args[0]).isValid() === false) return bot.chatMessage(steamID, "This is not a valid profileid! A profile id must look like this: 76561198260031749")
          Object.keys(start.botobject).forEach((i) => {
            if (start.botobject[i].myFriends[new SteamID(args[0])] === 3) { //check if provided user is really a friend
              start.botobject[i].removeFriend(new SteamID(args[0])) }})
          bot.chatMessage(steamID, `Removed friend ${args[0]} from all bots.`)
          break;
        case '!eval':
          if (!config.ownerid.includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return bot.chatMessage(steamID, "This command is only available for the botowner.\nIf you are the botowner, make sure you added your ownerid to the config.json.")
          const clean = text => {
            if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
              else return text; }

            try {
              const code = args.join(" ");
              let evaled = eval(code);
              if (typeof evaled !== "string")
              evaled = require("util").inspect(evaled);
      
              bot.chatMessage(steamID, `Code executed. Result:\n\n${clean(evaled)}`)
            } catch (err) {
              bot.chatMessage(steamID, `Error:\n${clean(err)}`);
              return; }
          break;
        default: //cmd not recognized
          bot.chatMessage(steamID, "I don't know that command. Type !help for more info.") }
    } else {
      if (config.mode === 2) { //redirect the user to the main bot if mode 2 is running and this bot is not the main bot
        switch(message.toLowerCase()) {
          case '!about':
            if (config.owner.length > 1) var ownertext = config.owner; else var ownertext = "anonymous (no owner link provided)";
            bot.chatMessage(steamID, `This bot was created by 3urobeat.\nGitHub: https://github.com/HerrEurobeat/steam-comment-service-bot \nSteam: https://steamcommunity.com/id/3urobeat \nDisclaimer: I (the developer) am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.\n\nThis instance of the bot is used and operated by: ${ownertext}`)
            break;
          default:
            bot.chatMessage(steamID, `This is one account running in a bot cluster.\nPlease add the main bot (Profile ID: ${new SteamID(start.botobject[0].steamID.getSteam3RenderedID()).getSteamID64()}) and send him a !help message.\nIf you want to check out what this is about, type: !about`)
        }}  
      }
  });

  //Accept Friend & Group requests/invites
  bot.on('friendRelationship', (steamID, relationship) => {
    if (relationship === 2) {
      bot.addFriend(steamID);
      logger(`[${thisbot}] Added User: ` + new SteamID(steamID.getSteam3RenderedID()).getSteamID64())
      bot.chatMessage(steamID, 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more info!');
    }
  });

  bot.on('groupRelationship', (steamID, relationship) => {
    if (relationship === 2) {
      if (config.acceptgroupinvites !== true) { //check if group accept is false
        if (config.botsgroupid.length < 1) return; 
        if (new SteamID(steamID.getSteam3RenderedID()).getSteamID64() !== config.botsgroupid) { return; }} //check if group id is bot group  

      bot.respondToGroupInvite(steamID, true)
      logger(`[${thisbot}] Accepted group invite: ` + new SteamID(steamID.getSteam3RenderedID()).getSteamID64())
    }
  });

  module.exports={
    bot
  }
}