/*
 * File: steamguard.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 04.03.2022 17:42:36
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Handles the Steam Guard code request
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {Boolean} lastCodeWrong If the last code was wrong, provided by steam-user steamGuard event
 * @param {function} [callback] Called with `code` (String) on completion
 */
module.exports.run = (loginindex, thisbot, bot, logOnOptions, lastCodeWrong, callback) => {
    var controller = require("../../controller/controller.js")
    var login      = require("../../controller/login.js")

    
    /**
     * Get code from the user and give it back to steam-user
     */
    function askforcode() { //function to handle code input, manual skipping with empty input and automatic skipping with skipSteamGuard
    
        //Start timer to subtract it later from readyafter time
        var steamGuardInputStart = Date.now(); //measure time to subtract it later from readyafter time
    
        //Read guard code from terminal input
        logger("info", "Steam Guard Code requested. The account will be skipped automatically in 1.5 minutes if you don't respond...", true)
        if (loginindex == 0) var question = `[${logOnOptions.accountName}] Steam Guard Code: `
            else var question = `[${logOnOptions.accountName}] Steam Guard Code (leave empty and press ENTER to skip account): `

        logger.readInput(question, 90000, (text) => {
            if (!text || text == "") { //no response or manual skip
                if (!text) logger("info", "Skipping account because you didn't respond in 1.5 minutes...", true)

                if (loginindex == 0) { //first account can't be skipped
                    logger("warn", "The first account always has to be logged in!", true)
    
                    setTimeout(() => {
                        askforcode(); //run function again
                    }, 500);

                } else { //skip account if not bot0
                    logger("info", `[${thisbot}] steamGuard input empty, skipping account...`, false, true, logger.animation("loading"))
                    
                    login.accisloggedin = true; //set to true to log next account in
                    controller.skippedaccounts.push(loginindex)
                    login.skippednow.push(loginindex) 
    
                    bot.logOff() //Seems to prevent the steamGuard lastCodeWrong check from requesting again every few seconds
                    
                    callback(null)
                    return;
                }

            } else { //code
                let code = text.toString().trim()
                
                logger("info", `[${thisbot}] Accepting steamGuard code...`, false, true, logger.animation("loading"))

                callback(code) //give code back to node-steam-user
            }

            login.steamGuardInputTimeFunc(Date.now() - steamGuardInputStart) //measure time and subtract it from readyafter time
        })
    }
    

    //check if skipSteamGuard is on so we don't need to prompt the user for a code
    if (config.skipSteamGuard) {
        if (loginindex > 0) {
            logger("info", `[${thisbot}] Skipping account because skipSteamGuard is enabled...`, false, true, logger.animation("loading"))

            login.accisloggedin = true; //set to true to log next account in
            controller.skippedaccounts.push(loginindex)
            login.skippednow.push(loginindex)
    
            bot.logOff() //Seems to prevent the steamGuard lastCodeWrong check from requesting again every few seconds

            callback(null)
            return;
        } else {
            logger("warn", "Even with skipSteamGuard enabled, the first account always has to be logged in.", true)
        } 
    }
    

    //calling the function:
    if (lastCodeWrong && !login.skippednow.includes(loginindex)) { //last submitted code seems to be wrong and the loginindex wasn't already skipped (just to make sure)
        logger("", "", true, true)
        logger("warn", 'Your code seems to be wrong, please try again!', true)
    
        setTimeout(() => {
            askforcode(); //code seems to be wrong! ask again...
        }, 500);
    } else {
        askforcode(); //ask first time
    }
}