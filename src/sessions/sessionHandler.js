/*
 * File: sessionHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 09.10.2022 12:47:27
 * Author: 3urobeat
 *
 * Last Modified: 26.03.2023 11:37:04
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser    = require("steam-user"); // eslint-disable-line
const SteamSession = require("steam-session"); // eslint-disable-line
const nedb         = require("@seald-io/nedb");

const controller = require("../controller/controller.js");
const loginfile  = require("../controller/login.js");


/**
 * Constructor - Object oriented approach for handling session for one account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Number} loginindex The loginindex of the calling account
 * @param {Object} logOnOptions Object containing username, password and optionally steamGuardCode
 */
const SessionHandler = function(bot, thisbot, loginindex, logOnOptions) {

    // Make parameters given to the constructor available
    this.bot          = bot;
    this.thisbot      = thisbot;
    this.loginindex   = loginindex;
    this.logOnOptions = logOnOptions;

    this.additionalaccinfo = loginfile.additionalaccinfo[loginindex];

    // Define vars that will be populated
    this.getTokenPromise = null; // Can be called from a helper later on
    this.session = null;

    // Load tokens database
    this.tokensdb = new nedb({ filename: srcdir + "/data/tokens.db", autoload: true });

    // Load helper files
    require("./events/sessionEvents");
    require("./helpers/handle2FA.js");
    require("./helpers/handleCredentialsLoginError");
    require("./helpers/tokenStorageHandler.js");

    // Run tokens database cleanup helper once for loginindex 0
    // if (loginindex == 0) this._cleanTokenStorage(); // TODO: Not implemented yet

};

// Make object accessible from outside
module.exports = SessionHandler;


/**
 * Handles getting a refresh token for steam-user to auth with
 * @returns {Promise} `refreshToken` on success or `null` on failure
 */
SessionHandler.prototype.getToken = function() { // I'm not allowed to use arrow styled functions here... (https://stackoverflow.com/questions/59344601/javascript-nodejs-typeerror-cannot-set-property-validation-of-undefined)
    return new Promise((resolve) => {
        logger("debug", `[${this.thisbot}] getToken(): Created new object for token request`);

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
 * @param {String} token The token to resolve with or null when account should be skipped
 */
SessionHandler.prototype._resolvePromise = function(token) {

    // Skip this account if token is null or stop bot if this is the main account
    if (!token) {
        if (this.loginindex == 0) {
            logger("", "", true);
            logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true);
            process.send("stop()");
            return;
        } else {
            logger("info", `[${this.thisbot}] Skipping account '${this.logOnOptions.accountName}'...`, true);

            loginfile.accisloggedin = true; // Set to true to log next account in

            controller.skippedaccounts.push(this.loginindex);
            loginfile.skippednow.push(this.loginindex);

            // Remove account from botobject & communityobject so that it won't be used for anything anymore (if it was logged in before, aka this being a relog)
            if (controller.botobject[String(this.loginindex)])       delete controller.botobject[String(this.loginindex)];
            if (controller.communityobject[String(this.loginindex)]) delete controller.communityobject[String(this.loginindex)];

            // Don't call cancelLoginAttempt() as this would result in an error because we aren't polling yet (https://github.com/DoctorMcKay/node-steam-session#polling)
        }
    } else {
        // Save most recent valid token to tokens.db
        this._saveTokenToStorage(token);
    }

    this.getTokenPromise(token);
};


/**
 * Internal - Attempts to log into account with credentials
 */
SessionHandler.prototype._attemptCredentialsLogin = function() {

    // TODO: Disabled until old login method using steam-user stops working so we can use the existing sentry files to make updating automatically possible

    // Init new session
    /* this.session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

    // Attach event listeners
    this._attachEvents();

    // Login with credentials supplied in logOnOptions
    this.session.startWithCredentials(this.logOnOptions)
        .then((res) => {
            if (res.actionRequired) this._handle2FA(res); // Let handle2FA helper handle 2FA if a code is requested
        })
        .catch((err) => {
            if (err) this._handleCredentialsLoginError(err); // Let handleCredentialsLoginError helper handle a login error
        }); */


    // TODO: Remove all of this when old login method stops working and enable the block above
    /* ---- Login using old login style until it stops working (if a refreshToken was already saved in the db then it was already used for logging in and we wouldn't be here) ---- */

    let parent = this; // Quick hack to make this accessible inside the functions below

    // Attach old steamGuard event here, get code but supply it to the new system instead of the old one
    this.bot.on("steamGuard", () => {
        logger("debug", `[${parent.thisbot}] steam-user has no sentry file stored for '${parent.logOnOptions.accountName}', transferring login request to the new system...`);

        // Get 2FA input (c&p from handle2FA, didn't want to modify it with callback stuff for this temp solution)

        function get2FAUserInput(callback) {
            // Start timer to subtract it later from readyafter time
            var steamGuardInputStart = Date.now(); // Measure time to subtract it later from readyafter time

            // Define different question and timeout for main account as it can't be skipped
            let question;
            let timeout;

            if (parent.loginindex == 0) {
                question = `[${parent.logOnOptions.accountName}] Steam Guard Code: `;
                timeout = 0;
            } else {
                question = `[${parent.logOnOptions.accountName}] Steam Guard Code (leave empty and press ENTER to skip account): `;
                timeout = 90000;
            }

            // Ask user for code
            logger.readInput(question, timeout, (text) => {
                if (!text || text == "") { // No response or manual skip

                    if (text == null) logger("info", "Skipping account because you didn't respond in 1.5 minutes...", true); // No need to check for main acc as timeout is disabled for it

                    if (parent.loginindex == 0) { // First account can't be skipped, ask again
                        logger("warn", "The first account always has to be logged in!", true);

                        setTimeout(() => {
                            get2FAUserInput(callback); // Run myself again, pass top level callback down the callstack
                        }, 500);
                    } else { // Skip account if not bot0
                        logger("info", `[${parent.thisbot}] steamGuard input empty, skipping account...`, false, true, logger.animation("loading"));

                        parent._resolvePromise(null);
                        return;
                    }
                } else { // User entered code
                    logger("info", `[${parent.thisbot}] Accepting Steam Guard Code...`, false, true, logger.animation("loading"));

                    callback(text.toString().trim()); // Pass code to back
                }

                loginfile.steamGuardInputTimeFunc(Date.now() - steamGuardInputStart); // Measure time and subtract it from readyafter time
            });
        }

        // Get code input, but supply code to new login system instead of the old one
        get2FAUserInput((code) => {
            logger("info", "If this account uses E-Mail Steam Guard then you might receive a second E-Mail from Steam which you can ignore.", false, false, null, true); // https://github.com/DoctorMcKay/node-steam-session/issues/2

            parent.session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

            parent._attachEvents();

            parent.logOnOptions.steamGuardCode = code; // Modify steamGuardCode obj with code we obtained so the user won't get a second email for the following login request
            clearTimeout(resolvePromiseTimeout);

            parent.session.startWithCredentials(parent.logOnOptions)
                .then((res) => {
                    if (res.actionRequired) {
                        logger("warn", "You shouldn't see this message. steam-session still wants a code but we supplied one? Skipping account to not soft-lock the bot...", false, false, null, true); // This should be impossible because we supplied a 2fa code}
                        parent._resolvePromise(null);
                    }
                })
                .catch((err) => {
                    if (err) parent._handleCredentialsLoginError(err); // Let handleCredentialsLoginError helper handle a login error
                });
        });
    });

    // Quick hack to resolve the promise if no steam guard event was fired
    let resolvePromiseTimeout = setTimeout(() => {
        logger("debug", `[${this.thisbot}] Looks like steam-user still had a sentry file stored for '${this.logOnOptions.accountName}', resolving promise with null`);
        this.getTokenPromise(null);
    }, 180000); // 3 min

    logger("debug", `[${this.thisbot}] Attached resolvePromiseTimeout, calling logOn() with credentials now...`);

    // Call unresponsive login helper (if not done already by relogAccount) to detect and force progress if this login attempt should get stuck
    if (!controller.relogQueue.includes(this.loginindex)) require("../bot/helpers/handleLoginTimeout.js").handleLoginTimeout(this.loginindex, this.thisbot, this.logOnOptions, this.bot, this.additionalaccinfo.thisproxy);

    // Call logOn() of steam-user if not using a shared_secret as that seems to fail now: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/152
    // Either it works instantly because we still have a sentry file stored, otherwise if the steamGuard event fires we just transfer to the new system to get a refreshToken
    if (this.logOnOptions.steamGuardCode) {
        logger("debug", `[${this.thisbot}] Account has a shared_secret, going straight to the new login system to avoid issue #152...`);

        this.session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

        this._attachEvents();

        this.session.startWithCredentials(this.logOnOptions)
            .then((res) => {
                if (res.actionRequired) this._handle2FA(res); // Let handle2FA helper handle 2FA if a code is requested
            })
            .catch((err) => {
                if (err) this._handleCredentialsLoginError(err); // Let handleCredentialsLoginError helper handle a login error
            });
    } else {
        this.bot.logOn(this.logOnOptions);
    }

};


/* ------------ Reference helper functions to let the IntelliSense know about them ------------ */

/**
 * Internal: Attaches listeners to all steam-session events we care about
 */
SessionHandler.prototype._attachEvents = function() {};

/**
 * Internal - Handles submitting 2FA code
 * @param {Object} res Response object from startWithCredentials() promise
 */
SessionHandler.prototype._handle2FA = function(res) {}; // eslint-disable-line

// Helper function to get 2FA code from user and passing it to accept function or skipping account if desired
SessionHandler.prototype._get2FAUserInput = function() {};

// Helper function to make accepting and re-requesting invalid steam guard codes easier
SessionHandler.prototype._acceptSteamGuardCode = function(code) {}; // eslint-disable-line

// Helper function to make handling login errors easier
SessionHandler.prototype._handleCredentialsLoginError = function(err) {}; // eslint-disable-line

/**
 * External - Sets interval that checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
 */
SessionHandler.prototype.detectExpiringTokens = (botobject, logininfo) => {}; // eslint-disable-line

// Helper function which decodes a JsonWebToken - https://stackoverflow.com/a/38552302
SessionHandler.prototype._decodeJWT = function(token) {}; // eslint-disable-line

/**
 * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
 * @param {function} [callback] Called with `refreshToken` (String) on success or `null` on failure
 */
SessionHandler.prototype._getTokenFromStorage = function(callback) {}; // eslint-disable-line

/**
 * Internal - Saves a new token for this account to tokens.db
 * @param {String} token The refreshToken to store
 */
SessionHandler.prototype._saveTokenToStorage = function(token) {}; // eslint-disable-line

/**
 * External - Removes the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.
 */
SessionHandler.prototype.invalidateTokenInStorage = function() {};
