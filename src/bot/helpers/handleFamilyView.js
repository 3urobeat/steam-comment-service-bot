/*
 * File: handleFamilyView.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-20 23:51:51
 * Author: 3urobeat
 *
 * Last Modified: 2024-12-22 16:38:10
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
            // Disabled checking for err because Steam returns 403 when the request was successful but family view is enabled...
            /* if (err) {
                logger("warn", "Failed to check if this account has family view enabled! Proceeding and hoping family view is disabled. " + err);
            } */

            if (body) {
                resolve(body.includes("You are currently in Family View, some areas of Steam may be restricted"));
            } else {
                logger("warn", "Failed to check if this account has family view enabled! Steam returned an empty body. Proceeding and hoping family view is disabled...", false, true);
                resolve(false);
            }
        });

    });
};


/**
 * Requests family view unlock key from user and attempts to unlock it
 * @param {SteamCommunity} community The SteamCommunity instance of this bot account
 * @returns {Promise.<void>} Returns a Promise which resolves when done
 */
module.exports.unlockFamilyView = async function(community) {
    return new Promise((resolve) => {

        // Read unlock code from user
        logger.readInput("Please submit your family view unlock code: ", 90000, (input) => {
            if (!input) {
                logger("warn", "Input is empty, skipping trying to unlock family view and attempting to use account anyway...", true);
                resolve();
                return;
            }

            // Post request to Steam using the provied code
            logger("info", "Sending family view unlock request to Steam...", false, true, logger.animation("loading"));

            community.httpRequestPost({
                "uri": "https://store.steampowered.com/parental/ajaxunlock/",
                "form": {
                    "pin": input,
                    "sessionid": community.getSessionID()
                }
            }, function(err, response, body) {
                if (err) {
                    logger("error", `Failed to unlock family view! ${err} - Attempting to use account anyway...`);
                }

                if (body) {
                    let parsed;
                    // logger("debug", "unlockFamilyView() body: " + body);

                    try {
                        parsed = JSON.parse(body);
                    } catch (err) {
                        logger("error", `Failed to parse family view response body! ${err} - Can't determine if unlock was successful, attempting to use account anyway...`);
                        resolve();
                        return;
                    }

                    // Get steamparental cookie and set it when request was successful
                    if (parsed.success) {
                        const steamparentalCookie = response.rawHeaders.find((e) => e.startsWith("steamparental="));

                        if (steamparentalCookie) {
                            // logger("debug", "unlockFamilyView() cookie header: " + steamparentalCookie);
                            community.setCookies([ steamparentalCookie.split(";")[0] ]);

                            logger("info", `${logger.colors.fggreen}Successfully unlocked family view and set cookie!`, false, false, null, true);
                        } else {
                            logger("error", "Family view unlock request was declared as successful but Steam provided no steamparental cookie! Attempting to use account anyway...");
                        }
                    } else {
                        logger("error", `Failed to unlock family view! Error: "${parsed.error_message}" (EResult ${parsed.eresult}) - Attempting to use account anyway...`);
                    }
                } else {
                    logger("warn", "Failed to determine if family view unlock was successful because Steam returned an empty body. Attempting to use account anyway...", false, false, null, true);
                }

                resolve();
            }, "steamcommunity");

        });

    });
};
