/*
 * File: tokenStorageHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-10-10 12:53:20
 * Author: 3urobeat
 *
 * Last Modified: 2024-03-08 17:49:48
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SessionHandler = require("../sessionHandler.js");


/**
 * Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.
 * @returns {Promise.<boolean>} Resolves with `true` if a valid token was found, `false` otherwise
 */
SessionHandler.prototype.hasStorageValidToken = async function() {
    const res = await this.tokensdb.findOneAsync({ accountName: this.logOnOptions.accountName }, {});

    if (!res) return false;

    // Check if token is still valid
    const jwtObj = this.controller.data.decodeJWT(res.token);

    if (!jwtObj) return false;
    if (jwtObj.exp * 1000 <= Date.now()) return false;

    return true;
};


/**
 * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
 * @param {function(string|null): void} callback Called with `refreshToken` (String) on success or `null` on failure
 */
SessionHandler.prototype._getTokenFromStorage = function(callback) {

    // Search tokens database with accountName for a valid token so we can skip creating a new session
    this.tokensdb.findOne({ accountName: this.logOnOptions.accountName }, (err, doc) => {
        if (err) {
            logger("warn", `Database error! Failed to check for existing token for accountName '${this.logOnOptions.accountName}', returning null to get a new session. Please report this issue if it keeps occurring!\nError: ${err}`, true);
            return callback(null);
        }

        // If we still have a token stored then check if it is still valid
        if (doc) {
            // Decode the token we've found
            const jwtObj = this.controller.data.decodeJWT(doc.token);
            if (!jwtObj) return callback(null); // Get new session if _decodeJWT() failed

            // Define valid until str to use it in log msg
            const validUntilStr = `${(new Date(jwtObj.exp * 1000)).toISOString().replace(/T/, " ").replace(/\..+/, "")} (GMT time)`;

            // Compare expire value (unix timestamp in seconds) to current date
            if (jwtObj.exp * 1000 > Date.now()) {
                logger("debug", `[${this.bot.logPrefix}] Found valid token until '${validUntilStr}' in tokens.db! Logging in with it to reuse session...`, false, true);
                callback(doc.token);
            } else {
                logger("info", `[${this.bot.logPrefix}] Found invalid token in tokens.db. It was valid till '${validUntilStr}'. Logging in with credentials to get a new session...`, false, true, logger.animation("loading"));
                callback(null);
            }
        } else {
            logger("info", `[${this.bot.logPrefix}] No token found in tokens.db. Logging in with credentials to get a new session...`, false, true, logger.animation("loading"));
            callback(null);
        }
    });

};


/**
 * Internal - Saves a new token for this account to tokens.db
 * @param {string} token The refreshToken to store
 */
SessionHandler.prototype._saveTokenToStorage = function(token) {
    logger("debug", `[${this.bot.logPrefix}] _saveTokenToStorage(): Updating tokens.db entry for accountName '${this.logOnOptions.accountName}'...`);

    // Update db entry for this account. Upsert is enabled so a new doc will be inserted if none exists yet
    this.tokensdb.updateAsync({ accountName: this.logOnOptions.accountName }, { $set: { token: token } }, { upsert: true });
};


/**
 * Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.
 */
SessionHandler.prototype.invalidateTokenInStorage = function() {
    logger("debug", `[${this.bot.logPrefix}] invalidateTokenInStorage(): Removing refreshToken for accountName '${this.logOnOptions.accountName}' from tokens.db...`);

    this.tokensdb.removeAsync({ accountName: this.logOnOptions.accountName }, { multi: true });
};


// TODO: Add logic to this function when logininfo is available more easily (prob when controller is OOP and we don't need parameter passing)
// Note: Code is not checked for issues!
/**
 * Internal - Cleans out every expired key from tokens.db of accounts that are not currently used.
 */
/* SessionHandler.prototype._cleanTokenStorage = async function() {

    const docs = await this.tokensdb.findAsync({ $where: function () { return true if 'this.accountName' is not in logininfo } )

    const.forEach((e, i) => {

        // Decode the token we've found
        let jwtObj = this._decodeJWT(e.token);
        if (!jwtObj) return this.tokensdb.remove({ _id: e._id }); // Instantly remove entry if _decodeJWT() failed

        // Define valid until str to use it in log msg
        let validUntilStr = `${(new Date(jwtObj.exp * 1000)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)`;

        // Remove entry if token is expired
        if (jwtObj.exp * 1000 < Date.now()) {
            logger("debug", `_cleanTokenStorage(): Removed expired token of unused account '${e.accountName}' from tokens.db. It was valid until '${validUntilStr}'.`);
            this.tokensdb.remove({ _id: e._id });
        }
    })
} */
