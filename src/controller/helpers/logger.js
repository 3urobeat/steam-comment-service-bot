/*
 * File: logger.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 16.10.2022 11:38:17
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const outputlogger = require("output-logger"); // Look Mom, it's my own library!

// Configure my logging library (https://github.com/HerrEurobeat/output-logger#options-1)  (animation speed and printDebug will be changed later in controller.js after advancedconfig import)
outputlogger.options({
    required_from_childprocess: true, // eslint-disable-line camelcase
    msgstructure: `[${outputlogger.Const.ANIMATION}] [${outputlogger.Const.DATE} | ${outputlogger.Const.TYPE}] ${outputlogger.Const.MESSAGE}`,
    paramstructure: [outputlogger.Const.TYPE, outputlogger.Const.MESSAGE, "nodate", "remove", outputlogger.Const.ANIMATION],
    outputfile: srcdir + "/../output.txt"
});


/**
 * Logs text to the terminal and appends it to the output.txt file.
 * @param {String} type String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
 * @param {String} str The text to log into the terminal
 * @param {Boolean} nodate Setting to true will hide date and time in the message
 * @param {Boolean} remove Setting to true will remove this message with the next one
 * @param {Boolean} printNow Ignores the readyafterlogs check and force prints the message now
 */
module.exports.logger = (type, str, nodate, remove, animation, printNow) => { // Function that passes args to my logger library and just exists to handle readyafterlogs atm
    var controller = require("../controller.js");


    // NOTE: If the amount of parameters of this function changes then the logger call for readyafterlogs in ready.js and the readyafterlogs.push() call below need to be updated!!


    // Try to get readyafter or just ignore it if we can't. Previously I used checkAndGetFile() but that creates a circular dependency which I'd like to avoid
    try {
        var readyafter = require("../ready.js").readyafter;
    } catch (err) {
        var readyafter = null;
    }

    // Push string to readyafterlogs if bot is still starting and logger calls meets these criterias
    if (!nodate && !remove && !printNow && !readyafter && type.toLowerCase() != "debug" && !str.toLowerCase().includes("error")) { // Startup messages should have nodate enabled -> filter messages with date when bot is not started
        controller.readyafterlogs.push([ type, str, nodate, remove, animation ]);
        outputlogger("debug", `logger(): Pushing ${str}${outputlogger.colors.reset} to readyafterlogs array`);
    } else {
        outputlogger(type, str, nodate, remove, animation);
    }
};


/**
 * Call this function after loading advancedconfig.json to set previously inaccessible options
 */
module.exports.optionsUpdateAfterConfigLoad = () => {
    outputlogger.options({
        animationinterval: advancedconfig.logAnimationSpeed,
        printdebug: advancedconfig.printDebug
    });
};


/**
 * Waits for input from the terminal and returns it in a callback (logger() calls while waiting for input will be queued and logged after callback)
 * @param {String} question Ask user something before waiting for input. Pass a line break manually at the end of your String if user input should appear below this message, it will otherwise appear behind it. Pass empty String to disable.
 * @param {Number} timeout Time in ms after which a callback will be made if user does not respond. Pass 0 to disable (not recommended as your application can get stuck)
 * @param {function} [callback] Called with `input` (String) on completion or `null` if user did not respond in timeout ms.
 */
module.exports.logger.readInput = outputlogger.readInput;


/**
 * Returns one of the default animations
 * @param {String} animation Valid animations: `loading`, `waiting`, `bounce`, `progress`, `arrows` or `bouncearrows`
 * @returns Array of the chosen animation
 */
module.exports.logger.animation = outputlogger.animation;


/**
 * Stops any animation currently active
 */
module.exports.logger.stopAnimation = outputlogger.stopAnimation;


/**
 * Color shortcuts to use color codes more easily in your strings
 */
module.exports.logger.colors = outputlogger.colors;
