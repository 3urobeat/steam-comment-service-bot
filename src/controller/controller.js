
/**
 * Runs the controller which runs & controls the bot.
 */
module.exports.run = () => {

    module.exports.communityobject = {}
    module.exports.botobject       = {}

    module.exports.bootstart            = Date.now()
    module.exports.relogQueue           = []
    module.exports.readyafterlogs       = []         //array to save suppressed logs during startup that get logged by ready.js
    module.exports.skippedaccounts      = []         //array to save which accounts have been skipped to skip them automatically when restarting
    module.exports.relogAfterDisconnect = true       //allows to prevent accounts from relogging when calling bot.logOff()



    /* ------------ Add unhandled rejection catches: ------------ */
    var logger = (type, str) => { //make a "fake" logger function in order to be able to log the error message when the user forgot to run 'npm install'
        logafterrestart.push(`${type} | ${str}`) //push message to array that will be carried through restart
        console.log(`${type} | ${str}`)
    }

    global.logger = logger;


    process.on('unhandledRejection', (reason) => { //Should keep the bot at least from crashing
        logger("error", `Unhandled Rejection Error! Reason: ${reason.stack}`, true) 
    });

    process.on('uncaughtException', (reason) => {
        logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true) 

        //Try to fix error automatically by reinstalling all modules
        /* if (String(reason).includes("Error: Cannot find module")) {
            logger("\n\ninfo", "Cannot find module error detected. Trying to fix error by reinstalling modules...")

            require("./helpers/npminteraction.js").reinstallAll((err, stdout) => { //eslint-disable-line
                if (err) {
                    logger("error", "I was unable to reinstall all modules. Please try running 'npm install' manually. Error: " + err)
                    process.exit(1);
                } else {
                    //logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)
                    logger("info", "Successfully reinstalled all modules. Restarting...")
                    require(srcdir + "/../start.js").restart({ skippedaccounts: [], logafterrestart: logafterrestart }, true); //restart
                }
            })
        } else { //logging this message but still trying to fix it would probably confuse the user
            logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true) 
        } */
    });


    /* ------------ Introduce logger function: ------------ */
    var logger = require("./helpers/logger.js").logger
    global.logger = logger;

    //Log held back messages from before this start
    if (logafterrestart.length > 0) logafterrestart.forEach((e) => { logger("", e, true, true) }) //log messages to output.txt carried through restart


    /* ------------ Mark new execution in output: ------------ */
    logger("", "\n\nBootup sequence started...", true, true)
    logger("", "---------------------------------------------------------", true, true)


    /* ------------ Import data: ------------ */
    var extdata = require("./helpers/dataimport.js").extdata()
    var config = require("./helpers/dataimport.js").config()

    global.config = config
    global.extdata = extdata


    /* ------------ Change terminal title: ------------ */
    if (process.platform == "win32") { //set node process name to find it in task manager etc.
        process.title = `${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}` //Windows allows long terminal/process names
    } else {
        process.stdout.write(`${String.fromCharCode(27)}]0;${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}${String.fromCharCode(7)}`) //sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)
        process.title = `CommentBot` //sets process title in task manager etc.
    }


    /* ------------ Print some diagnostic messages to log: ------------ */

    logger("info", `steam-comment-service-bot made by ${extdata.mestr} version ${extdata.versionstr}`, false, true)
    logger("info", `Using node.js version ${process.version}...`, false, true)
    logger("info", `Running on ${process.platform}...`, false, true)

    var maxCommentsOverall = config.maxOwnerComments //define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
    if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments
    logger("info", `Comment config values: commentdelay = ${config.commentdelay} | maxCommentsOverall = ${maxCommentsOverall} | randomizeAcc = ${config.randomizeAccounts}`, false, true)


    /* ------------ Run updater or start logging in when steam is online: ------------ */
    require("./helpers/internetconnection.js").run(true, true, true, () => { //we can ignore callback because stoponerr is true
        require("../updater/updater.js").run(false, null, false, (foundanddone) => {
            if (!foundanddone) {
                require("./login.js").startlogin() //start logging in
            } else {
                require(srcdir + "/../start.js").restart({ skippedaccounts: [] }, true); //restart
            }
        })
    })
}


/* ------------ Handle restart (if this is one): ------------ */
require("./helpers/handlerestart.js")();

var oldconfig = {} //obj that can get populated by restart data to keep config through restarts
var logafterrestart = [] //create array to log these error messages after restart


//start.js restart function calls this function and provides any data that should be kept over restarts
module.exports.restartdata = (data) => {
    global.botisloggedin = false //if this function got called then it must be an intended start and also not the first one, so set botisloggedin to false again.
    botisloggedin = false

    if (Object.keys(data).includes("skippedaccounts")) { //stop any further execution if data structure is <2.10.4 (only an array containing skippedaccounts)

        if (data.oldconfig) oldconfig = data.oldconfig //eslint-disable-line
        if (data.logafterrestart) logafterrestart = data.logafterrestart //we can't print now since the logger function isn't imported yet. 
        module.exports.skippedaccounts = data.skippedaccounts
    }

    this.run() //start bot
}


//Yes, I know, global variables are bad. But I need a few multiple times in different files and it would be a pain in the ass to import them every time and ensure that I don't create a circular dependency and what not.
global.srcdir = __dirname + "/../"
if (typeof botisloggedin == "undefined") global.botisloggedin = false //Only set if undefined so that the check below works

if (botisloggedin == true) return; //Don't start if bot is already logged in (perhaps an accidental start)


this.run() //Run this function directly to ensure compatibility with start.js