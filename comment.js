//Code by: https://github.com/HerrEurobeat/ 

module.exports.run = async (logOnOptions, IDpassthrough, botindex) => {
    const SteamUser = require('steam-user');
    const SteamCommunity = require('steamcommunity');
    var logger = require('./start.js').logger
  
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
    bot.logOn(logOnOptions)
  
    bot.on('loggedOn', () => {
        bot.setPersona(config.status);
    })

    bot.on("webSession", (sessionID, cookies) => { 
        community.setCookies(cookies);
        setTimeout(() => {
            comment()
        }, 5000);
    })
}