//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!


module.exports.run = async (logOnOptions, loginindex) => {
  const SteamUser = require('steam-user');
  const SteamCommunity = require('steamcommunity');
  const SteamID = require('steamid');
  var start = require("./start.js")
  const config = require('./config.json');
  const logininfo = require('./logininfo.json');
  var logger = start.logger

  const bot = new SteamUser();
  const community = new SteamCommunity();

  if (config.mode === 1) var thisbot = `Bot ${loginindex}`
    else var thisbot = "Main"

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
      bot.gamesPlayed([config.game,730]); //set game for all bots in mode 1
    } else if (config.mode === 2) { //connected mode
      if (loginindex === 0) bot.gamesPlayed([config.game,730]); //set game only for the "leader" bot in mode 2
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
          bot.respondToGroupInvite(Object.keys(bot.myGroups)[i], true)
          logger(`[${thisbot}] Accepted group invite while I was offline: ` + Object.keys(bot.myGroups)[i])
      }}
  });

  /* ------------ Message interactions: ------------ */
  bot.on('friendMessage', function(steamID, message) {
    if (loginindex === 0 || config.mode === 1) { //check if this is the main bot or if mode 1 is set
      switch(message.toLowerCase()) {
        case '!help':
          if (config.owner.length > 1) var ownertext = "\nType !owner to check out my owner's profile!"; else var ownertext = "";
          if (config.yourgroup.length > 1) var yourgrouptext = "\n\nJoin my !group"; else var yourgrouptext = "";
          bot.chatMessage(steamID, `Type !comment to get a free comment!\nType !ping for a pong!\nType !about for credit.${ownertext}${yourgrouptext}`)
          break;
        case '!comment':
          community.getSteamUser(bot.steamID, (err, user) => { //check if acc is limited and if yes if requester is on friendlist
            if(user.isLimitedAccount && !Object.keys(bot.myFriends).includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return bot.chatMessage(steamID, "You have to send me a friend request before I can comment on your profile!")})
          community.getSteamUser(steamID, (err, user) => { //check if profile is private
            if(user.privacyState !== "public") return bot.chatMessage(steamID, "Your profile seems to be private. Please edit your privacy settings on your profile and try again!") });

          var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; 
          var comment = randomstring(start.quotes); //get random quote
          community.postUserComment(steamID, comment, (error) => { //post comment
            if(error !== null) { logger(`[${thisbot}] postUserComment error: ${error}`); return; }
            logger(`[${thisbot}] Comment: ${comment}`)
            if (config.mode === 1) bot.chatMessage(steamID, 'Okay I commented on your profile! If you are a nice person then leave a +rep on my profile!')
              else {
                var waittime = (Object.keys(logininfo).length * config.commentdelay) / 1000
                var waittimeunit = "seconds"
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "minutes" }
                if (waittime > 120) { var waittime = waittime / 60; var waittimeunit = "hours" }
                bot.chatMessage(steamID, `Estimated wait time for ${Object.keys(logininfo).length} comments: ${Number(Math.round(waittime+'e'+3)+'e-'+3)} ${waittimeunit}.`) }
          })

          if (config.mode === 2) {
            start.commenteverywhere(steamID) //Let all other accounts comment if mode 2 is activated
            bot.chatMessage(steamID, `The other ${Object.keys(logininfo).length} comments should follow with a delay of ${config.commentdelay}ms.`)
          }
          break;
        case '!ping':
          bot.chatMessage(steamID, 'Pong!')
          break;
        case '!owner':
          if (config.owner.length < 1) return bot.chatMessage(steamID, "I don't know that command. Type !help for more info.")
          bot.chatMessage(steamID, "Check my owner's profile: '" + config.owner + "'")
          break;
        case '!group':
          if (config.yourgroup.length < 1 && config.yourgroup64id.length < 1) return bot.chatMessage(steamID, "I don't know that command. Type !help for more info.") //no group info at all? stop.
          if (config.yourgroup64id.length > 1) { bot.inviteToGroup(steamID, new SteamID(config.yourgroup64id)); bot.chatMessage(steamID, "I send you an invite! Thanks for joining!"); return; } //id? send invite and stop
          bot.chatMessage(steamID, "Join my group here: " + config.yourgroup) //seems like no id has been saved but an url. Send the user the url
          break;
        case '!about':
          if (config.owner.length > 1) var ownertext = config.owner; else var ownertext = "anonymous (no owner link provided)";
          bot.chatMessage(steamID, `This bot was created by 3urobeat.\nGitHub: https://github.com/HerrEurobeat/steam-comment-service-bot \nSteam: https://steamcommunity.com/id/3urobeat \nDisclaimer: I (the developer) am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.\n\nThis instance of the bot is used and operated by: ${ownertext}`)
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
            bot.chatMessage(steamID, "This is one account running in a bot cluster.\nPlease add the main bot and send him a !help message.\nIf you want to check out what this is about, type: !about")
        }}  
      }
    logger(`[${thisbot}] Friend message from ${steamID.getSteam3RenderedID()}: ${message}`); //log message
  });

  //Accept Friend & Group requests/invites
  bot.on('friendRelationship', (steamid, relationship) => {
    if (relationship === 2) {
      bot.addFriend(steamid);
      logger(`[${thisbot}] Added User: ` + steamid)
      bot.chatMessage(steamid, 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more info!');
    }
  });

  bot.on('groupRelationship', (steamid, relationship) => {
    if (relationship === 2) {
      bot.respondToGroupInvite(steamid, true)
      logger(`[${thisbot}] Accepted group invite: ` + steamid)
    }
  });

  module.exports={
    bot
  }
}