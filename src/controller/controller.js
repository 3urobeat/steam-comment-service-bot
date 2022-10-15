/*
 * File: controller.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 15.10.2022 12:06:14
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Runs the controller which runs & controls the bot.
 */
async function run() {
    var starter = require("../starter.js")

    /* ------------ Handle restart (if this is one): ------------ */
    module.exports.botobject            = {}         //tracks the bot instances of all accounts to be able to access them from anywhere
    module.exports.communityobject      = {}         //tracks the community instances of all accounts to be able to access them from anywhere

    module.exports.bootstart            = Date.now()
    module.exports.relogQueue           = []
    module.exports.readyafterlogs       = []         //array to save suppressed logs during startup that get logged by ready.js
    module.exports.relogAfterDisconnect = true       //allows to prevent accounts from relogging when calling bot.logOff()
    module.exports.activeRelog          = false      //allows to block new comment requests when waiting for the last request to finish
    

    /* ------------ Add unhandled rejection catches: ------------ */
    var logger = (type, str) => { //make a "fake" logger function in order to be able to log the error message when the user forgot to run 'npm install'
        logafterrestart.push(`${type} | ${str}`) //push message to array that will be carried through restart
        console.log(`${type} | ${str}`)
    }

    logger.animation = () => {} //just to be sure that no error occurs when trying to call this function without the real logger being present

    process.on('unhandledRejection', (reason) => { //Should keep the bot at least from crashing
        logger("error", `Unhandled Rejection Error! Reason: ${reason.stack}`, true) 
    });

    process.on('uncaughtException', (reason) => { //Known issue: This event listener doesn't seem to capture uncaught exceptions in the checkAndGetFile callback function below. However if it is inside for example a setTimeout it suddently works.
        //Try to fix error automatically by reinstalling all modules
        if (String(reason).includes("Error: Cannot find module")) {
            logger("", "", true)
            logger("info", "Cannot find module error detected. Trying to fix error by reinstalling modules...\n")

            require("./helpers/npminteraction.js").reinstallAll(logger, (err, stdout) => { //eslint-disable-line
                if (err) {
                    logger("error", "I was unable to reinstall all modules. Please try running 'npm install' manually. Error: " + err)
                    return process.send("stop()")
                } else {
                    //logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)
                    logger("info", "Successfully reinstalled all modules. Restarting...")
                    process.send(`restart(${JSON.stringify({ skippedaccounts: this.skippedaccounts, logafterrestart: logafterrestart })})`) //send request to parent process
                }
            })
        } else { //logging this message but still trying to fix it would probably confuse the user
            logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true) 
            logger("", "", true)
            logger("warn", "If the bot doesn't work correctly anymore after this error then please restart it!")
            
            //always restarting causes unnecessary restarts so I need to investigate this further
            
            /* logger("warn", "Restarting bot in 5 seconds since the application can be in an unrecoverable state...") //https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_warning_using_uncaughtexception_correctly
            logger("", "", true)

            setTimeout(() => {
                process.send(`restart(${JSON.stringify({ skippedaccounts: this.skippedaccounts, logafterrestart: logafterrestart })})`) //send request to parent process
            }, 5000); */
        }
    });

    /* ------------ Introduce logger function: ------------ */
    var loggerfile = await starter.checkAndGetFile("./src/controller/helpers/logger.js", logger, false, false)

    logger = loggerfile.logger
    global.logger = logger

    //Log held back messages from before this start
    if (logafterrestart.length > 0) {
        logger("", "\n\n", true)

        logafterrestart.forEach((e) => { //log messages to output.txt carried through restart
            e.split("\n").forEach((f) => { //split string on line breaks to make output cleaner when using remove
                logger("", "[logafterrestart] " + f, true, true)
            })
        })
    }
    
    logafterrestart = [] //clear array


    /* ------------ Mark new execution in output: ------------ */
    logger("", "\n\nBootup sequence started...", true, true)
    logger("", "---------------------------------------------------------", true, true)


    /* ------------ Import data: ------------ */
    var dataimportfile = await starter.checkAndGetFile("./src/controller/helpers/dataimport.js", logger, false, false)
    if (!dataimportfile) return;

    logger("info", "Importing data files and settings...", false, true, logger.animation("loading"));

    var cache   = await dataimportfile.cache()
    var extdata = await dataimportfile.extdata(cache)
    var config  = await dataimportfile.config(cache)
    var advancedconfig = await dataimportfile.advancedconfig(cache)

    var logininfo = dataimportfile.logininfo();

    global.config         = config
    global.advancedconfig = advancedconfig;
    global.extdata        = extdata
    global.cachefile      = cache;

    //Call optionsUpdateAfterConfigLoad() to set previously inaccessible options
    loggerfile.optionsUpdateAfterConfigLoad();

    module.exports.lastcomment = dataimportfile.lastcomment()


    /* ------------ Change terminal title: ------------ */
    if (process.platform == "win32") { //set node process name to find it in task manager etc.
        process.title = `${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}` //Windows allows long terminal/process names
    } else {
        process.stdout.write(`${String.fromCharCode(27)}]0;${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}${String.fromCharCode(7)}`) //sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)
        process.title = `CommentBot` //sets process title in task manager etc.
    }


    /* ------------ Print some diagnostic messages to log: ------------ */
    logger("info", `steam-comment-service-bot made by ${extdata.mestr} version ${extdata.versionstr} (${extdata.branch})`, false, true, logger.animation("loading"))
    logger("info", `This is start number ${extdata.timesloggedin + 1} (firststart ${extdata.firststart}) on ${process.platform} with node.js ${process.version}...`, false, true, logger.animation("loading"))


    //Check for unsupported node.js version (<14.15.0)
    let versionarr = process.version.replace("v", "").split(".")
    
    versionarr.forEach((e, i) => { if (e.length == 1 && parseInt(e) < 10) versionarr[i] = `0${e}` }) //put 0 infront of single digits
    
    let parsednodeversion = parseInt(versionarr.join(""))

    if (parsednodeversion < 141500) {
        logger("", "\n************************************************************************************\n", true)
        logger("error", `This applicaion requires at least node.js ${logger.colors.reset}v14.15.0${logger.colors.fgred} but you have ${logger.colors.reset}${process.version}${logger.colors.fgred} installed!\n        Please update your node.js installation: ${logger.colors.reset} https://nodejs.org/`, true)
        logger("", "\n************************************************************************************\n", true)
        return process.send("stop()")
    }


    //Display warning/notice if user is running in beta mode
    if (extdata.branch == "beta-testing") {
        logger("", "", true, true) //add one empty line that only appears in output.txt
        logger("", `${logger.colors.reset}[${logger.colors.fgred}Notice${logger.colors.reset}] Your updater and bot is running in beta mode. These versions are often unfinished and can be unstable.\n         If you would like to switch, open data.json and change 'beta-testing' to 'master'.\n         If you find an error or bug please report it: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose\n`, true)
    }


    /* ------------ Run datacheck and updater: ------------ */
    var maxCommentsOverall = config.maxOwnerComments //define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
    if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments
    logger("info", `Comment settings: commentdelay: ${config.commentdelay} | botaccountcooldown: ${config.botaccountcooldown} | maxCommentsOverall: ${maxCommentsOverall} | randomizeAcc: ${config.randomizeAccounts}`, false, true, logger.animation("loading"))


    /* ------------ Run updater or start logging in when steam is online: ------------ */
    let updater = await starter.checkAndGetFile("./src/updater/updater.js", logger, false, false)
    if (!updater) return;

    updater.compatibility(() => { //continue startup on any callback
        require("./helpers/internetconnection.js").run(true, true, true, async () => { //we can ignore callback because stoponerr is true

            let datacheck = await starter.checkAndGetFile("./src/controller/helpers/datacheck.js", logger, false, false)
            if (!datacheck) return;

            datacheck.run(logininfo, async () => {
            
                if (updateFailed) { //skip checking for update if last update failed
                    logger("info", `It looks like the last update failed so let's skip the updater for now and hope ${extdata.mestr} fixes the issue.\n       If you haven't reported the error yet please do so as I'm only then able to fix it!`, true)
                    require("./login.js").startlogin(logininfo) //start logging in
                    
                } else {
                    
                    require("../updater/updater.js").run(false, null, false, (foundanddone2, updateFailed) => {
                        if (!foundanddone2) {
                            require("./login.js").startlogin(logininfo) //start logging in
                        } else {
                            process.send(`restart(${JSON.stringify({ skippedaccounts: this.skippedaccounts, updatefailed: updateFailed == true })})`) //send request to parent process (checking updateFailed == true so that undefined will result in false instead of undefined)
                        }
                    })
                }
            })
        })
    })
}


/* ------------ Handle restart data: ------------ */

/**
 * Process data that should be kept over restarts
 */
function restartdata(data) {
    data = JSON.parse(data); //convert the stringified object back to an object

    if (data.oldconfig) oldconfig = data.oldconfig //eslint-disable-line
    if (data.logafterrestart) logafterrestart = data.logafterrestart //we can't print now since the logger function isn't imported yet. 
    if (data.skippedaccounts) module.exports.skippedaccounts = data.skippedaccounts
    if (data.updatefailed) updateFailed = data.updatefailed;

    run(); //start the bot
}


/* ------------ Start the bot: ------------ */

if (parseInt(process.argv[3]) + 2500 > Date.now()) { //check if this process just got started in the last 2.5 seconds or just required by itself by checking the timestamp attached by starter.js

    //obj that can get populated by restart data to keep config through restarts
    var oldconfig = {} //eslint-disable-line
    var logafterrestart = [] //create array to log these error messages after restart
    var updateFailed = false;

    //Yes, I know, global variables are bad. But I need a few multiple times in different files and it would be a pain in the ass to import them every time and ensure that I don't create a circular dependency and what not.
    global.botisloggedin = false
    global.srcdir        = process.argv[2]

    module.exports.skippedaccounts = []; //array to save which accounts have been skipped to skip them automatically when restarting

    //Start the bot through the restartdata function if this is a restart to keep some data or start the bot directly
    if (process.argv[4]) restartdata(process.argv[4]);
        else run();
}
