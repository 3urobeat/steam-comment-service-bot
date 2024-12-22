/*
 * File: handleFamilyView.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-20 23:51:51
 * Author: 3urobeat
 *
 * Last Modified: 2024-12-22 16:17:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { default: SteamCommunity } = require("steamcommunity"); // eslint-disable-line


/**
 * Attempts to check if this account has family view (feature to restrict features for child accounts) enabled
 * @param {SteamCommunity} community The SteamCommunity instance of this bot account
 * @returns {Promise.<boolean>} Returns a Promise which resolves with a boolean, indicating whether family view is enabled or not. If request failed, `false` is returned.
 */
module.exports.checkForFamilyView = async function(community) {
    return new Promise((resolve) => {

        community.httpRequestGet("https://steamcommunity.com/my?l=en", (err, res, body) => {
            if (err) {
                logger("warn", "Failed to check if this account has family view enabled! Proceeding and hoping family view is disabled. " + err);
            }

            // logger("", body, true)
            resolve(body.includes("You are currently in Family View, some areas of Steam may be restricted"));
        });

    });
};
