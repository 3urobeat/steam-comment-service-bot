/*
 * File: logger.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 06.06.2023 14:30:06
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const logger = require("output-logger"); // Look Mom, it's my own library!

const Controller = require("../controller.js");


// Configure my logging library (https://github.com/HerrEurobeat/output-logger#options-1)  (animation speed and printDebug will be changed later in controller.js after advancedconfig import)
logger.options({
    required_from_childprocess: true, // eslint-disable-line camelcase
    msgstructure: `[${logger.Const.ANIMATION}] [${logger.Const.DATE} | ${logger.Const.TYPE}] ${logger.Const.MESSAGE}`,
    paramstructure: [logger.Const.TYPE, logger.Const.MESSAGE, "nodate", "remove", logger.Const.ANIMATION, "customTimestamp"],
    outputfile: srcdir + "/../output.txt"
});


// Save suppressed logs during startup that get logged by ready event
let logAfterReady = [];
let botIsReady = false;


// Modfied output-logger function to hold back certain messages until ready event fired
/**
 * Logs text to the terminal and appends it to the output.txt file.
 * @param {String} type String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
 * @param {String} str The text to log into the terminal
 * @param {Boolean} nodate Setting to true will hide date and time in the message
 * @param {Boolean} remove Setting to true will remove this message with the next one
 * @param {Boolean} printNow Ignores the readyafterlogs check and force prints the message now
 */
Controller.prototype.logger = function(type, str, nodate, remove, animation, printNow) {

    // Push string to _logAfterReady if bot is still starting (Note: We cannot use "this." here as context is missing when global var is called)
    if (typeof str == "string" && !nodate && !remove && !printNow // Log instant if msg should have no date, it will be removed or printNow is forced
        && !botIsReady                  // Log instant if bot is already started, var gets updated by _loggerLogAfterReady
        && !type.toLowerCase().includes("err") // Log errors instantly
        && type.toLowerCase() != "debug"       // Log debug messages immediately
        && !str.toLowerCase().includes("error")) { // Log instantly if message contains Error

        logAfterReady.push([ type, str, nodate, remove, animation, Date.now() ]); // Push all arguments this function got to the array, including a customTimestamp

        logger("debug", `Controller logger: Pushing "${str}${logger.colors.reset}" to logAfterReady array...`);

    } else {

        logger(type, str, nodate, remove, animation);

    }

};

// Add all nested functions from output-logger to our modified logger function
Object.assign(Controller.prototype.logger, logger);

// Make our logger public so we can use it everywhere
global.logger = Controller.prototype.logger;


/**
 * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
 */
Controller.prototype._loggerOptionsUpdateAfterConfigLoad = function(advancedconfig) {
    logger.options({
        animationinterval: advancedconfig.logAnimationSpeed,
        printdebug: advancedconfig.printDebug
    });
};


/**
 * Internal: Logs all held back messages from logAfterReady array
 */
Controller.prototype._loggerLogAfterReady = function() {
    botIsReady = true;

    if (logAfterReady.length == 0) return; // Don't do anything if empty to confuse me less when debugging

    logger("debug", `Controller logger: Logging ${logAfterReady.length} suppressed log messages...`);

    logAfterReady.forEach(e => { logger(e[0], e[1], e[2], e[3], e[4], e[5]); }); // Log suppressed logs

    logger("", "", true); // Log a newline to separate held back messages from other ready messages

    // Clear content and prevent new entries
    logAfterReady = [];
};