/*
 * File: misc.js
 * Project: steam-comment-service-bot
 * Created Date: 25.03.2023 14:02:56
 * Author: 3urobeat
 *
 * Last Modified: 04.07.2023 18:01:36
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const https = require("https");


/**
 * Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)
 * @param {number} iterations The amount of iterations
 * @param {function} func The function to run each iteration (Params: loop, index)
 * @param {function} exit This function will be called when the loop is finished
 */
module.exports.syncLoop = (iterations, func, exit) => {
    let currentIndex = 0;
    let done         = false;

    // Construct loop object
    let loop = {
        next: function () { // Run next iteration
                // Check if the next iteration is still allowed to run, otherwise stop by calling break
                if (currentIndex < iterations && !done) {
                    func(loop, currentIndex); // Call function again with new index
                    currentIndex++;
                } else {
                    this.break();
                }1;
        },
        break: function () { // Break loop and call exit function
            done = true;
            if (exit) exit();
        },
        index: function() {
            return currentIndex - 1;
        }
    };

    loop.next();
    return loop;
};


/**
 * Rounds a number with x decimals
 * @param {number} value Number to round
 * @param {number} decimals Amount of decimals
 * @returns {number} Rounded number
 */
module.exports.round = (value, decimals) => {
    return Number(Math.round(value+"e"+decimals)+"e-"+decimals);
};


/**
 * Converts a timestamp to a human-readable until from now format. Does not care about past/future.
 * @returns {string} "x seconds/minutes/hours/days"
 */
module.exports.timeToString = (timestamp) => {
    let until = Math.abs((Date.now() - timestamp) / 1000);
    let untilUnit = "seconds";

    if (until > 60) {
        until = until / 60; untilUnit = "minutes";

        if (until > 60) {
            until = until / 60; untilUnit = "hours";

            if (until > 24) {
                until = until / 24; untilUnit = "days";
            }
        }
    }

    return `${this.round(until, 2)} ${untilUnit}`;
};


/**
 * Pings an URL to check if the service and this internet connection is working
 * @param {string} url The URL of the service to check
 * @param {boolean} throwTimeout If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
 * @returns {Promise.<{ statusMessage: string, statusCode: number|null }>} Resolves on response code 2xx and rejects on any other response code. Both are called with parameter `response` (Object) which has a `statusMessage` (String) and `statusCode` (Number) key. `statusCode` is `null` if request failed.
 */
module.exports.checkConnection = (url, throwTimeout) => {
    return new Promise((resolve, reject) => {

        // Start a 20 sec timeout to display an error when Steam can't be reached but also doesn't throw an error
        let timeoutTimeout; // Phenomenal name, I know

        if (throwTimeout) {
            timeoutTimeout = setTimeout(() => reject({ "statusMessage": "Timeout: Received no response within 20 seconds.", "statusCode": null }), 20000);
        }

        https.get(url, function (res) {
            if (throwTimeout) clearTimeout(timeoutTimeout);

            if (res.statusCode >= 200 && res.statusCode < 300) resolve(res);
                else reject(res);

        }).on("error", function(err) {

            if (throwTimeout) clearTimeout(timeoutTimeout);

            reject({ "statusMessage": err.message, "statusCode": null });
        });

    });
};


/**
 * Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.
 * It is used by the steamChatInteraction helper but can be used in plugins as well.
 * @param {string} txt The string to cut
 * @param {number} limit Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount.
 * @param {array} cutChars Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"]
 * @param {number} threshold Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length
 * @returns {array} Returns all parts of the string in an array
 */
module.exports.cutStringsIntelligently = (txt, limit, cutChars, threshold) => {
    if (!cutChars)  cutChars  = [" ", "\n", "\r"]; // Set cutChars to space, newline or Windows newline if undefined
    if (!threshold) threshold = txt.length * 0.15; // Set threshold to 15% of total length if undefined
    if (txt.length <= limit) return [txt];         // Instantly return string as element 0 if it is already less than limit

    let lastIndex = 0;
    let result    = [];

    // Iterate over string until lastIndex reaches length of input string
    while (lastIndex < txt.length - 1) {
        let cut = txt.slice(lastIndex, lastIndex + limit); // Get the next part by cutting from lastIndex to limit

        // Find the last occurrence of all cutChars and find the most recent one using Math.max()
        let lastOccurrence = Math.max(...cutChars.map(e => cut.lastIndexOf(e)));

        // Check if cut maxes out limit, a last occurrence was found and is within threshold. If so, cut again, push to result and update lastIndex. If not, accept a word cut.
        if (cut.length == limit && lastOccurrence >= 0 && (cut.length - lastOccurrence) < threshold) {
            result.push(txt.slice(lastIndex, lastIndex + lastOccurrence).trim());
            lastIndex += lastOccurrence;
        } else {
            result.push(cut.trim());
            lastIndex += limit - 1;
        }
    }

    // Return result
    return result;
};