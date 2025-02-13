/*
 * File: misc.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-03-24 18:58:55
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-13 21:20:02
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager.js");


/**
 * Retrieves the last processed request of anyone or a specific steamID64 from the lastcomment database
 * @param {string} steamID64 Search for a specific user
 * @returns {Promise.<number>} Called with the greatest timestamp (Number) found
 */
DataManager.prototype.getLastCommentRequest = function(steamID64 = null) {
    return new Promise((resolve) => {

        let searchFor = {};                           // Get all documents
        if (steamID64) searchFor = { id: steamID64 }; // Get a specific id

        let greatestValue = 0;

        this.lastCommentDB.find(searchFor, (err, docs) => {
            docs.forEach((e) => {
                if (e.time > greatestValue) greatestValue = Number(e.time); // Check if this iteration is a new highscore
            });

            resolve(greatestValue); // Resolve when loop is done
        });

    });
};


/**
 * Decodes a JsonWebToken - https://stackoverflow.com/a/38552302
 * @param {string} token The token to decode
 * @returns {object|null} JWT object on success, `null` on failure
 */
DataManager.prototype.decodeJWT = function(token) {
    const payload = token.split(".")[1];            // Remove header and signature as we only care about the payload
    const decoded = Buffer.from(payload, "base64"); // Decode

    // Try to parse json object
    try {
        const parsed = JSON.parse(decoded.toString());
        return parsed;
    } catch (err) {
        logger("err", `Failed to decode JWT! Error: ${err}`, true);
        return null;
    }
};


/**
 * Increments the counter for a request type in statistics.db
 * @param {string} requestType Name of the request type to increment
 * @param {number} [amount] Optional: Amount by which to increase the counter, default 1
 */
DataManager.prototype.countRequestToStatistics = function(requestType, amount = 1) {

    this.statsDB.update({ requestType: requestType }, { $inc: { amount: amount } }, { upsert: true }, (err) => {
        if (err) {
            logger("err", `Failed to increment counter for requestType '${requestType}' in statistics.db! Error: ${err}`);
        }
    });

};
