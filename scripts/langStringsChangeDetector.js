/*
 * File: langStringsChangeDetector.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-06-05 13:59:22
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-28 21:07:27
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    This script compares two language files and generates an output to include in the changelog.
*/


// Load files
const oldLang = require("./oldLang.json");
const newLang = require("../src/data/lang/english.json");


// Check for additions
console.log("- These language keys have been added:");

Object.keys(newLang).forEach((e, i) => {
    if (!oldLang[e]) console.log(`  - ${e}`);

    // Check for removed
    if (i + 1 == Object.keys(newLang).length) {
        console.log("- These language keys have been removed:");

        Object.keys(oldLang).forEach((f, j) => {
            if (!newLang[f]) console.log(`  - ${f}`);

            // Check for changed
            if (j + 1 == Object.keys(oldLang).length) {
                console.log("- These language key's values have changed:");

                Object.keys(newLang).forEach((g) => {
                    if (oldLang[g] && oldLang[g] != newLang[g]) console.log(`  - ${g}`);
                });
            }
        });
    }
});
