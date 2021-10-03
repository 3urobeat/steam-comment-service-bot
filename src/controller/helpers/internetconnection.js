/*
 * File: internetconnection.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 03.10.2021 19:40:22
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
  * Checks if Steam is online and proceeds with the startup.
  * @param {Boolean} continuewithlogin If true, the function will call startlogin() if Steam is online
  * @param {Boolean} stoponerr If true, the function will stop the bot if Steam seems to be offline
  * @param {Boolean} throwtimeout If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
  * @param {function} [callback] Called with `isOnline` (Boolean) parameter on completion
  */
module.exports.run = (continuewithlogin, stoponerr, throwtimeout, callback) => {
    var https = require("https")

    logger("info", "Checking if Steam is reachable...", false, true, logger.animation("loading"))
    
    //Start a 20 sec timeout to display an error when Steam can't be reached but also doesn't throw an error
    if (throwtimeout) {
        var timeoutTimeout = setTimeout(() => { //phenomenal name I know
            logger("warn", `I can't reach SteamCommunity! Is your internet source maybe blocking it?\n       Error: Timeout after 20 seconds`, true)
            if (stoponerr) return process.send("stop()")
                else callback(false)
        }, 20000)
    }

    https.get('https://steamcommunity.com', function (res) {
        logger("info", `SteamCommunity is up! Status code: ${res.statusCode}`, false, true, logger.animation("loading"))

        if (continuewithlogin) {
            if (throwtimeout) clearTimeout(timeoutTimeout)

            callback(true)
        }
    }).on('error', function(err) {
        logger("error", `SteamCommunity seems to be down or your internet isn't working! Check: https://steamstat.us \n        ${err}\n\n        Aborting...\n`, true)
        if (throwtimeout) clearTimeout(throwtimeout)
        if (stoponerr) return process.send("stop()")
            else callback(false)
    }) 
}