/*
 * File: sessionHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 09.10.2022 12:47:27
 * Author: 3urobeat
 *
 * Last Modified: 05.10.2023 19:34:45
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamSession = require("steam-session"); // eslint-disable-line

const Bot     = require("../bot/bot.js"); // eslint-disable-line
const EStatus = require("../bot/EStatus.js");


/**
 * Constructor - Object oriented approach for handling session for one account
 * @class
 * @param {Bot} bot The bot object of this account
 */
const SessionHandler = function(bot) {

    // Make parameters given to the constructor available
    this.bot        = bot;
    this.controller = bot.controller;

    // Define vars that will be populated
    this.getTokenPromise = null; // Can be called from a helper later on
    this.session         = null;

    // Make accessing tokensDB & logOnOptions of this account shorter
    this.tokensdb     = bot.controller.data.tokensDB;
    this.logOnOptions = bot.loginData.logOnOptions;

    // Load helper files
    require("./events/sessionEvents");
    require("./helpers/handle2FA.js");
    require("./helpers/handleCredentialsLoginError");
    require("./helpers/tokenStorageHandler.js");

    // Run tokens database cleanup helper once for loginindex 0
    // if (this.bot.index == 0) this._cleanTokenStorage(); // TODO: Not implemented yet

};

// Make object accessible from outside
module.exports = SessionHandler;


/**
 * Handles getting a refresh token for steam-user to auth with
 * @returns {Promise.<string|null>} `refreshToken` on success or `null` on failure
 */
SessionHandler.prototype.getToken = function() { // I'm not allowed to use arrow styled functions here... (https://stackoverflow.com/questions/59344601/javascript-nodejs-typeerror-cannot-set-property-validation-of-undefined)
    return new Promise((resolve) => {
        logger("debug", `[${this.bot.logPrefix}] getToken(): Attempting to find token for '${this.bot.loginData.logOnOptions.accountName}' in tokens.db...`);

        // Save promise resolve function so any other function of this object can resolve the promise itself
        this.getTokenPromise = resolve;

        // First ask tokenStorageHandler if we already have a valid token for this account in storage
        this._getTokenFromStorage((token) => {
            // Instantly resolve promise if we still have a valid token on hand, otherwise start credentials login flow
            if (token) {
                resolve(token);
            } else {
                this._attemptCredentialsLogin(); // Start first attempt of logging in
            }
        });
    });
};


/**
 * Internal - Handles resolving the getToken() promise and skipping the account if necessary
 * @param {string} token The token to resolve with or null when account should be skipped
 */
SessionHandler.prototype._resolvePromise = function(token) {

    // Skip this account if token is null or stop bot if this is the main account
    if (!token) {
        if (this.bot.index == 0) {
            logger("", "", true);
            logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true);
            this.controller.stop();
            return;
        } else {
            logger("info", `[${this.bot.logPrefix}] Skipping account '${this.logOnOptions.accountName}'...`, true);

            this.controller._statusUpdateEvent(this.bot, EStatus.SKIPPED);
            this.controller.info.skippedaccounts.push(this.bot.loginData.logOnOptions.accountName);

            // Don't call cancelLoginAttempt() as this would result in an error because we aren't polling yet (https://github.com/DoctorMcKay/node-steam-session#polling)
        }
    } else {
        // Save most recent valid token to tokens.db
        this._saveTokenToStorage(token);
    }

    this.bot.loginData.waitingFor2FA = false; // Allow handleLoginTimeout to work again

    this.getTokenPromise(token);

};


/**
 * Internal - Attempts to log into account with credentials
 */
SessionHandler.prototype._attemptCredentialsLogin = function() {

    // Init new session
    this.session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient, { httpProxy: this.bot.loginData.proxy });

    // Attach event listeners
    this._attachEvents();

    // Login with credentials supplied in logOnOptions
    this.session.startWithCredentials(this.logOnOptions)
        .then((res) => {
            if (res.actionRequired) this._handle2FA(res); // Let handle2FA helper handle 2FA if a code is requested
        })
        .catch((err) => {
            if (err) this._handleCredentialsLoginError(err); // Let handleCredentialsLoginError helper handle a login error
        });

};


/**
 * Attempts to renew the refreshToken used for the current session. Whether a new token will actually be issued is at the discretion of Steam.
 * @returns {Promise.<boolean>} Returns a promise which resolves with `true` if Steam issued a new token, `false` otherwise. Rejects if no token is stored in the database.
 */
SessionHandler.prototype.attemptTokenRenew = function() {
    return new Promise((resolve, reject) => {

        // Init new session
        this.session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient, { httpProxy: this.bot.loginData.proxy });

        // Get and set current refresh token
        this._getTokenFromStorage(async (storedToken) => {
            if (!storedToken) return reject(new Error("There is no token stored for this account"));

            this.session.refreshToken = storedToken;

            // Attempt to renew token
            this.session.renewRefreshToken()
                .then((res) => {
                    if (!res) {
                        logger("warn", `[${this.bot.logPrefix}] Failed to renew refresh token: Steam did not issue a new one`);
                        resolve(res);
                        return;
                    }

                    let newToken      = this.session.refreshToken;
                    let jwtObj        = this.controller.data.decodeJWT(newToken); // Decode the token we've found
                    let validUntilStr = `${(new Date(jwtObj.exp * 1000)).toISOString().replace(/T/, " ").replace(/\..+/, "")} (GMT time)`;

                    logger("info", `[${this.bot.logPrefix}] Successfully renewed refresh token! It is now valid until '${validUntilStr}'!`);

                    // Save token to the database
                    this._saveTokenToStorage(newToken);

                    resolve(res);
                })
                .catch((err) => {
                    logger("error", `[${this.bot.logPrefix}] Failed to renew refresh token! Error: ${err}`);

                    reject(err);
                });
        });

    });
};


/* ------------ Reference helper functions to let the IntelliSense know about them ------------ */

/**
 * Internal: Attaches listeners to all steam-session events we care about
 */
SessionHandler.prototype._attachEvents = function() {};

/**
 * Internal: Handles submitting 2FA code
 * @param {object} res Response object from startWithCredentials() promise
 */
SessionHandler.prototype._handle2FA = function(res) {}; // eslint-disable-line

/**
 * Internal: Helper function to get 2FA code from user and passing it to accept function or skipping account if desired
 */
SessionHandler.prototype._get2FAUserInput = function() {};

/**
 * Internal: Helper function to make accepting and re-requesting invalid steam guard codes easier
 * @param {string} code Input from user
 */
SessionHandler.prototype._acceptSteamGuardCode = function(code) {}; // eslint-disable-line

/**
 * Helper function to make handling login errors easier
 * @param {*} err Error thrown by startWithCredentials()
 */
SessionHandler.prototype._handleCredentialsLoginError = function(err) {}; // eslint-disable-line

/**
 * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
 * @param {function(string|null): void} callback Called with `refreshToken` (String) on success or `null` on failure
 */
SessionHandler.prototype._getTokenFromStorage = function(callback) {}; // eslint-disable-line

/**
 * Internal - Saves a new token for this account to tokens.db
 * @param {string} token The refreshToken to store
 */
SessionHandler.prototype._saveTokenToStorage = function(token) {}; // eslint-disable-line

/**
 * Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.
 */
SessionHandler.prototype.invalidateTokenInStorage = function() {};
