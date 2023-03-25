/*
 * File: misc.js
 * Project: steam-comment-service-bot
 * Created Date: 25.03.2023 14:02:56
 * Author: 3urobeat
 *
 * Last Modified: 25.03.2023 16:07:16
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const https = require("https");


/**
 * Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)
 * @param {Number} iterations The amount of iterations
 * @param {Function} func The function to run each iteration (Params: loop, index)
 * @param {Function} exit This function will be called when the loop is finished
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
        }
    };

    loop.next();
    return loop;
};


/**
 * Rounds a number with x decimals
 * @param {Number} value Number to round
 * @param {Number} decimals Amount of decimals
 * @returns {Number} Rounded number
 */
module.exports.round = (value, decimals) => {
    return Number(Math.round(value+"e"+decimals)+"e-"+decimals);
};


/**
 * Pings an URL to check if the service and this internet connection is working
 * @param {String} url The URL of the service to check
 * @param {Boolean} throwTimeout If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
 * @returns {Promise} Resolves on response code 2xx and rejects on any other response code. Both are called with parameters `message` (String) & `resCode` (Number). `resCode` is null if the get request failed. If throwTimeout is enabled and triggered `resCode` will be 0.
 */
module.exports.checkConnection = (url, throwTimeout) => {

    return new Promise((resolve, reject) => {

        // Start a 20 sec timeout to display an error when Steam can't be reached but also doesn't throw an error
        let timeoutTimeout; // Phenomenal name, I know

        if (throwTimeout) {
            timeoutTimeout = setTimeout(() => reject("Timeout: Received no response within 20 seconds.", 0), 20000);
        }

        https.get(url, function (res) {
            if (throwTimeout) clearTimeout(timeoutTimeout);

            if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.statusMessage, res.statusCode);
                else reject(res.statusCode, res.statusCode);

        }).on("error", function(err) {

            if (throwTimeout) clearTimeout(timeoutTimeout);

            reject(err.message, null);
        });

    });

};