/*
 * File: handleExpiringTokens.js
 * Project: steam-comment-service-bot
 * Created Date: 14.10.2022 14:58:25
 * Author: 3urobeat
 *
 * Last Modified: 12.09.2023 21:49:55
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager.js");


/**
 * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
 */
DataManager.prototype._startExpiringTokensCheckInterval = function() {
    let _this = this;

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    async function scanDatabase() {
        logger("debug", "DataManager detectExpiringTokens(): Scanning tokens.db for expiring tokens...");

        let expiring = {};
        let expired  = {};

        // Get all tokens & bots
        let docs = await _this.tokensDB.findAsync({});
        if (docs.length == 0) return;

        let bots = _this.controller.getBots("*", true);

        // Loop over all docs and attempt to renew their token. Notify the bot owners if Steam did not issue a new one
        _this.controller.misc.syncLoop(docs.length, async (loop, i) => {
            let e        = docs[i];
            let tokenObj = _this.decodeJWT(e.token);
            let thisbot  = bots[e.accountName];

            // Check if decoding failed
            if (!tokenObj) {
                logger("warn", `Failed to check when the login token for account '${e.accountName}' is going to expire!`);
                loop.next();
                return;
            }

            // Skip iteration if token does not expire in <= 7 days or if the corresponding bot object does not exist (aka no login credentials are currently available)
            if (tokenObj.exp * 1000 > Date.now() + 604800000 || !thisbot) return loop.next();


            // Attempt to renew the token automatically and check if it succeeded
            let newToken = await thisbot.sessionHandler.attemptTokenRenew();

            tokenObj = _this.decodeJWT(newToken);


            // Check if renew was successful in logindelay ms to avoid multiple fast renewals getting us blocked
            setTimeout(() => {
                if (tokenObj.exp * 1000 > Date.now() + 604800000) return loop.next(); // Skip to next iteration if renew was successful

                // Always push to expiring and also to expired if token already expired
                expiring[e.accountName] = thisbot;

                if (tokenObj.exp * 1000 <= Date.now()) expired[e.accountName] = thisbot;

                loop.next();
            }, _this.advancedconfig.logindelay);

        }, () => { // Loop exit function

            // Ignore if all tokens have been automatically renewed
            if (Object.keys(expiring).length == 0) return;

            let msg;

            // Make it fancy and define different messages depending on how many accs were found
            if (Object.keys(expiring).length > 1) msg = `The login tokens of ${Object.keys(expiring).length} accounts are expiring in less than 7 days`;
                else msg = `The login token of account '${Object.values(expiring)[0].accountName}' is expiring in less than 7 days`;

            // Mention how many accounts already expired
            if (Object.keys(expired).length > 1) msg += ` and ${logger.colors.fgred}${Object.keys(expired).length} accounts have already expired!${logger.colors.reset}\nRestarting will force you to type in their Steam Guard Codes`; // Append
                else if (Object.keys(expired).length == 1) msg = `The login token of account '${Object.values(expiring)[0].accountName}' ${logger.colors.fgred}has expired!${logger.colors.reset} Restarting will force you to type in the Steam Guard Code`; // Overwrite

            // Log warning and message owners
            logger("", `${logger.colors.fgred}Warning:`);
            logger("", msg + "!", true);

            _this.cachefile.ownerid.forEach((e, i) => {
                setTimeout(() => {
                    // eslint-disable-next-line no-control-regex
                    _this.controller.main.sendChatMessage(_this.controller.main, { userID: e }, msg.replace(/\x1B\[[0-9]+m/gm, "") + "!\nHead over to the terminal to refresh the token(s) now if you wish."); // Remove color codes from string
                }, 1500 * i);
            });

            // Check for active requests before asking for relog
            _this._askForGetNewToken(expiring);
        });
    }


    // Clear existing interval if there is one
    if (this._handleExpiringTokensInterval) clearInterval(this._handleExpiringTokensInterval);

    // Set interval to scan every 24 hours
    let lastScanTime = Date.now();

    this._handleExpiringTokensInterval = setInterval(() => {
        if (lastScanTime + 86400000 > Date.now()) return; // Abort if last run was less than 24h ago

        scanDatabase();
        lastScanTime = Date.now(); // Update var tracking timestamp of last execution
    }, 21600000); // 6h in ms - Intentionally so low to prevent function from only running every 48h should interval get unprecise over time
};


/**
 * Internal: Asks user if they want to refresh the tokens of all expiring accounts when no active request was found and relogs them
 * @param {object} expiring Object of botobject entries to ask user for
 */
DataManager.prototype._askForGetNewToken = function(expiring) {
    let EStatus = require("../../bot/EStatus.js"); // Import not at top scope as this can be undefined because this helper file gets loaded before updater ran
    let _this   = this;

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    function askForRelog() { // TODO: Add support for asking in steam chat

        // Ask for all accounts once
        logger.readInput(`\nWould you like to submit the Steam Guard Codes now to refresh the login tokens of ${Object.keys(expiring).length} accounts? [y/N] `, 90000, (input) => {
            if (input) {
                if (input.toLowerCase() == "y") {

                    // Invalidate all tokens and log off if still online
                    Object.values(expiring).forEach((e, i) => {
                        if (e.status == EStatus.ONLINE) e.user.logOff(); // Disconnected event won't trigger because activeLogin is already true

                        _this.controller._statusUpdateEvent(e, EStatus.OFFLINE); // Set status of this account to offline

                        e.sessionHandler.invalidateTokenInStorage(); // Invalidate token in storage

                        // Check for last iteration and trigger login
                        if (i + 1 == Object.values(expiring).length) {
                            _this.controller.info.activeLogin = false; // Quick hack so that login() won't ignore our request, this will be updated again instantly and was only false to block new requests
                            _this.controller.login();
                        }
                    });

                } else {
                    logger("info", "Asking again in 24 hours...");

                    _this.controller.info.activeLogin = false; // Allow requests again
                }
            } else {
                logger("info", "Stopped waiting because you didn't respond in 1.5 minutes. Asking again in 24 hours...");

                _this.controller.info.activeLogin = false; // Allow requests again
            }
        });

    }


    // Block new requests from happening. This will also block the disconnected event from executing when we call logOff() in a sec
    this.controller.info.activeLogin = true;

    // Check for an active request before asking user for relog
    logger("debug", "DataManager _askForGetNewToken(): Checking for active requests...");

    let objlength = Object.keys(this.controller.activeRequests).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

    if (Object.keys(this.controller.activeRequests).length == 0) askForRelog(); // Don't bother with loop below if obj is empty

    Object.keys(this.controller.activeRequests).forEach((e, i) => { // Loop over obj to filter invalid/expired entries
        if (this.controller.activeRequests[e].status != "active" || Date.now() > this.controller.activeRequests[e].until + (_this.config.botaccountcooldown * 60000)) { // Check if status is not active or if entry is finished (realistically the status can't be active and finished but it won't hurt to check both to avoid a possible bug)
            delete this.controller.activeRequests[e]; // Remove entry from object
        }

        if (i == objlength - 1) {
            if (Object.keys(this.controller.activeRequests).length > 0) { // Check if obj is still not empty and recursively call this function again
                logger("info", "Waiting for an active request to finish...", false, true, logger.animation("waiting"));

                setTimeout(() => { // Wait 2.5 sec and check again
                    this._askForGetNewToken(expiring); // TODO: Is recursion really the best idea here? Edit: No! Should be possible with an interval but I'll wait till this is a helper function
                }, 2500);

            } else { // If the obj is now empty then lets continue

                // Ask user if he/she wants to refresh the tokens now
                askForRelog();
            }
        }
    });
};
