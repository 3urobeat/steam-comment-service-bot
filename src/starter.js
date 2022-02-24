/*
 * File: starter.js
 * Project: steam-comment-service-bot
 * Created Date: 10.07.2021 10:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 23.02.2022 15:21:21
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


//File to help starting application and making start.js more dynamic.

var cp;
var logger;
var forkedprocess;
var childpid;
var requestedKill;

var handleUnhandledRejection;
var handleUncaughtException;
var parentExitEvent;

global.srcdir = __dirname;


//Provide function to only once attach listeners to parent process
function attachParentListeners() {
    var logafterrestart = [];

    /* ------------ Add unhandled rejection catches: ------------ */
    logger = (type, str) => { //make a "fake" logger function in order to be able to log the error message when the user forgot to run 'npm install'
        if (type.length > 1 && str.length > 1) var separator = "|" //make sure separator gets only shown if both arguments contain characters
            else var separator = ""

        logafterrestart.push(`${type} ${separator} ${str}`) //push message to array that will be carried through restart
        console.log(`${type} ${separator} ${str}`)
    }

    logger.animation = () => {} //just to be sure that no error occurs when trying to call this function without the real logger being present

    handleUnhandledRejection = (reason) => { //Should keep the bot at least from crashing
        logger("error", `Unhandled Rejection Error! Reason: ${reason.stack}`, true) 
    }

    handleUncaughtException = (reason) => {
        //Try to fix error automatically by reinstalling all modules
        if (String(reason).includes("Error: Cannot find module")) {
            logger("", "", true)
            logger("info", "Cannot find module error detected. Trying to fix error by reinstalling modules...\n")

            require("./controller/helpers/npminteraction.js").reinstallAll(logger, (err, stdout) => { //eslint-disable-line
                if (err) {
                    logger("error", "I was unable to reinstall all modules. Please try running 'npm install' manually. Error: " + err)
                    process.exit(1);

                } else {

                    //logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)
                    logger("info", "Successfully reinstalled all modules.")

                    detachParentListeners();

                    logger("info", "Killing old process...", false, true)

                    requestedKill = true;

                    try {
                        process.kill(childpid, "SIGKILL")
                    } catch (err) {} //eslint-disable-line

                    setTimeout(() => {
                        logger("info", "Restarting...", false, true) //Note (Known issue!): Restarting here causes the application to start the bot in this process rather than creating a child_process. I have no idea why but it doesn't seem to cause issues (I HOPE) and is fixed when the user restarts the bot.
                        require("../start.js").restart({ logafterrestart: logafterrestart }) //call restart function with argsobject
                    }, 2000);
                }
            })
        } else { //logging this message but still trying to fix it would probably confuse the user
            logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true) 
            logger("", "", true)
            logger("warn", "Restarting bot in 5 seconds since the application can be in an unrecoverable state...") //https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_warning_using_uncaughtexception_correctly
            logger("", "", true)
            
            setTimeout(() => {
                require("../start.js").restart({ logafterrestart: logafterrestart }) //call restart function with argsobject
            }, 5000);
        }
    }

    process.on('unhandledRejection', handleUnhandledRejection);
    process.on('uncaughtException', handleUncaughtException);


    /* ------------ Import logger and add exit event listener: ------------ */
    cp     = require('child_process');
    logger = require("output-logger") //look Mom, it's my own library!

    requestedKill = false;

    //Configure my logging library (https://github.com/HerrEurobeat/output-logger#options-1)
    logger.options({
        msgstructure: `[${logger.Const.ANIMATION}] [${logger.Const.DATE} | ${logger.Const.TYPE}] ${logger.Const.MESSAGE}`,
        paramstructure: [logger.Const.TYPE, logger.Const.MESSAGE, "nodate", "remove", logger.Const.ANIMATION],    
        outputfile: __dirname + "/../output.txt",
        animationdelay: 250
    })


    //Attach exit event listener to display message in output & terminal when user stops the bot
    parentExitEvent = () => {
        logger("debug", "Caller: " + process.pid + " | Child: " + childpid)

        try {
            process.kill(childpid, "SIGKILL") //make sure the old child is dead
        } catch (err) {} //eslint-disable-line

        logger("", "", true)
        logger("info", `Recieved signal to exit...`, false, true);
        logger("", "Goodbye!", true); //I'm intentionally not using exitmessage of output-logger here as it would print this message above the message above this line which sucks
    }

    process.on("exit", parentExitEvent);
}

function detachParentListeners() {
    logger("info", "Detaching parent's event listeners...", false, true)

    if (handleUnhandledRejection) process.removeListener("unhandledRejection", handleUnhandledRejection)
    if (handleUncaughtException)  process.removeListener("uncaughtException", handleUncaughtException)
    if (parentExitEvent)          process.removeListener("exit", parentExitEvent)
}


//Provide function to attach listeners to make communicating with child possible
function attachChildListeners() {
    forkedprocess.on("message", (msg) => {
        logger("debug", "Recieved message from child: " + msg)

        //Might need to switch to a switch case structure later on but for now this works fine for only two cases and is easier when trying to check for startsWith()
        if (msg.startsWith("restart(")) {
            logger("info", "Initiating restart...", false, true)

            msg = msg.replace("restart", "").slice(1, -1) //remove function name and round brackets to only leave stringified object behind

            if (msg == "") msg = "{}" //set msg to empty object if no object was provided to hopefully prevent the parsing from failing

            let argsobject = JSON.parse(msg) //convert stringified args object back to JS object
            argsobject["pid"] = childpid     //add pid to object

            detachParentListeners();

            logger("info", "Killing old process...", false, true)

            requestedKill = true;

            try {
                process.kill(childpid, "SIGKILL")
            } catch (err) {} //eslint-disable-line

            setTimeout(() => {
                logger("info", "Restarting...", false, true)
                require("../start.js").restart(argsobject) //call restart function with argsobject
            }, 2000);

        } else if (msg == "stop()") {

            requestedKill = true;
            
            try {
                process.kill(childpid, "SIGKILL")
            } catch (err) {} //eslint-disable-line
            
            logger("", "", true)
            logger("info", "Stopping application...")
            
            process.exit(0)

        }
    })

    forkedprocess.on("close", (code) => {
        if (requestedKill) return;

        logger("warn", `Child Process exited with code ${code}! Attempting to restart...`)

        detachParentListeners();
        
        require("../start.js").restart({ pid: childpid })
    })
}


/* ------------ Provide function to get file if it doesn't exist: ------------ */

/**
 * Checks if the needed file exists and gets it if it doesn't
 * @param {String} file The file path (from project root) to check and get
 * @param {function} logger Your current logger function
 * @param {Boolean} norequire If set to true the function will return the path instead of importing it
 * @param {Boolean} force If set to true the function will skip checking if the file exists and overwrite it.
 * @param {function} [callback] Called with `ready` (Boolean) on completion.
 */
module.exports.checkAndGetFile = (file, logger, norequire, force, callback) => {
    if (!file) {
        logger("error", "checkAndGetFile() error: file parameter is undefined!")
        callback(undefined)
        return;
    }

    var fs = require("fs")
    

    if (!fs.existsSync(file) || force) { //Function that downloads filetostart if it doesn't exist (file location change etc.)
        //Determine branch
        var branch = "master" //Default to master
        try { 
            branch = require("./data/data.json").branch //Try to read from data.json (which will when user is coming from <2.11)
        } catch (err) {
            try {
                var otherdata = require("./data.json") //then try to get the other, "compatibility" data file to check if versionstr includes the word BETA
                
                if (otherdata.versionstr.includes("BETA")) branch = "beta-testing"
            } catch (err) { } //eslint-disable-line
        }


        var fileurl = `https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${branch}/${file.slice(2, file.length)}` //remove the dot at the beginning of the file string

        logger("info", "Pulling: " + fileurl, false, true)

        try {
            var https = require("https")
            var path  = require("path")

            var output = ""

            //Create the underlying folder structure to avoid error when trying to write the downloaded file
            fs.mkdirSync(path.dirname(file), { recursive: true })

            //Get the file
            https.get(fileurl, function (res) {
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    output += chunk 
                });

                res.on('end', () => {
                    fs.writeFile(file, output, (err) => {
                        if (err) {
                            logger("error", "checkAndGetFile() writeFile error: " + err)
                            callback(null)
                            return;
                        }

                        if (norequire) callback(file)
                            else callback(require("." + file))
                    })
                }) 
            });
        } catch (err) { 
            logger("error", "start.js get starter.js function error: " + err)

            callback(null)
        }
    } else {
        if (norequire) callback(file)
            else callback(require("." + file))
    }
}


/* ------------ Provide functions to start.js to start the bot: ------------ */

/**
 * Run the application
 */
module.exports.run = () => {
    if (process.env.started) return; //make sure this function can only run once to avoid possible bug and cause startup loop
    process.env.started = "true"; //env vars are always strings

    attachParentListeners();

    logger("info", "Starting process...")

    process.title = `CommentBot` //sets process title in task manager etc.

    this.checkAndGetFile("./src/controller/controller.js", logger, true, false, (file) => {
        forkedprocess = cp.fork(file, [ __dirname, Date.now() ]) //create new process and provide srcdir and timestamp as argv parameters
        childpid      = forkedprocess.pid

        attachChildListeners();
    })
}


/**
 * Restart the application
 * @param {Object} args The argument object that will be passed to `controller.restartargs()`
 */
module.exports.restart = (args) => {
    attachParentListeners();

    logger("", "", true)
    logger("info", "Starting new process...")

    try {
        process.kill(args["pid"], "SIGKILL") //make sure the old child is dead
    } catch (err) {} //eslint-disable-line

    setTimeout(() => {
        this.checkAndGetFile("./src/controller/controller.js", logger, true, false, (file) => {
            forkedprocess = cp.fork(file, [ __dirname, Date.now(), JSON.stringify(args) ]) //create new process and provide srcdir, timestamp and restartargs as argv parameters
            childpid      = forkedprocess.pid
    
            attachChildListeners();
        })
    }, 2000);
}
