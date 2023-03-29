/*
 * File: handleErrors.js
 * Project: steam-comment-service-bot
 * Created Date: 21.03.2023 22:53:37
 * Author: 3urobeat
 *
 * Last Modified: 29.03.2023 12:54:11
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller = require("../controller.js");


/**
 * Internal: Handles process's unhandledRejection & uncaughtException error events.
 * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
 */
Controller.prototype._handleErrors = function() {

    // Should keep the bot from crashing
    process.on("unhandledRejection", (reason) => {
        logger("error", `Unhandled Rejection Error! Reason: ${reason.stack}`, true);
    });


    // Known issue: This event listener doesn't seem to capture uncaught exceptions in functions. However if it is inside for example a setTimeout it suddently works.
    process.on("uncaughtException", (reason) => {
        // Try to fix error automatically by reinstalling all modules
        if (String(reason).includes("Error: Cannot find module")) {
            logger("", "", true);
            logger("info", "Cannot find module error detected. Trying to fix error by reinstalling modules...\n");
            logger("debug", "uncaughtException " + reason.stack, true);

            require("./npminteraction.js").reinstallAll(logger, (err, stdout) => { //eslint-disable-line
                if (err) {
                    logger("error", "I was unable to reinstall all modules. Please try running 'npm install' manually. Error: " + err);
                    return this.stop();
                } else {
                    // Logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)
                    logger("info", "Successfully reinstalled all modules. Restarting...");
                    this.restart(JSON.stringify({ skippedaccounts: this.skippedaccounts, logafterrestart: this.logafterrestart })); // Send request to parent process
                }
            });

        } else { // Logging this message but still trying to fix it would probably confuse the user

            logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true);
            logger("", "", true);
            logger("warn", "If the bot doesn't work correctly anymore after this error then please restart it!");


            // Always restarting causes unnecessary restarts so I need to investigate this further
            /* logger("warn", "Restarting bot in 5 seconds since the application can be in an unrecoverable state..."); // https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_warning_using_uncaughtexception_correctly
            logger("", "", true);

            setTimeout(() => {
                this.restart(JSON.stringify({ skippedaccounts: this.skippedaccounts, logafterrestart: logafterrestart })); // Send request to parent process
            }, 5000); */
        }
    });

};

module.exports = Controller;