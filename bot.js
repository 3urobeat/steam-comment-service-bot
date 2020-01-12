//Code by: https://github.com/HerrEurobeat/ 

module.exports.run = async (logOnOptions) => {
  const SteamUser = require('steam-user');
  const SteamCommunity = require('steamcommunity');
  var start = require("./start.js")
  const SteamID = require('steamid');
  const logininfo = require('./logininfo.json');
  var logger = start.logger

  const bot = new SteamUser();
  const community = new SteamCommunity();

  const config = require('./config.json');
  var randomstring = arr => arr[Math.floor(Math.random() * arr.length)];

  bot.logOn(logOnOptions)

  //Log in:
  bot.on('loggedOn', () => {
    bot.setPersona(config.status);
    bot.gamesPlayed([config.game,730]);

    module.exports.bootend = start.readyarray.push("ready")
  });

  bot.on("webSession", (sessionID, cookies) => { 
    community.setCookies(cookies);
    //Accept offline group & friend invites
    for (let i = 0; i < Object.keys(bot.myFriends).length; i++) { //Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/  
        if (bot.myFriends[Object.keys(bot.myFriends)[i]] == 2) {
            bot.addFriend(Object.keys(bot.myFriends)[i]);
            logger('Added user while I was offline! User: ' + Object.keys(bot.myFriends)[i])
            bot.chatMessage(Object.keys(bot.myFriends)[i], 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more info!')
            bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID(config.yourgroup64id));
        }}
    for (let i = 0; i < Object.keys(bot.myGroups).length; i++) {
      if (bot.myGroups[Object.keys(bot.myGroups)[i]] == 2) {
          bot.respondToGroupInvite(Object.keys(bot.myGroups)[i], true)
          logger('Joined offline invited group: ' + Object.keys(bot.myGroups)[i])
      }}
  });

  //Message interactions
  bot.on('friendMessage', function(steamID, message) {
    switch(message.toLowerCase()) {
      case '!help':
        if (config.owner.length > 1) var ownertext = "\nType !owner to check out my owner's profile!"; else var ownertext = "";
        if (config.yourgroup.length > 1) var yourgrouptext = "\n\nJoin my !group"; else var yourgrouptext = "";
        bot.chatMessage(steamID, `Type !comment to get a free comment!\nType !ping for a pong!\nType !about for credit.${ownertext}${yourgrouptext}`)
        break;
      case '!comment':
        var comment = randomstring(config.quotes);
        community.postUserComment(steamID, comment, (error) => { //Comment
          if(error !== null) {
            logger("postUserComment error: " + error);
            return }
          bot.chatMessage(steamID, 'Okay I commented on your profile! If you are a nice person then leave a +rep on my profile!')
          logger("Comment: " + comment)})

        if (config.mode === 2) {
          start.commenteverywhere(steamID) //Let all other accounts comment if the mode is activated
          bot.chatMessage(steamID, `The other ${Object.keys(logininfo).length} comments will follow.`)
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
        bot.chatMessage(steamID, `This bot was created by 3urobeat.\nGitHub: https://github.com/HerrEurobeat/ \nSteam: https://steamcommunity.com/id/3urobeat \nDisclaimer: I (the developer) am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.\n\nThis instance of the bot is used and operated by: ${ownertext}`)
        break;
      default:
        bot.chatMessage(steamID, "I don't know that command. Type !help for more info.")        
    }
    logger("Friend message from " + steamID.getSteam3RenderedID() + ": " + message);
  });

  //Friend requests
  bot.on('friendRelationship', (steamid, relationship) => {
    if (relationship === 2) {
      bot.addFriend(steamid);
      logger('Added user: ' + steamid)
      bot.chatMessage(steamid, 'Hello there! Thanks for adding me!\nRequest a free comment with !comment\nType !help for more info!');
    }
  });

  bot.on('groupRelationship', (steamid, relationship) => {
    if (relationship === 2) {
      bot.respondToGroupInvite(steamid, true)
      logger('Got added to group: ' + steamid)
    }
  });

  module.exports={
    bot
  }
}