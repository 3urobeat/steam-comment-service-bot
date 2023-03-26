/*
 * File: handleExpiringTokens.js
 * Project: steam-comment-service-bot
 * Created Date: 14.10.2022 14:58:25
 * Author: 3urobeat
 *
 * Last Modified: 26.03.2023 17:23:32
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager.js");
const Controller  = require("../../controller/controller.js");
const mainfile    = require("../../bot/main.js");


/**
 * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
 */
DataManager.prototype._startExpiringTokensCheckInterval = function() {
    let _this = this;

    function scanDatabase() {
        logger("debug", "DataManager: detectExpiringTokens(): Scanning tokens.db for expiring tokens...");

        let expiring = {};
        let expired  = {};

        _this.tokensDB.find({}, (err, docs) => { // Find all documents
            docs.forEach((e, i) => { // Check every document

                let tokenObj = _this.decodeJWT(e.token);

                if (tokenObj) { // Only try to check acc if no error occurred (Code lookin funky cuz I can't use return here as the last iteration check would otherwise abort)
                    // Check if token expires in <= 7 days and add it to counter
                    if (tokenObj.exp * 1000 <= Date.now() + 604800000) {
                        let vals  = Object.values(_this.logininfo);
                        let index = vals.indexOf(vals.find(f => f[0] == e.accountName)); // Get index of the affected account

                        // If index is -1 then the account found in tokens.db is not currently being used and thus we can ignore it
                        if (index >= 0) expiring[index] = _this.controller.bots[index]; // Push the bot object of the expiring account to our array

                        // Check if token already expired and push to expired array as well to show separate warning message
                        if (tokenObj.exp * 1000 <= Date.now()) {
                            expired[index] = _this.controller.bots[index];
                        }
                    }
                } else {
                    logger("warn", `Failed to check when the login token for account '${e.accountName}' is going to expire!`);
                }

                // Check if this was the last iteration and display message if at least one account was found
                if (i + 1 == docs.length && Object.keys(expiring).length > 0) {
                    let msg;

                    // Make it fancy and define different messages depending on how many accs were found
                    if (Object.keys(expiring).length > 1) msg = `The login tokens of ${Object.keys(expiring).length} accounts are expiring in less than 7 days`;
                        else msg = `The login token of account '${e.accountName}' is expiring in less than 7 days`;

                    // Mention how many accounts already expired
                    if (Object.keys(expired).length > 1) msg += ` and ${logger.colors.fgred}${Object.keys(expired).length} accounts have already expired!${logger.colors.reset}\nRestarting will force you to type in their Steam Guard Codes`; // Append
                        else if (Object.keys(expired).length == 1) msg = `The login token of account '${e.accountName}' ${logger.colors.fgred}has expired!${logger.colors.reset} Restarting will force you to type in the Steam Guard Code`;    // Overwrite

                    // Log warning and message owners
                    logger("", `${logger.colors.fgred}Warning:`);
                    logger("", msg + "!", true);

                    _this.cachefile.ownerid.forEach((e, i) => {
                        setTimeout(() => {
                            // eslint-disable-next-line no-control-regex
                            this.controller.main.chat.sendFriendMessage(e, msg.replace(/\x1B\[[0-9]+m/gm, "") + "!\nHead over to the terminal to refresh the token(s) now if you wish."); // Remove color codes from string
                        }, 1500 * i);
                    });

                    // Block new comment requests from happening
                    Controller.activeRelog = true;

                    // Check for active comment processes before asking for relog
                    _this._askForGetNewToken(expiring);
                }

            });
        });
    }

    // Set interval to scan every 24 hours
    let lastScanTime = Date.now();

    setInterval(() => {
        if (lastScanTime + 86400000 > Date.now()) return; // Abort if last run was less than 24h ago

        scanDatabase();
        lastScanTime = Date.now(); // Update var tracking timestamp of last execution
    }, 21600000); // 6h in ms - Intentionally so low to prevent function from only running every 48h should interval get unprecise over time

};


/**
 * Internal: Asks user if he/she wants to refresh the tokens of all expiring accounts when no active comment process was found and sends them to the relogQueue
 * @param {Object} expiring Object of botobject entries to ask user for
 */
DataManager.prototype._askForGetNewToken = function(expiring) {
    let _this = this;

    function askForRelog() {

        // Ask for all accounts once
        logger.readInput(`\nWould you like to submit the Steam Guard Codes now to refresh the login tokens of ${Object.keys(expiring).length} accounts? [y/N] `, 90000, (input) => {
            if (input) {
                if (input.toLowerCase() == "y") {

                    // Invalidate tokens and call relogAccount for each account
                    Object.keys(expiring).forEach((e, i) => {
                        let loginindex = Number(e);

                        // Invalidate existing token so the SessionHandler will do a credentials login to get a new token
                        _this.controller.bots[loginindex].sessionHandler.invalidateTokenInStorage();

                        // Push account into relog queue without advancedconfig.relogTimeout, relogAccount.js will handle getting a new session etc.
                        require("../../bot/helpers/relogAccount.js").run(loginindex, _this.logininfo[loginindex], expiring[i]); // TODO: Call from corresponding bot object

                        // Note: activeRelog is set to false again by webSession if relogQueue is empty
                    });
                } else {
                    logger("info", "Asking again in 24 hours...");

                    Controller.activeRelog = false; // Allow comment requests again
                }
            } else {
                logger("info", "Stopped waiting because you didn't respond in 1.5 minutes. Asking again in 24 hours...");

                Controller.activeRelog = false; // Allow comment requests again
            }
        });

    }


    // Check for an active comment process before asking user for relog
    logger("debug", "DataManager _askForGetNewToken(): Checking for active comment process...");

    let objlength = Object.keys(mainfile.activecommentprocess).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

    if (Object.keys(mainfile.activecommentprocess).length == 0) askForRelog(); // Don't bother with loop below if acp obj is empty

    Object.keys(mainfile.activecommentprocess).forEach((e, i) => { // Loop over obj to filter invalid/expired entries
        if (mainfile.activecommentprocess[e].status != "active" || Date.now() > mainfile.activecommentprocess[e].until + (_this.config.botaccountcooldown * 60000)) { // Check if status is not active or if entry is finished (realistically the status can't be active and finished but it won't hurt to check both to avoid a possible bug)
            delete mainfile.activecommentprocess[e]; // Remove entry from object
        }

        if (i == objlength - 1) {
            if (Object.keys(mainfile.activecommentprocess).length > 0) { // Check if obj is still not empty and recursively call this function again
                logger("info", "Waiting for an active comment process to finish...", false, true, logger.animation("waiting"));

                setTimeout(() => { // Wait 2.5 sec and check again
                    this._askForGetNewToken(expiring); // TODO: Is recursion really the best idea here?
                }, 2500);

            } else { // If the obj is now empty then lets continue

                // Ask user if he/she wants to refresh the tokens now
                askForRelog();
            }
        }
    });
};
