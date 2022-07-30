/*
 * File: login.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 05.06.2022 16:25:38
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Returns steam guard input time from steamGuard.js back to login.js to subtract it from readyafter time
 * @param {Number} arg Adds this time in ms to the steamGuardInputTime
 */
module.exports.steamGuardInputTimeFunc = (arg) => { //small function to return new value from bot.js
    this.steamGuardInputTime += arg
}


/**
  * Prints an ASCII Art and starts to login all bot accounts
  * @param {Object} logininfo The logininfo object
  */
module.exports.startlogin = (logininfo) => {
    var SteamTotp  = require('steam-totp');

    var controller = require("./controller.js")
    var ascii      = require("../data/ascii.js")
    var round      = require("./helpers/round.js")
    var b          = require("../bot/bot.js")

    module.exports.proxies = require("./helpers/dataimport.js").proxies();
    if (!this.proxies) return; //make sure ascii art isn't getting printed below error message

    module.exports.steamGuardInputTime = 0
    module.exports.accisloggedin       = true //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account
    module.exports.skippednow          = []   //array to track which accounts have been skipped
    module.exports.additionalaccinfo   = {}   //tracks additional account information that are bound to their loginindex
    module.exports.proxyShift          = 0


    //Update global var
    botisloggedin = true
    

    //Print ASCII art
    logger("", "", true)
    if (Math.floor(Math.random() * 100) <= 2) logger("", ascii.hellothereascii + "\n", true) //2% chance
        else if (Math.floor(Math.random() * 100) <= 5) logger("", ascii.binaryascii + "\n", true) //5% chance
        else logger("", ascii.ascii[Math.floor(Math.random() * ascii.ascii.length)] + "\n", true)
        
    logger("", "", true) //put one line above everything that will come to make the output cleaner


    //Print whatsnew message if this is the first start with this version
    if (extdata.firststart) logger("", `${logger.colors.reset}What's new: ${extdata.whatsnew}\n`)


    //Evaluate estimated wait time for login:
    logger("info", "Evaluating estimated login time...", false, true, logger.animation("loading"))
    
    if (extdata.timesloggedin < 5) { //only use "intelligent" evaluation method when the bot was started more than 5 times
        var estimatedlogintime = ((advancedconfig.loginDelay * (Object.keys(logininfo).length - 1 - controller.skippedaccounts.length)) / 1000) + 5 //5 seconds tolerance
    } else {
        var estimatedlogintime = ((extdata.totallogintime / extdata.timesloggedin) + (advancedconfig.loginDelay / 1000)) * (Object.keys(logininfo).length - controller.skippedaccounts.length)
    }

    var estimatedlogintimeunit = "seconds"
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "minutes" }
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "hours" }                                                                                                                                                                                                                                                                          //🥚!

    logger("info", `Logging in... Estimated wait time: ${round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`, false, false, logger.animation("loading"))
    if(global.checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<")process.send("stop()");


    //Start starting bot.js for each account
    logger("info", "Loading logininfo for each account...", false, true, logger.animation("loading"))

    Object.keys(logininfo).forEach((k, i) => { //log all accounts in with the logindelay             
        setTimeout(() => {
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

                    if (i > 0) logger("info", `Waiting ${advancedconfig.loginDelay / 1000} seconds... (advancedconfig loginDelay)`, false, true, logger.animation("waiting")) //first iteration doesn't need to wait duh


                    //Wait logindelay and then start bot.js with the account of this iteration
                    setTimeout(() => {
                        logger("info", `Starting bot.js for ${k}...`, false, true, logger.animation("loading"))

                        //Define steam-user logOnOptions
                        var logOnOptions = {
                            accountName: logininfo[k][0],
                            password: logininfo[k][1],
                            promptSteamGuardCode: false,
                            machineName: `${extdata.mestr}'s Comment Bot`
                        };

                        //If a shared secret was provided in the logininfo then add it to logOnOptions object
                        if (logininfo[k][2] && logininfo[k][2] != "" && logininfo[k][2] != "shared_secret") { 
                            logger("debug", `Found shared_secret for ${k}! Generating AuthCode and adding it to logOnOptions...`)
                            
                            logOnOptions["twoFactorCode"] = SteamTotp.generateAuthCode(logininfo[k][2])
                            logOnOptions["sharedSecretForRelog"] = logininfo[k][2]; //add raw shared_secret to obj aswell to be able to access it more easily from relogAccount.js
                        }

                        b.run(logOnOptions, i); //run bot.js with this account
                    }, advancedconfig.loginDelay * Number(i > 0)) //ignore delay for first account
                }
            }, 250);
        
        }, (advancedconfig.loginDelay * (i - this.skippednow.length)) * Number(i > 0)); //wait loginDelay ms before checking if the next account is ready to be logged in if not first iteration. This should reduce load and ram usage as less intervals run at the same time (this gets more interesting when lots of accs are used)
    }) 


    //Start ready check
    require("./ready.js").readyCheck(logininfo)
}