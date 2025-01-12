/*
 * File: calculateSuggestion.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-23 14:10:58
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 11:41:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @module CommandHandler
 */

const CommandHandler = require("../commandHandler.js");


/**
 * Calculate JaroWinkler distance between two inputs. Credit: https://sumn2u.medium.com/string-similarity-comparision-in-js-with-examples-4bae35f13968 & https://gist.github.com/sumn2u/0e0b5d9505ad096284928a987ace13fb#file-jaro-wrinker-js
 * @param {string} s1 First input
 * @param {string} s2 Second input
 * @returns {number} Returns closeness
 */
function jaroWinkler(s1, s2) {
    let m = 0;

    // Exit early if either are empty.
    if (s1.length === 0 || s2.length === 0) {
        return 0;
    }

    // Exit early if they're an exact match.
    if (s1 === s2) {
        return 1;
    }

    const range   = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
        s1Matches = new Array(s1.length),
        s2Matches = new Array(s2.length);

    for (let i = 0; i < s1.length; i++ ) {
        const low = (i >= range) ? i - range : 0,
            high  = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

        for (let j = low; j <= high; j++ ) {
            if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
                ++m;
                s1Matches[i] = s2Matches[j] = true;
                break;
            }
        }
    }

    // Exit early if no matches were found.
    if (m === 0) {
        return 0;
    }

    // Count the transpositions.
    let k = 0;
    let nTrans = 0;

    for (let i = 0; i < s1.length; i++) {
        if (s1Matches[i] === true) {
            let j;

            for (j = k; j < s2.length; j++) {
                if (s2Matches[j] === true) {
                    k = j + 1;
                    break;
                }
            }

            if (s1[i] !== s2[j]) {
                ++nTrans;
            }
        }
    }

    let weight = (m / s1.length + m / s2.length + (m - (nTrans / 2)) / m) / 3,
        l      = 0;
    const p    = 0.1;

    if (weight > 0.7) {
        while (s1[l] === s2[l] && l < 4) {
            ++l;
        }

        weight = weight + l * p * (1 - weight);
    }

    return weight;
}


/**
 * Calculates command suggestions using the Jaro Winkler distance of `input` to all registered commands
 * @param {string} input String to get the nearest registered commands of
 * @returns {{ name: string, closeness: number }[]} Returns a sorted Array of Objects, containing the command name and closeness in percent of name to `input` of every registered command
 */
CommandHandler.prototype.calculateCommandSuggestions = function(input) {
    const result = [];

    // Loop through all registered commands
    for (let i = 0; i < this.commands.length; i++) {
        // Loop through all names of this command
        for (let j = 0; j < this.commands[i].names.length; j++) {

            const thisCommandName = this.commands[i].names[j];

            result.push({
                name: thisCommandName,
                closeness: (jaroWinkler(thisCommandName, input) * 100).toFixed(2) // Limit to 2 decimals
            });

        }
    }

    // Sort result in descending order
    result.sort((a, b) => b.closeness - a.closeness);

    return result;
};
