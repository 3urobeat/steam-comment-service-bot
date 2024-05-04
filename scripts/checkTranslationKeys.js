/*
 * File: checkTranslationKeys.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-09-13 21:58:32
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 13:56:28
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    This script compares all translations with the english one to detect misnamed, missing or obsolete language strings
*/


const fs  = require("fs");
const eng = require("../src/data/lang/english.json");


// Find all translations inside the same directory
const translations = fs.readdirSync("./src/data/lang/");

console.log(`Checking ${translations.length - 1} translation(s). If the script exits with no further messages, all translations contain the same keys.`);


// Iterate through all translations
translations.forEach((name) => {
    if (name == "english.json") return; // Skip "original" language
    let lang;

    // Attempt to load language
    try {
        lang = require("../src/data/lang/" + name);
    } catch(err) {
        console.log(`WARNING: Failed to load language '${name}': ${err}`);
    }


    // Get key arrays of both translations
    const engKeys  = Object.keys(eng);
    const langKeys = Object.keys(lang);


    // Check lang for missing keys
    engKeys.forEach((e) => {
        if (!langKeys.includes(e)) console.log(`Language '${name}' is missing language key '${e}'!`);
    });

    // Check lang for obselete/misnamed keys
    langKeys.forEach((e) => {
        if (!engKeys.includes(e)) console.log(`Language '${name}' contains obsolete/misnamed key '${e}'.`);
    });
});
