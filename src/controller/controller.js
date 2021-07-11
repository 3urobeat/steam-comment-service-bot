
/**
 * Runs the controller which runs & controls the bot.
 */
module.exports.run = () => {
    var starter = require("../starter.js")

    /* ------------ Handle restart (if this is one): ------------ */
    starter.checkAndGetFile("./src/controller/helpers/handlerestart.js", (file) => {
        file();
    })


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
                    require(srcdir + "/../start.js").restart({ skippedaccounts: this.skippedaccounts, logafterrestart: logafterrestart }, true); //restart
                }
            })
        } else { //logging this message but still trying to fix it would probably confuse the user
            logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true) 
        } */
    });


    /* ------------ Introduce logger function: ------------ */
    starter.checkAndGetFile("./src/controller/helpers/logger.js", (file) => {
        logger = file.logger
        global.logger = logger
    })


    //Log held back messages from before this start
    if (logafterrestart.length > 0) logafterrestart.forEach((e) => { //log messages to output.txt carried through restart
        e.split("\n").forEach((f) => { //split string on line breaks to make output cleaner when using remove
            logger("", "[logafterrestart] " + f, true, true)
        })
    })
    
    logafterrestart = [] //clear array


    /* ------------ Mark new execution in output: ------------ */
    logger("", "\n\nBootup sequence started...", true, true)
    logger("", "---------------------------------------------------------", true, true)


    /* ------------ Import data: ------------ */
    var extdata;
    var config;

    starter.checkAndGetFile("./src/controller/helpers/dataimport.js", (file) => {
        file.extdata((extdatafile) => {

            extdata = extdatafile
            config  = file.config()

            global.config  = config
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
            logger("info", `Using ${extdata.branch} branch | firststart is ${extdata.firststart} | This is start number ${extdata.timesloggedin + 1}`, false, true)

            if (extdata.branch == "beta-testing") logger("", "\x1b[0m[\x1b[31mNotice\x1b[0m] Your updater and bot is running in beta mode. These versions are often unfinished and can be unstable.\n         If you would like to switch, open data.json and change 'beta-testing' to 'master'.\n         If you find an error or bug please report it: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose\n", true)

            var maxCommentsOverall = config.maxOwnerComments //define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
            if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments
            logger("info", `Comment config values: commentdelay = ${config.commentdelay} | maxCommentsOverall = ${maxCommentsOverall} | randomizeAcc = ${config.randomizeAccounts}`, false, true)


            /* ------------ Run updater or start logging in when steam is online: ------------ */
            starter.checkAndGetFile("./src/updater/updater.js", (updater) => { //welcome to callback hell! Yes, I should improve this later.

                updater.compatibility(() => { //continue startup on any callback

                    require("./helpers/internetconnection.js").run(true, true, true, () => { //we can ignore callback because stoponerr is true

                        require("../updater/updater.js").run(false, null, false, (foundanddone2) => {

                            if (!foundanddone2) {
                                require("./login.js").startlogin() //start logging in
                            } else {
                                require(srcdir + "/../start.js").restart({ skippedaccounts: this.skippedaccounts }); //restart
                            }
                        })
                    })
                })
            })
        })
        
    })    
}


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