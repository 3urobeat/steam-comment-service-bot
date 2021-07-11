
/**
 * Returns steam guard input time from steamGuard.js back to login.js to subtract it from readyafter time
 * @param {Number} arg Adds this time in ms to the steamGuardInputTime
 */
module.exports.steamGuardInputTimeFunc = (arg) => { //small function to return new value from bot.js
    this.steamGuardInputTime += arg
}


/**
  * Prints an ASCII Art and starts to login all bot accounts
  */
module.exports.startlogin = () => {
    var SteamTotp  = require('steam-totp');

    var controller = require("./controller.js")
    var ascii      = require("../data/ascii.js")
    var round      = require("./helpers/round.js")
    var b          = require("../bot/bot.js")

    var logindelay = 2500 //time to wait between logins

    module.exports.steamGuardInputTime = 0
    module.exports.accisloggedin       = true //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account
    module.exports.skippednow          = []   //array to track which accounts have been skipped
    module.exports.proxyShift          = 0


    //Update global var
    botisloggedin = true
    

    //Print ASCII art
    logger("", "", true)
    if (Math.floor(Math.random() * 100) <= 2) logger("", ascii.hellothereascii + "\n", true)
        else if (Math.floor(Math.random() * 100) <= 10) logger("", ascii.binaryascii + "\n", true)
        else logger("", ascii.ascii[Math.floor(Math.random() * ascii.ascii.length)] + "\n", true)
        
    logger("", "", true) //put one line above everything that will come to make the output cleaner


    //Print whatsnew message if this is the first start with this version
    if (extdata.firststart) logger("", "\x1b[0mWhat's new: " + extdata.whatsnew + "\n")


    //Import logininfo data
    var logininfo = require("./helpers/dataimport.js").logininfo()


    //Evaluate estimated wait time for login:
    logger("info", "Evaluating estimated login time...", false, true)
    if (extdata.timesloggedin < 5) { //only use new evaluation method when the bot was started more than 5 times
        var estimatedlogintime = ((logindelay * (Object.keys(logininfo).length - 1 - controller.skippedaccounts.length)) / 1000) + 10 //10 seconds tolerance
    } else {
        var estimatedlogintime = (extdata.totallogintime / extdata.timesloggedin) * (Object.keys(logininfo).length - controller.skippedaccounts.length) 
    }
    

    var estimatedlogintimeunit = "seconds"
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "minutes" }
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "hours" }                                                                                                                                                                                                                                                                          //🥚!

    logger("info", `Logging in... Estimated wait time: ${round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`)


    //Start starting bot.js for each account
    logger("info", "Loading logininfo for each account...", false, true)

    Object.keys(logininfo).forEach((k, i) => { //log all accounts in with the logindelay             
        setTimeout(() => { //wait before interval to reduce ram usage on startup

            var startnextinterval = setInterval(() => { //run check every x ms

                //Check if previous account is logged in
                if (module.exports.accisloggedin == true && i == Object.keys(controller.botobject).length + this.skippednow.length || module.exports.accisloggedin == true && this.skippednow.includes(i - 1)) { //i is being counted from 0, length from 1 -> checks if last iteration is as long as botobject
                    clearInterval(startnextinterval) //stop checking

                    //if this iteration exists in the skippedaccounts array, automatically skip acc again
                    if (controller.skippedaccounts.includes(i)) {
                        logger("info", `[skippedaccounts] Automatically skipped ${k}!`, false, true);
                        this.skippednow.push(i);
                        return;
                    } 

                    if (i > 0) logger("info", `Waiting ${logindelay / 1000} seconds... (config logindelay)`, false, true) //first iteration doesn't need to wait duh


                    //Wait logindelay and then start bot.js with the account of this iteration
                    setTimeout(() => {
                        logger("info", `Starting bot.js for ${k}...`, false, true)

                        //Define steam-user logOnOptions
                        var logOnOptions = {
                            accountName: logininfo[k][0],
                            password: logininfo[k][1],
                            promptSteamGuardCode: false,
                            machineName: `${extdata.mestr}'s Comment Bot`
                        };

                        //If a shared secret was provided in the logininfo then add it to logOnOptions object
                        if (logininfo[k][2] && logininfo[k][2] != "" && logininfo[k][2] != "shared_secret") { 
                            logOnOptions["twoFactorCode"] = SteamTotp.generateAuthCode(logininfo[k][2])
                        }

                        b.run(logOnOptions, i); //run bot.js with this account
                    }, logindelay) 
                }

            }, 250);
        
        }, 1500 * (i - this.skippednow.length)); //1.5 seconds before checking if next account can be logged in should be ok
    }) 


    //Start ready check
    require("./ready.js").readyCheck(logininfo)
}