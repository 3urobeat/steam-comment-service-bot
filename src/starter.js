/*
 * File: starter.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-10 10:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 18:24:12
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// This file is called by start.js (which can't be updated).
// This file can be updated but is not recommended as changes can't be applied cleanly without a manual restart.

// It handles spawning and killing a child process which the bot runs in.
// This file might look a bit weird - it is designed to hopefully be mostly failsafe.


/* ---------------- First, import the core lib fs and define a few vars which will be used later ---------------- */
const fs = require("fs");

let cp;
let logger;
let forkedprocess;
let childpid;
let requestedKill;

let handleUnhandledRejection;
let handleUncaughtException;
let parentExitEvent;

// Set the current working directory path to a global var so the bot can use it later
global.srcdir = __dirname;

// Set timestamp checked in controller.js to 0 for the starter process (this one) to make sure the bot can never start here and only in the child process spawned by this.run()
process.argv[3] = 0;

// Exec Arguments passed to the child process. Add --inspect here to enable the node.js debugger
const execArgs = [ "--max-old-space-size=2048", "--optimize-for-size", /* "--inspect" */ ];


/* -------- Now, provide functions for attaching/detaching event listeners to the parent and child process -------- */

/**
 * Provide function to detach parent process event listeners
 * @private
 */
function detachParentListeners() {
    logger("info", "Detaching parent's event listeners...", false, true);

    logger.detachEventListeners();

    if (handleUnhandledRejection) process.removeListener("unhandledRejection", handleUnhandledRejection);
    if (handleUncaughtException)  process.removeListener("uncaughtException", handleUncaughtException);
    if (parentExitEvent)          process.removeListener("exit", parentExitEvent);
}


/**
 * Provide function to only once attach listeners to parent process
 * @private
 * @param {function(): void} callback Called on completion
 */
function attachParentListeners(callback) {
    const logafterrestart = [];


    /* ------------ Make a fake logger to use when the lib isn't loaded yet: ------------ */
    logger = (type, str) => {
        // Make a "fake" logger function in order to be able to log the error message when the user forgot to run 'npm install'
        let separator = "";
        if (type.length > 1 && str.length > 1) separator = "|"; // Make sure separator gets only shown if both arguments contain characters

        logafterrestart.push(`${type} ${separator} ${str}`); // Push message to array that will be carried through restart
        console.log(`${type} ${separator} ${str}`);
    };

    logger.animation = () => {}; // Just to be sure that no error occurs when trying to call this function without the real logger being present
    logger.detachEventListeners = () => {};


    /* ------------ Add unhandled rejection catches: ------------ */
    handleUnhandledRejection = (reason) => { // Should keep the bot at least from crashing
        logger("error", `Unhandled Rejection Error! Reason: ${reason.stack}`, true);
    };

    handleUncaughtException = async (reason) => { // Try to fix error automatically by reinstalling all modules
        if (String(reason).includes("Error: Cannot find module")) {
            logger("", "", true);
            if (global.extdata) logger("info", "Cannot find module error detected. Trying to fix error by reinstalling modules...\n"); // Check if extdata has been imported as workaround for hiding this message for new users to avoid confusion (because extdata.firststart can't be checked yet)

            const npminteraction = await module.exports.checkAndGetFile("./src/controller/helpers/npminteraction.js", logger, false, false);

            npminteraction.reinstallAll(logger, (err, stdout) => { // eslint-disable-line
                if (err) {
                    logger("error", "I was unable to reinstall all modules. Please try running 'npm install --omit=dev' manually. Error: " + err);
                    process.exit(1);

                } else {

                    // Logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)
                    logger("info", "Successfully reinstalled all modules.");

                    detachParentListeners();

                    logger("info", "Killing old process...", false, true);

                    requestedKill = true;

                    try {
                        process.kill(childpid, "SIGKILL");
                    } catch (err) {} // eslint-disable-line

                    setTimeout(() => {
                        logger("info", "Restarting...", false, true);
                        require("../start.js").restart({ logafterrestart: logafterrestart }); // Call restart function with argsobject
                    }, 2000);
                }
            });

        } else { // Only log error if we are not trying to fix it in an effort to not confuse the user

            logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true);
            logger("", "", true);
            logger("warn", "Restarting bot in 5 seconds since the application can be in an unrecoverable state..."); // https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_warning_using_uncaughtexception_correctly
            logger("", "", true);

            setTimeout(() => {
                require("../start.js").restart({ logafterrestart: logafterrestart }); // Call restart function with argsobject
            }, 5000);
        }
    };

    process.on("unhandledRejection", handleUnhandledRejection);
    process.on("uncaughtException",  handleUncaughtException);


    /* ------------ Add exit event listener and import logger: ------------ */
    // Attach exit event listener to display message in output & terminal when user stops the bot (before logger import so this runs before output-logger's exit event listener)
    parentExitEvent = () => {
        logger("debug", "Caller: " + process.pid + " | Child: " + childpid);

        try {
            process.kill(childpid, "SIGKILL"); // Make sure the old child is dead
        } catch (err) {} //eslint-disable-line

        logger("", "", true);
        logger("info", "Received signal to exit...", false, true);
    };

    process.on("exit", parentExitEvent);

    process.title = "CommentBot"; // Sets process title in task manager etc.


    // Import logger lib
    cp     = require("child_process");
    logger = require("output-logger"); // Look Mom, it's my own library!

    requestedKill = false;

    // Configure my logging library (https://github.com/3urobeat/output-logger#options-1)
    logger.options({
        msgstructure: `[${logger.Const.ANIMATION}] [${logger.Const.DATE} | ${logger.Const.TYPE}] ${logger.Const.MESSAGE}`,
        paramstructure: [logger.Const.TYPE, logger.Const.MESSAGE, "nodate", "remove", logger.Const.ANIMATION],
        outputfile: __dirname + "/../output.txt",
        animationdelay: 250,
        exitmessage: "Goodbye!",
    });


    // Resume start/restart
    callback();
}


/**
 * Provide function to attach listeners to make communicating with child possible
 * @private
 */
function attachChildListeners() {
    forkedprocess.on("message", (msg) => {
        logger("debug", "Received message from child: " + msg);

        // Might need to switch to a switch case structure later on but for now this works fine for only two cases and is easier when trying to check for startsWith()
        if (msg.startsWith("restart(")) {
            logger("info", "Initiating restart...", false, true);

            msg = msg.replace("restart", "").slice(1, -1); // Remove function name and round brackets to only leave stringified object behind

            if (msg == "") msg = "{}"; // Set msg to empty object if no object was provided to hopefully prevent the parsing from failing

            const argsobject = JSON.parse(msg); // Convert stringified args object back to JS object
            argsobject["pid"] = childpid; // Add pid to object

            detachParentListeners();

            logger("info", "Killing old process...", false, true);

            requestedKill = true;

            try {
                process.kill(childpid, "SIGKILL");
            } catch (err) {} //eslint-disable-line

            setTimeout(() => {
                logger("info", "Restarting...", false, true);
                require("../start.js").restart(argsobject); // Call restart function with argsobject
            }, 2000);

        } else if (msg == "stop()") {
            requestedKill = true;

            try {
                process.kill(childpid, "SIGKILL");
            } catch (err) {} //eslint-disable-line

            logger("", "", true);
            logger("info", "Stopping application...");

            process.exit(0);
        }
    });

    forkedprocess.on("close", (code) => {
        if (requestedKill) return;

        logger("warn", `Child Process exited with code ${code}! Attempting to restart...`);

        detachParentListeners();

        require("../start.js").restart({ pid: childpid });
    });
}


/* ------- Provide function to get a file if it doesn't exist. Export it to use it later as a failsafe from the bot process ------- */

/**
 * Checks if the needed file exists and gets it if it doesn't
 * @param {string} file The file path (from project root) to check and get
 * @param {function(string, string): void} logger Your current logger function
 * @param {boolean} norequire If set to true the function will return the path instead of importing it
 * @param {boolean} force If set to true the function will skip checking if the file exists and overwrite it.
 * @returns {Promise.<(undefined|string|object)>} Resolves when file was successfully loaded
 */
module.exports.checkAndGetFile = (file, logger, norequire = false, force = false) => {
    return new Promise((resolve) => {
        if (!file) {
            logger("error", "checkAndGetFile() error: file parameter is undefined!");
            resolve(undefined);
            return;
        }

        /**
         * Function that will download a new file, test it and resolve/reject promise
         * @private
         */
        function getNewFile() {
            // Determine branch
            let branch = "master"; // Default to master

            try {
                branch = require("./data/data.json").branch; // Try to read from data.json
            } catch {
                try {
                    const otherdata = require("./data.json"); // Then try to get the other, "compatibility" data file to check if versionstr includes the word BETA

                    if (otherdata.versionstr.includes("BETA")) branch = "beta-testing";
                } catch (err) {} //eslint-disable-line
            }


            // Construct URL for restoring a file from GitHub
            const fileurl = `https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/${branch}/${file.slice(2, file.length)}`; // Remove the dot at the beginning of the file string

            logger("info", "Pulling: " + fileurl, false, true);

            try {
                const https = require("https"); // Import two libs which will only be needed in this block
                const path  = require("path");

                let output = "";

                // Create the underlying folder structure to avoid error when trying to write the downloaded file
                fs.mkdirSync(path.dirname(file), { recursive: true });

                // Get the file
                https.get(fileurl, function (res) {
                    res.setEncoding("utf8");

                    res.on("data", function (chunk) {
                        output += chunk;
                    });

                    // Write and test the file
                    res.on("end", () => {
                        fs.writeFile(file, output, (err) => {
                            if (err) {
                                logger("error", "checkAndGetFile() writeFile error: " + err);
                                resolve(undefined);
                                return;
                            }

                            if (norequire) resolve(file);
                                else resolve(require("." + file));
                        });
                    });
                }).on("error", (err) => {
                    logger("error", `Fatal Error: File '${file}' is corrupted/missing and I can't restore it! Is your internet or GitHub down?\n                     ${err}`, true);
                    resolve(undefined);
                });
            } catch (err) {
                logger("error", `Fatal Error: File ${file} is corrupted/missing and I can't restore it!\n                     ${err}`, true);
                resolve(undefined);
            }
        }


        // Immediately get a new file if file doesn't exist or force is true
        if (!fs.existsSync(file) || force) {
            getNewFile();

        } else { // ...otherwise check if file is intact if norequire is false

            if (norequire) {
                resolve(file);
            } else {
                try {
                    // Don't log debug msg for package, logger, handleErrors & npminteraction as they get loaded before the actual logger is loaded. This looks bad in the terminal, is kinda irrelevant and is logged even when logDebug is off
                    if (!file.includes("package.json") && !file.includes("logger.js") && !file.includes("handleErrors.js") && !file.includes("npminteraction.js")) logger("debug", `checkAndGetFile(): file ${file} exists, force and norequire are false. Testing integrity by requiring...`); // Ignore message for logger.js as it won't use the real logger yet

                    const fileToLoad = require("." + file);

                    resolve(fileToLoad); // Seems to be fine, otherwise we would already be in the catch block
                } catch {
                    logger("warn", `It looks like file ${file} is corrupted. Trying to pull new file from GitHub...`, false, true);

                    getNewFile();
                }
            }
        }
    });
};


/* ------------ Provide functions to start.js to start the bot: ------------ */

/**
 * Run the application. This function is called by start.js
 */
module.exports.run = () => {
    if (process.env.started) return; // Make sure this function can only run once to avoid possible bug and cause startup loop
    process.env.started = "true"; // Env vars are always strings

    attachParentListeners(async () => {
        logger("info", "Starting process...");

        // Get file to start
        const file = await this.checkAndGetFile("./src/controller/controller.js", logger, false, false); // We can call without norequire as process.argv[3] is set to 0 (see top of this file) to check controller.js for errors as well
        if (!file) return;

        forkedprocess = cp.fork("./src/controller/controller.js", [__dirname, Date.now()], { execArgv: execArgs }); // Create new process and provide srcdir and timestamp as argv parameters
        childpid = forkedprocess.pid;

        attachChildListeners();
    });
};


/**
 * Restart the application
 * @param {object} args The argument object that will be passed to `controller.restartargs()`
 */
module.exports.restart = async (args) => {
    attachParentListeners(() => {
        logger("", "", true);
        logger("info", "Starting new process...");

        try {
            if (args["pid"]) process.kill(args["pid"], "SIGKILL"); // Make sure the old child is dead (if there was one)
        } catch (err) {} // eslint-disable-line

        setTimeout(async () => {
            // Get file to start
            const file = await this.checkAndGetFile("./src/controller/controller.js", logger, false, false); // We can call without norequire as process.argv[3] is set to 0 (see top of this file) to check controller.js for errors as well
            if (!file) return;

            forkedprocess = cp.fork("./src/controller/controller.js", [__dirname, Date.now(), JSON.stringify(args)], { execArgv: execArgs }); // Create new process and provide srcdir, timestamp and restartargs as argv parameters
            childpid = forkedprocess.pid;

            attachChildListeners();
        }, 2000);
    });
};
