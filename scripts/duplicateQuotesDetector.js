/*
 * File: duplicateQuotesDetector.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-02-24 11:49:11
 * Author: 3urobeat
 *
 * Last Modified: 2024-02-24 12:30:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    This script detects duplicate or too long quotes in quotes.txt
*/

const fs = require("fs");

let quotes;


quotes = fs.readFileSync("../quotes.txt", "utf8").split("\n"); // Get all quotes from the quotes.txt file into an array
quotes = quotes.filter((str) => str != ""); // Remove empty quotes


console.log(`Found ${quotes.length} quotes. Analyzing them using one thread might take a moment.\nIf this script exits without any further messages, all quotes have passed.\n`);


quotes.forEach((e, i) => {
    if (e.length > 999) {
        console.log(`The quote.txt line ${i + 1} is longer than the limit of 999 characters.`, true, false, logger.animation("loading"));
        quotes.splice(i, 1); // Remove this item from the array
        return;
    }

    if (quotes.filter((j) => e == j).length > 1) {
        console.log(`The quote.txt line ${i + 1} has a duplicate!`);
    }
});
