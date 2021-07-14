
/**
 * Do some stuff when account is logged in
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {SteamCommunity} community The bot instance of the calling account
 */
module.exports.run = (loginindex, thisbot, bot, community) => {
    var controller = require("../../controller/controller.js")
    

    //Print message and set status to online
    logger("info", `[${thisbot}] Account logged in! Waiting for websession...`, false, true, logger.animation("loading"))
    bot.setPersona(1); //set online status
    
    
    //Set playinggames for main account and child account
    if (loginindex == 0) bot.gamesPlayed(config.playinggames);
    if (loginindex != 0) bot.gamesPlayed(config.childaccplayinggames)
    

    //Run check if all friends are in lastcomment.db database
    if (loginindex == 0) {
        require("../../controller/helpers/friendlist.js").checklastcommentdb(bot)
    }
    
    
    //Export this community and bot instance to the communityobject & botobject to access it from anywhere
    controller.communityobject[loginindex] = community
    controller.botobject[loginindex] = bot
}
