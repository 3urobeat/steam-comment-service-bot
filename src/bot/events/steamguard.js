
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

        //Print message
        logger("info", `[${thisbot}] Steam Guard code requested...`, false, true)
        logger("", 'Code Input', true, true) //extra line with info for output.txt because otherwise the text from above get's halfway stuck in the steamGuard input field
    
        //Start timer to subtract it later from readyafter time
        var steamGuardInputStart = Date.now(); //measure time to subtract it later from readyafter time
    
        //Open input
        if (loginindex == 0) process.stdout.write(`[${logOnOptions.accountName}] Steam Guard Code: `)
            else process.stdout.write(`[${logOnOptions.accountName}] Steam Guard Code (leave empty and press ENTER to skip account): `)
    
        var stdin = process.openStdin(); //start reading input in terminal
    
        stdin.resume()
        stdin.addListener('data', text => { //fired when input was submitted
            var code = text.toString().trim()

            stdin.pause() //stop reading
            stdin.removeAllListeners('data')
    
            if (code == "") { //manual skip initated
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
    
            } else { //code provided
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