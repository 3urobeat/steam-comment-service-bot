/*
 * File: loggedOn.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 05.03.2022 17:52:42
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamUser = require("steam-user"); //eslint-disable-line


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

    logger("debug", `[${thisbot}] Public IP of this account: ${bot.publicIP}`)
    
    
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
