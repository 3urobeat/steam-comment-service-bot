/*
 * File: getQuote.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-03-02 16:21:11
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:14:11
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager.js");


const randomstring = arr => arr[Math.floor(Math.random() * arr.length)]; // Smol function to get random string from array

const lastQuotes = []; // Tracks recently used quotes to avoid duplicates


/**
 * Gets a random quote
 * @param {Array} quotesArr Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
 * @returns {Promise.<string>} Resolves with `quote` (String)
 */
DataManager.prototype.getQuote = function(quotesArr = null) {
    let selection;
    let retry = false;

    return new Promise((resolve) => {

        // Use default quote set imported by _importFromDisk() if no custom quote arr was provided
        if (!quotesArr) quotesArr = this.quotes;

        // Remove first element from array if we have more than lastQuotesSize in it
        if (lastQuotes.length > this.advancedconfig.lastQuotesSize - 1) lastQuotes.splice(0, 1);

        // Retry selection until selection isn't in lastQuotes array but hard cap to 20 iterations to avoid an infinite loop
        for (let i = 0; i < 20; i++) {
            selection = randomstring(quotesArr); // Get a random quote

            // Set retry to true and stop this iteration if selection is in lastQuotes array
            if (lastQuotes.includes(selection)) {
                logger("debug", "getQuote(): Selected quote is in lastQuotes array, retrying...");
                retry = true;

            } else {

                retry = false;

                // Push this comment to lastquotes array to not get it the next lastQuotesSize times if the quotes.txt has more than lastQuotesSize quotes
                if (quotesArr.length > this.advancedconfig.lastQuotesSize) lastQuotes.push(selection);

                // Resolve promise
                // logger("debug", "getQuote(): Found quote: " + selection);
                resolve(selection);
            }

            // Abort loop if we don't need to retry
            if (!retry) break;
        }

    });
};
