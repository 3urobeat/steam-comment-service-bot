/*
 * File: getLang.js
 * Project: steam-comment-service-bot
 * Created Date: 09.09.2023 12:35:10
 * Author: 3urobeat
 *
 * Last Modified: 10.09.2023 16:56:48
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager");


/**
 * Retrieves a language string from one of the available language files and replaces keywords if desired.
 * If a userID is provided it will lookup which language the user has set. If nothing is set, the default language set in the config will be returned.
 * @param {string} str Name of the language string to be retrieved
 * @param {{[key: string]: string}} [replace] Optional: Object containing keywords in the string to replace. Pass the keyword as key and the corresponding value to replace as value.
 * @param {string} [userIDOrLanguage] Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language.
 * @returns {Promise.<string|null>} Returns a promise that resolves with the language string or `null` if it could not be found.
 */
DataManager.prototype.getLang = async function(str, replace = null, userIDOrLanguage = "") {

    // Figure out which language to choose
    let lang = this.lang[this.config.defaultLanguage.toLowerCase()]; // Set default

    if (userIDOrLanguage) {
        if (Object.keys(this.lang).includes(userIDOrLanguage.toLowerCase())) { // Update if a supported language was passed
            logger("debug", "DataManager getLang(): Supported specific language requested: " + userIDOrLanguage);

            lang = this.lang[userIDOrLanguage.toLowerCase()];

        } else { // Search for user in database if this is an ID

            let res = await this.userSettingsDB.findOneAsync({ "id": userIDOrLanguage }, {});

            if (res) {
                lang = this.lang[res.lang];

                logger("debug", `DataManager getLang(): Request for userID '${userIDOrLanguage}' resulted in '${res.lang}'`);
            } else {
                logger("debug", `DataManager getLang(): Unsupported language or userID '${userIDOrLanguage}' was provided, using default '${this.config.defaultLanguage}'...`);
            }
        }
    }


    // Retrieve the requested string
    let langStr = lang[str];

    if (!langStr) {
        logger("err", `getLang(): I was unable to find the string '${str}' in the language file '${lang.langname}'!`);
        return null;
    }


    // Modify the string if replace was passed
    if (replace) {
        Object.keys(replace).forEach((e) => {
            // Add ${ prefix and } suffix to e
            let rawPattern = "${" + e + "}";

            // Skip iteration and display warning if the string does not contain the specified keyword
            if (!langStr.includes(rawPattern)) return logger("warn", `getLang(): The string '${str}' of language '${lang.langname}' does not contain the provided keyword '${rawPattern}'!`);

            // Build regex pattern to dynamically replace all occurrences below. Escape rawPattern before concatenating to avoid special char issues later on
            let regex = new RegExp(rawPattern.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"); // Regex credit: https://stackoverflow.com/a/17886301

            langStr = langStr.replace(regex, replace[e]);
        });
    }


    // Resolve with the resulting string
    return langStr;

};