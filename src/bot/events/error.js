/*
 * File: error.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 11.10.2022 12:40:59
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const { EResult } = require("steam-user"); //Enums: https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EResult.js

const controller = require("../../controller/controller.js");
const login      = require("../../controller/login.js");
const botfile    = require("../bot.js");


/**
 * Handles the error event
 * @param err The error provided by steam-user
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {String} thisproxy The proxy of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {SteamUser} bot The bot instance of the calling account
 */
module.exports.run = (err, loginindex, thisbot, thisproxy, logOnOptions, bot) => {    
    

    
    //Custom behaviour for LogonSessionReplaced error:
    if (err.eresult == EResult.LogonSessionReplaced) {
        logger("info", `${logger.colors.fgred}[${thisbot}] Lost connection to Steam. Reason: LogonSessionReplaced. I won't try to relog this account.`)

        if (loginindex == 0) {
            logger("error", `${logger.colors.fgred}Account is bot0. Aborting...`, true); 
            return process.send("stop()");
        }
        return; 
    }


    //Check if this is a connection loss and not a login error (because disconnects will be thrown here when autoRelogin is false)
    if (Object.keys(controller.botobject).includes(String(loginindex)) && !controller.relogQueue.includes(loginindex)) { //it must be a disconnect when the bot was once logged in and is not yet in the queue
        logger("info", `${logger.colors.fgred}[${thisbot}] Lost connection to Steam. Reason: ${err}`)

        //Check if this is an intended logoff
        if (controller.relogAfterDisconnect && !login.skippednow.includes(loginindex)) { 
            logger("info", `${logger.colors.fggreen}[${thisbot}] Initiating a relog in 30 seconds.`) //Announce relog

            //Relog after waiting 30 sec
            setTimeout(() => {
                require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy);
            }, 30000);

        } else {

            logger("info", `[${thisbot}] I won't queue myself for a relog because this account was skipped or this is an intended logOff.`)
        }

    } else { //Actual error durin login or relog
        
        let blockedEnumsForRetries = [EResult.InvalidPassword, EResult.InvalidName, EResult.InvalidEmail, EResult.Banned, EResult.AccountNotFound];

        //check if this is an initial login error and it is either a fatal error or all retries are used
        if ((login.additionalaccinfo[loginindex].logOnTries > advancedconfig.maxLogOnRetries && !controller.relogQueue.includes(loginindex)) || blockedEnumsForRetries.includes(err.eresult)) { 
            logger("", "", true)
            logger("error", `Couldn't log in bot${loginindex} after ${login.additionalaccinfo[loginindex].logOnTries} attempt(s). ${err} (${err.eresult})`, true)


            //Add additional messages for specific errors to hopefully help the user diagnose the cause
            if (thisproxy != null) logger("", `      Is your proxy ${login.proxyShift - 1} offline or maybe blocked by Steam?\n`, true)


            //Abort execution if account is bot0
            if (loginindex == 0) {
                logger("", "", true)
                logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true)
                return process.send("stop()")

            } else { //Skip account if not bot0

                logger("info", `Failed account is not bot0. Skipping account...`, true)
                login.accisloggedin = true; //set to true to log next account in

                controller.skippedaccounts.push(loginindex)
                login.skippednow.push(loginindex)
            }

        } else { //Got retries left or it is a relog...

            logger("warn", `${err} while trying to log in bot${loginindex}. Retrying in 5 seconds...`) //log error as warning

            //Call either relogAccount or logOnAccount function to continue where we started at after 5 sec
            setTimeout(() => {
                if (controller.relogQueue.includes(loginindex)) require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy);
                    else botfile.logOnAccount();
            }, 5000)
        }
    }
}