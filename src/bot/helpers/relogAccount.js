
/**
 * Function to regulate automatic relogging and delay it to avoid issues
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Object} logOnOptions The steam-user logOnOptions object
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {String} thisproxy The proxy of the calling account
 */
module.exports.run = (loginindex, thisbot, logOnOptions, bot, thisproxy) => {
    var controller = require("../../controller/controller.js")
    var login      = require("../../controller/login.js")

    var relogdelay = 5000 //time to wait between relog attempts (for example after loosing connection to Steam)


    if (!controller.relogQueue.includes(loginindex)) {
        controller.relogQueue.push(loginindex)

        login.logOnTries[loginindex] = 0; //reset logOnTries

        logger("info", `[${thisbot}] Queueing for a relog. ${controller.relogQueue.length - 1} other accounts are waiting...`, false, true)
    }

    var relogInterval = setInterval(() => {
        if (controller.relogQueue.indexOf(loginindex) != 0) return; //not our turn? stop and retry in the next iteration

        clearInterval(relogInterval) //prevent any retries
        bot.logOff()

        logger("info", `[${thisbot}] It is now my turn. Waiting ${relogdelay / 1000} seconds before attempting to relog...`, false, true, logger.animation("waiting"))

        setTimeout(() => {
            if (thisproxy == null) logger("info", `[${thisbot}] Trying to relog without proxy...`, false, true, logger.animation("loading"))
                else logger("info", `[${thisbot}] Trying to relog with proxy ${login.proxyShift - 1}...`, false, true, logger.animation("loading"))
            
            bot.logOn(logOnOptions)
        }, relogdelay);
    }, 1000);
}