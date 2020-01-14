//Code by: https://github.com/HerrEurobeat/ 

module.exports.run = async (logOnOptions, IDpassthrough, botindex, loginindex) => {
    const SteamUser = require('steam-user');
    const SteamCommunity = require('steamcommunity');
    var logger = require('./start.js').logger
    const SteamID = require('steamid');
  
    const bot = new SteamUser();
    const community = new SteamCommunity();
  
    const config = require('./config.json');
    var randomstring = arr => arr[Math.floor(Math.random() * arr.length)];

    function comment() {
        var comment = randomstring(config.quotes);
        community.postUserComment(IDpassthrough, comment, (error) => {
            if(error !== null) {
              logger(`[${botindex}] postUserComment error: ${error}`);
              bot.logOff()
              return;
            }
            logger(`[${botindex}] Comment: ${comment}`)
            bot.logOff() })}
  
    //Log in:
    setTimeout(() => {
        bot.logOn(logOnOptions)
        console.log(botindex + " logged in")
    }, config.commentdelay * loginindex);
    
  
    bot.on('loggedOn', () => {
        bot.setPersona(config.status);
    })

    bot.on("webSession", (sessionID, cookies) => { //accept friend requests and comment 
        community.setCookies(cookies);
        for (let i = 0; i < Object.keys(bot.myFriends).length; i++) { //Credit: https://dev.doctormckay.com/topic/1694-accept-friend-request-sent-in-offline/  
            if (bot.myFriends[Object.keys(bot.myFriends)[i]] == 2) {
                bot.addFriend(Object.keys(bot.myFriends)[i]);
                logger(`[${botindex}] Added user while I was offline! User: ` + Object.keys(bot.myFriends)[i])
                bot.inviteToGroup(Object.keys(bot.myFriends)[i], new SteamID(config.yourgroup64id));
            }}
        for (let i = 0; i < Object.keys(bot.myGroups).length; i++) {
          if (bot.myGroups[Object.keys(bot.myGroups)[i]] == 2) {
              bot.respondToGroupInvite(Object.keys(bot.myGroups)[i], true)
              logger(`[${botindex}] Accepted group invite while I was offline: ` + Object.keys(bot.myGroups)[i])
          }}

        setTimeout(() => {
            comment()
        }, 5000);
    })

    //Friend requests
    bot.on('friendRelationship', (steamid, relationship) => {
        if (relationship === 2) {
        bot.addFriend(steamid);
        logger(`[${botindex}] Added User: ` + steamid)
        }
    });

    bot.on('groupRelationship', (steamid, relationship) => {
        if (relationship === 2) {
        bot.respondToGroupInvite(steamid, true)
        logger(`[${botindex}] Accepted group invite: ` + steamid)
        }
    });
}