
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
            if (stoponerr) process.exit(0)
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
        if (stoponerr) process.exit(0)
            else callback(false)
    }) 
}