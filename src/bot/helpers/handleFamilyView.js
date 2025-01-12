/*
 * File: handleFamilyView.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-20 23:51:51
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 12:24:26
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot");


/**
 * Attempts to check if this account has family view (feature to restrict features for child accounts) enabled
 * @returns {Promise.<boolean>} Returns a Promise which resolves with a boolean, indicating whether family view is enabled or not. If request failed, `false` is returned.
 */
Bot.prototype.checkForFamilyView = function() {
    return new Promise((resolve) => {

        this.community.httpRequestGet("https://steamcommunity.com/my?l=en", (err, res, body) => {
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
 * @returns {Promise.<void>} Returns a Promise which resolves when done
 */
Bot.prototype.unlockFamilyView = function() {
    return new Promise((resolve) => {

        // Helper function - Reads user input for family view code
        const readUserInput = (callback) => { // ES6 function to not create a new context
            // Block handleLoginTimeout check from triggering while waiting for user input
            this.loginData.waitingFor2FA = true;

            // Read unlock code from user
            logger("", "", true);
            logger.readInput(`[${this.accountName}] Please submit your family view unlock code to use this account for requests: `, 90000, (input) => {
                // Re-enable login timeout check as the very first action to prevent any possible softlock
                this.loginData.waitingFor2FA = false;

                if (!input) {
                    logger("warn", `[${this.logPrefix}] Input is empty, skipping trying to unlock family view and attempting to use account anyway...`, true);
                }

                callback(input);
            });
        };

        // Helper function - Posts request to Steam using the provied code. Returns promise which resolves with boolean indicating whether request was known successful or not
        const submitToSteam = (input, callback) => {    // ES6 function to not create a new context
            return new Promise((resolveSubmit) => {     // Sorry for the nested Promise but I promise (heh) this is a sensible solution
                logger("info", `[${this.logPrefix}] Sending family view unlock request to Steam...`, false, true, logger.animation("loading"));

                this.community.httpRequestPost({
                    "uri": "https://store.steampowered.com/parental/ajaxunlock/",
                    "form": {
                        "pin": input,
                        "sessionid": this.community.getSessionID()
                    }
                }, (err, response, body) => {
                    if (err) {
                        logger("error", `[${this.logPrefix}] Failed to unlock family view! ${err}`);
                        return resolveSubmit(false);
                    }

                    if (body) {
                        let parsed;
                        // logger("debug", "unlockFamilyView() body: " + body);

                        try {
                            parsed = JSON.parse(body);
                        } catch (err) {
                            logger("error", `[${this.logPrefix}] Failed to parse family view response body! ${err} - Can't determine if unlock was successful.`);
                            return resolveSubmit(false);
                        }

                        // Get steamparental cookie and set it when request was successful
                        if (parsed.success) {
                            const steamparentalCookie = response.rawHeaders.find((e) => e.startsWith("steamparental="));

                            if (steamparentalCookie) {
                                // logger("debug", "unlockFamilyView() cookie header: " + steamparentalCookie);
                                this.community.setCookies([ steamparentalCookie.split(";")[0] ]);

                                logger("info", `[${this.logPrefix}] ${logger.colors.fggreen}Successfully unlocked family view and set cookie!`, false, false, null, true);
                                return resolveSubmit(true);
                            } else {
                                logger("error", `[${this.logPrefix}] Family view unlock request was declared as successful but Steam provided no steamparental cookie!`);
                            }
                        } else {
                            logger("error", `[${this.logPrefix}] Failed to unlock family view! Error: "${parsed.error_message}" (EResult ${parsed.eresult})`);
                        }
                    } else {
                        logger("warn", `[${this.logPrefix}] Failed to determine if family view unlock was successful because Steam returned an empty body.`, false, false, null, true);
                    }

                    resolveSubmit(false);
                }, "steamcommunity");
            });
        };


        // Check if we have a family view code cached and attempt to auto-unlock
        this._getFamilyViewCodeFromStorage(async (familyViewCode) => {
            let autoUnlockSuccessful = false;

            // Attempt to auto unlock if a cached code was found
            if (familyViewCode) {
                autoUnlockSuccessful = await submitToSteam(familyViewCode);
            }

            // If no code was found or the cached code didn't successfully unlock family view, read user input and attempt to unlock again
            if (!autoUnlockSuccessful) {
                readUserInput(async (input) => {
                    if (!input) {
                        return resolve(); // Abort
                    }

                    if (await submitToSteam(input)) {
                        this._saveFamilyViewCodeToStorage(input);
                    } else {
                        logger("info", `[${this.logPrefix}] Attempting to use account with locked family view anyway...`, false, false, null, true);
                    }

                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
};


/**
 * Internal - Attempts to get a cached family view code for this account from tokens.db
 * @param {function((string|null)): void} callback Called with `familyViewCode` (String) on success or `null` on failure
 */
Bot.prototype._getFamilyViewCodeFromStorage = function(callback) {

    this.data.tokensDB.findOne({ accountName: this.accountName }, (err, doc) => {
        if (err) {
            logger("warn", `Database error! Failed to check for cached family view code for accountName '${this.accountName}'!\nError: ${err}`, true);
            return callback(null);
        }

        if (doc && doc.familyViewCode) {
            logger("info", `[${this.logPrefix}] Found cached family view code in tokens.db. Attempting to auto-unlock family view by using it...`, false, true, logger.animation("loading"));

            callback(doc.familyViewCode);
        } else {
            logger("info", `[${this.logPrefix}] No cached family view code found in tokens.db. Cannot attempt to auto-unlock family view...`, false, true, logger.animation("loading"));

            callback(null);
        }
    });

};


/**
 * Internal - Saves a new family view code for this account to tokens.db
 * @param {string} familyViewCode The family view code to store
 */
Bot.prototype._saveFamilyViewCodeToStorage = function(familyViewCode) {
    logger("debug", `[${this.logPrefix}] _saveFamilyViewCodeToStorage(): Updating tokens.db entry for accountName '${this.accountName}'...`);

    // Update db entry for this account. Upsert is enabled so a new doc will be inserted if none exists yet
    this.data.tokensDB.updateAsync({ accountName: this.accountName }, { $set: { familyViewCode: familyViewCode } }, { upsert: true });
};
