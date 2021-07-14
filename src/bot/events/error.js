
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
    var controller = require("../../controller/controller.js")
    var login      = require("../../controller/login.js")
    var botfile    = require("../bot.js")

    
    //Custom behaviour for LogonSessionReplaced error:
    if (err.eresult == 34) {
        logger("info", `\x1b[31m[${thisbot}] Lost connection to Steam. Reason: LogonSessionReplaced\x1b[0m`)
        if (loginindex == 0) { logger("error", `\x1b[31mAccount is bot0. Aborting...\x1b[0m`, true); process.exit(0) }
        return; 
    }


    //Check if this is a connection loss and not a login error (because disconnects will be thrown here when autoRelogin is false)
    if (Object.keys(controller.botobject).includes(String(loginindex)) && !controller.relogQueue.includes(loginindex)) { //it must be a disconnect when the bot was once logged in and is not yet in the queue
        logger("info", `\x1b[31m[${thisbot}] Lost connection to Steam. Reason: ${err}\x1b[0m`)

        //Check if this is an intended logoff
        if (controller.relogAfterDisconnect && !login.skippednow.includes(loginindex)) { 
            logger("info", `\x1b[32m[${thisbot}] Initiating a relog in 30 seconds.\x1b[0m`) //Announce relog

            //Relog after waiting 30 sec
            setTimeout(() => {
                require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy);
            }, 30000);

        } else {

            logger("info", `[${thisbot}] I won't queue myself for a relog because this account was skipped or this is an intended logOff.`)
        }

    } else {
        
        //Actual error durin login or relog:
        let blockedEnumsForRetries = [5, 12, 13, 17, 18] //Enums: https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EResult.js

        //check if this is an initial login error and it is either a fatal error or all retries are used
        if ((login.additionalaccinfo[loginindex].logOnTries > botfile.maxLogOnRetries && !controller.relogQueue.includes(loginindex)) || blockedEnumsForRetries.includes(err.eresult)) { 
            logger("", "", true)
            logger("error", `Couldn't log in bot${loginindex} after ${login.additionalaccinfo[loginindex].logOnTries} attempt(s). ${err} (${err.eresult})`, true)


            //Add additional messages for specific errors to hopefully help the user diagnose the cause
            if (err.eresult == 5) logger("", `Note: The error "InvalidPassword" (${err.eresult}) can also be caused by a wrong Username or shared_secret!\n      Try leaving the shared_secret field empty and check the username & password of bot${loginindex}.`, true)
            if (thisproxy != null) logger("", `Is your proxy ${controller.proxyShift} offline or maybe blocked by Steam?`, true)


            //Abort execution if account is bot0
            if (loginindex == 0) {
                logger("", "", true)
                logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true)
                process.exit(0)

            } else { //Skip account if not bot0

                logger("info", `Failed account is not bot0. Skipping account...`, true)
                controller.accisloggedin = true; //set to true to log next account in

                controller.skippedaccounts.push(loginindex)
                login.skippednow.push(loginindex)
            }

        } else { //Got retries left or it is a relog...

            logger("warn", `${err} (${err.eresult}) while trying to log in bot${loginindex}. Retrying in 5 seconds...`) //log error as warning

            //Call either relogAccount or logOnAccount function to continue where we started at after 5 sec
            setTimeout(() => {
                if (controller.relogQueue.includes(loginindex)) require("../helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, bot, thisproxy);
                    else botfile.logOnAccount();
            }, 5000)
        }
    }
}