/*
 * File: handleExpiringTokens.js
 * Project: steam-comment-service-bot
 * Created Date: 14.10.2022 14:58:25
 * Author: 3urobeat
 *
 * Last Modified: 26.03.2023 10:51:26
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const nedb = require("@seald-io/nedb");

const controller = require("../../controller/controller.js");
const mainfile   = require("../../bot/main.js");


// Internal - Helper function which decodes a JsonWebToken - https://stackoverflow.com/a/38552302 (c&p from SessionHandler)
function _decodeJWT(token) {
    let payload = token.split(".")[1];            // Remove header and signature as we only care about the payload
    let decoded = Buffer.from(payload, "base64"); // Decode

    // Try to parse json object
    try {
        let parsed = JSON.parse(decoded.toString());
        return parsed;
    } catch (err) {
        logger("err", `Failed to decode JWT! Error: ${err}`, true);
        return null;
    }
}

/**
 * External - Sets interval that checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
 * @param {Object} botobject The botobject
 * @param {Object} logininfo The logininfo object imported in login.js
 */
module.exports.detectExpiringTokens = (botobject, logininfo) => {

    function scanDatabase() {
        logger("debug", "detectExpiringTokens(): Scanning tokens.db for expiring tokens...");

        let expiring = {};
        let expired  = {};
        let tokensdb = new nedb({ filename: srcdir + "/data/tokens.db", autoload: true }); // TODO: Access tokensdb from controller obj

        // TODO: Access _decodeJWT() from bot.sessionHandler
        tokensdb.find({}, (err, docs) => { // Find all documents
            docs.forEach((e, i) => { // Check every document

                let tokenObj = _decodeJWT(e.token);

                if (tokenObj) { // Only try to check acc if no error occurred (Code lookin funky cuz I can't use return here as the last iteration check would otherwise abort)
                    // Check if token expires in <= 7 days and add it to counter
                    if (tokenObj.exp * 1000 <= Date.now() + 604800000) {
                        let vals  = Object.values(logininfo);
                        let index = vals.indexOf(vals.find(f => f[0] == e.accountName)); // Get index of the affected account

                        // If index is -1 then the account found in tokens.db is not currently being used and thus we can ignore it
                        if (index >= 0) expiring[index] = botobject[index]; // Push the bot object of the expiring account to our array

                        // Check if token already expired and push to expired array as well to show separate warning message
                        if (tokenObj.exp * 1000 <= Date.now()) {
                            expired[index] = botobject[index];
                        }
                    }
                } else {
                    logger("err", `Failed to check when the login token for account '${e.accountName}' is going to expire!`);
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

                    cachefile.ownerid.forEach((e, i) => {
                        setTimeout(() => {
                            // eslint-disable-next-line no-control-regex
                            botobject[0].chat.sendFriendMessage(e, msg.replace(/\x1B\[[0-9]+m/gm, "") + "!\nHead over to the terminal to refresh the token(s) now if you wish."); // Remove color codes from string
                        }, 1500 * i);
                    });

                    // Block new comment requests from happening
                    controller.activeRelog = true;

                    // Check for active comment processes before asking for relog
                    _checkForActiveCommentProcesses(expiring, logininfo);
                }
            });
        });
    }

    // Scan once on startup
    scanDatabase();

    // Set interval to scan every 24 hours
    let lastScanTime = Date.now();

    setInterval(() => {
        if (lastScanTime + 86400000 > Date.now()) return; // Abort if last run was less than 24h ago

        scanDatabase();
        lastScanTime = Date.now(); // Update var tracking timestamp of last execution
    }, 21600000); // 6h in ms - Intentionally so low to prevent function from only running every 48h should interval get unprecise over time

};


// Internal - Helper function to check for active comment processes
function _checkForActiveCommentProcesses(expiring, logininfo) {
    let objlength = Object.keys(mainfile.activecommentprocess).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

    logger("debug", "_checkForActiveCommentProcesses(): Checking...");

    if (Object.keys(mainfile.activecommentprocess).length == 0) _askForGetNewTokenNow(expiring, logininfo); // Don't bother with loop below if acp obj is empty

    Object.keys(mainfile.activecommentprocess).forEach((e, i) => { // Loop over obj to filter invalid/expired entries
        if (mainfile.activecommentprocess[e].status != "active" || Date.now() > mainfile.activecommentprocess[e].until + (config.botaccountcooldown * 60000)) { // Check if status is not active or if entry is finished (realistically the status can't be active and finished but it won't hurt to check both to avoid a possible bug)
            delete mainfile.activecommentprocess[e]; // Remove entry from object
        }

        if (i == objlength - 1) {
            if (Object.keys(mainfile.activecommentprocess).length > 0) { // Check if obj is still not empty and recursively call this function again
                logger("info", "Waiting for an active comment process to finish...", false, true, logger.animation("waiting"));

                setTimeout(() => { // Wait 2.5 sec and check again
                    _checkForActiveCommentProcesses(expiring, logininfo);
                }, 2500);

            } else { // If the obj is now empty then lets continue

                // Ask user if he/she wants to refresh the tokens now
                _askForGetNewTokenNow(expiring, logininfo);
            }
        }
    });
}


/**
 * Internal - Handles asking user if he/she wants to refresh the tokens of all expiring accounts
 * @param {Object} expiring Object of botobject entries to ask user for
 */
function _askForGetNewTokenNow(expiring, logininfo) {

    // Ask for all accounts once, if user says yes ask for each individual account
    logger.readInput(`\nWould you like to submit the Steam Guard Codes now to refresh the login tokens of ${Object.keys(expiring).length} accounts? [y/N] `, 90000, (input) => {
        if (input) {
            if (input.toLowerCase() == "y") {

                // TODO: Remove when bot is OOP and invalidateTokenInStorage() can access db from constructor
                let nedb = require("@seald-io/nedb");
                let tokensdb = new nedb({ filename: srcdir + "/data/tokens.db", autoload: true });

                // Invalidate tokens and call relogAccount for each account
                Object.keys(expiring).forEach((e, i) => {
                    // Construct missing values until they're easily accessible from bot object // TODO: Remove and access from bot object
                    let loginindex = Number(e);

                    let logOnOptions = {
                        accountName: Object.values(logininfo)[loginindex][0],
                        password: Object.values(logininfo)[loginindex][1],
                        machineName: `${extdata.mestr}'s Comment Bot`,       // For steam-user
                        deviceFriendlyName: `${extdata.mestr}'s Comment Bot` // For steam-session
                    };

                    if (loginindex == 0) var thisbot = "Main";
                        else var thisbot = `Bot ${loginindex}`;

                    let additionalaccinfo = require("../../controller/login.js").additionalaccinfo;

                    // Invalidate existing token so the sessionHandler will do a credentials login to get a new token
                    require("./tokenStorageHandler.js").invalidateTokenInStorage(tokensdb, thisbot, logOnOptions.accountName); // TODO: Access it from the corresponding bot object where the sessionHandler is linked to

                    // Push account into relog queue without advancedconfig.relogTimeout, relogAccount.js will handle getting a new session etc.
                    require("../../bot/helpers/relogAccount.js").run(loginindex, thisbot, logOnOptions, expiring[i], additionalaccinfo[loginindex].thisproxy); // TODO: Call from corresponding bot object

                    // Note: activeRelog is set to false again by webSession if relogQueue is empty
                });
            } else {
                logger("info", "Asking again in 24 hours...");

                controller.activeRelog = false; // Allow comment requests again
            }
        } else {
            logger("info", "Stopped waiting because you didn't respond in 1.5 minutes. Asking again in 24 hours...");

            controller.activeRelog = false; // Allow comment requests again
        }
    });

}