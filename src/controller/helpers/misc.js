/*
 * File: misc.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-03-25 14:02:56
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:08:52
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const http  = require("http");
const https = require("https");


/**
 * Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)
 * @param {number} iterations The amount of iterations
 * @param {function(object, number): void} func The function to run each iteration (Params: loop, index)
 * @param {function(): void} exit This function will be called when the loop is finished
 */
module.exports.syncLoop = (iterations, func, exit) => {
    let currentIndex = 0;
    let done         = false;

    // Construct loop object
    let loop = {
        next: function () { // Run next iteration
            process.nextTick(() => { // Delay by one tick to fix weird infinite loop crash bug
                // Check if the next iteration is still allowed to run, otherwise stop by calling break
                if (currentIndex < iterations && !done) {
                    func(loop, currentIndex); // Call function again with new index
                    currentIndex++;
                } else {
                    this.break();
                }
            });
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
 * Converts a timestamp to a human-readable "until from now" format. Does not care about past/future.
 * @param {number} timestamp UNIX timestamp to convert
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
 * Pings a **https** URL to check if the service and this internet connection is working
 * @param {string} url The URL of the service to check
 * @param {boolean} [throwTimeout=false] If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
 * @param {{ ip: string, port: number, username: string, password: string }} [proxy] Provide a proxy if the connection check should be made through a proxy instead of the local connection
 * @returns {Promise.<{ statusMessage: string, statusCode: number|null }>} Resolves on response code 2xx and rejects on any other response code. Both are called with parameter `response` (Object) which has a `statusMessage` (String) and `statusCode` (Number) key. `statusCode` is `null` if request failed.
 */
module.exports.checkConnection = (url, throwTimeout = false, proxy) => {
    return new Promise((resolve, reject) => {

        // Start a 20 sec timeout to display an error when Steam can't be reached but also doesn't throw an error
        let timeoutTimeout; // Phenomenal name, I know

        if (throwTimeout) {
            timeoutTimeout = setTimeout(() => reject({ "statusMessage": "Timeout: Received no response within 20 seconds.", "statusCode": null }), 20000);
        }

        // Use http and provide a proxy if requested - Credit: https://stackoverflow.com/a/49611762
        if (proxy) {                                                                                     // TODO: Missing authentication could perhaps cause errors here
            let auth = "Basic " + Buffer.from(proxy.username + ":" + proxy.password).toString("base64"); // Construct autentication

            url = url.replace("https://", ""); // Remove preceding https:// from url

            // Connect to proxy server
            http.request({
                host: proxy.ip,     // IP address of proxy server
                port: proxy.port,   // Port of proxy server
                method: "CONNECT",
                path: url + ":443", // Some destination, add 443 port for https!
                headers: { "Proxy-Authorization": auth },
            }).on("connect", (res, socket) => {

                if (res.statusCode === 200) { // Connected to proxy server, now ping the url
                    https.get({
                        host: url,
                        path: "/",
                        agent: new https.Agent({ socket }), // Cannot use a default agent
                    }, (res) => {
                        resolve(res);
                    });
                } else {
                    reject({ "statusMessage": "Failed to connect to proxy server.", "statusCode": res.statusCode });
                }

            }).on("error", (err) => {
                reject({ "statusMessage": "Failed to connect to proxy server. Error: " + err, "statusCode": null });
            }).end();

        } else {

            https.get(url, (res) => {
                if (throwTimeout) clearTimeout(timeoutTimeout);

                if (res.statusCode >= 200 && res.statusCode < 300) resolve(res);
                    else reject(res);

            }).on("error", (err) => {

                if (throwTimeout) clearTimeout(timeoutTimeout);

                reject({ "statusMessage": err.message, "statusCode": null });
            });
        }

    });
};


/**
 * Splits a HTTP proxy URL into its parts
 * @param {string} url The HTTP proxy URL
 * @returns {{ ip: string, port: number, username: string, password: string }} Object containing the proxy parts
 */
module.exports.splitProxyString = (url) => { // TODO: Missing authentication could perhaps cause errors here

    let obj = { ip: "", port: 0, username: "", password: "" };

    if (!url) return obj;

    // Cut away http prefix
    url = url.replace("http://", "");

    // Split at @ to get username:pw and ip:port parts
    url = url.split("@");

    // Split both parts at : to separate the 4 different elements
    let usernamePassword = url[0].split(":");
    let ipPort           = url[1].split(":");

    // Extract ip and port from ipPort and username and password from usernamePassword
    obj.ip   = ipPort[0];
    obj.port = ipPort[1];

    obj.username = usernamePassword[0];
    obj.password = usernamePassword[1];

    // Return result
    return obj;

};


/**
 * Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.
 * It is used by the steamChatInteraction helper but can be used in plugins as well.
 * @param {string} txt The string to cut
 * @param {number} limit Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount.
 * @param {Array.<string>} cutChars Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"]
 * @param {number} threshold Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length
 * @returns {Array} Returns all parts of the string in an array
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
