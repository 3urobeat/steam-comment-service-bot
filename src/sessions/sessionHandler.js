/*
 * File: sessionHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 09.10.2022 12:47:27
 * Author: 3urobeat
 * 
 * Last Modified: 09.10.2022 22:23:00
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamSession = require("steam-session");

const controller = require("../controller/controller.js");
const loginfile  = require("../controller/login.js");


/**
 * Constructor - Object oriented approach for handling session for one account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Number} loginindex The loginindex of the calling account
 * @param {Object} logOnOptions Object containing username, password and optionally steamGuardCode
 */
const sessionHandler = function(thisbot, loginindex, logOnOptions) {

    // Make parameters given to the constructor available
    this.thisbot      = thisbot;
    this.loginindex   = loginindex;
    this.logOnOptions = logOnOptions;

    this.additionalaccinfo = loginfile.additionalaccinfo[loginindex];

    // Define vars that will be populated
    this.getTokenPromise = null; // Can be called from a helper later on
    this.session = null;

    // Load helper files
    require("./events/sessionEvents");
    require("./helpers/handle2FA.js");
    require("./helpers/handleCredentialsLoginError");

};

// Make object accessible from outside
module.exports = sessionHandler;


/**
 * Handles getting a refresh token for steam-user to auth with
 * @returns {Promise} `refreshToken` on success or `null` on failure
 */
sessionHandler.prototype.getToken = function() { // I'm not allowed to use arrow styled functions here... (https://stackoverflow.com/questions/59344601/javascript-nodejs-typeerror-cannot-set-property-validation-of-undefined)
    return new Promise((resolve) => {
        logger("debug", `[${this.thisbot}] getToken(): Created new object for token request`);

        // Save promise resolve function so any other function of this object can resolve the promise itself 
        this.getTokenPromise = resolve;

        // Start first attempt of logging in
        this._attemptCredentialsLogin();
    })
}


/**
 * Internal - Handles resolving the getToken() promise and skipping the account if necessary
 * @param {String} token The token to resolve with or null when account should be skipped
 */
sessionHandler.prototype._resolvePromise = function(token) {
    
    // Skip this account if token is null or stop bot if this is the main account
    if (!token) {
        if (this.loginindex == 0) {
            logger("", "", true);
            logger("error", "Aborting because the first bot account always needs to be logged in!\nPlease correct what caused the error and try again.", true);
            process.send("stop()");
            return;
        } else {
            logger("info", `[${this.thisbot}] Skipping account '${this.logOnOptions.accountName}'...`, true);

            loginfile.accisloggedin = true; //set to true to log next account in

            controller.skippedaccounts.push(this.loginindex);
            loginfile.skippednow.push(this.loginindex);
        }
    }

    this.getTokenPromise(token);
}


/**
 * Internal - Attempts to log into account with credentials
 */
sessionHandler.prototype._attemptCredentialsLogin = function() {

    // Count this attempt
    this.additionalaccinfo.logOnTries++

    // Init new session
    this.session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

    // Attach event listeners
    this._attachEvents();

    // Login with credentials supplied in logOnOptions
    this.session.startWithCredentials(this.logOnOptions)
        .then((res) => {
            if (res.actionRequired) this._handle2FA(res); // Let handle2FA helper handle 2FA if a code is requested
        })
        .catch((err) => {
            if (err) this._handleCredentialsLoginError(err); // Let handleCredentialsLoginError helper handle a login error
        })
}