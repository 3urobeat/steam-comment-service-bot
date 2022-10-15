/*
 * File: handleExpiringTokens.js
 * Project: steam-comment-service-bot
 * Created Date: 14.10.2022 14:58:25
 * Author: 3urobeat
 * 
 * Last Modified: 15.10.2022 11:13:09
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const nedb = require("@seald-io/nedb");


// Internal - Helper function which decodes a JsonWebToken - https://stackoverflow.com/a/38552302 (c&p from sessionHandler)
function _decodeJWT(token) {
    let payload = token.split(".")[1];            // Remove header and signature as we only care about the payload
    let decoded = Buffer.from(payload, 'base64'); // Decode

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
        let expiring = [];
        let expired  = [];
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
                        if (index >= 0) expiring.push(botobject[index]); // Push the bot object of the expiring account to our array

                        // Check if token already expired and push to expired array as well to show separate warning message
                        if (tokenObj.exp * 1000 <= Date.now()) {
                            expired.push(botobject[index]);
                        }
                    }
                } else {
                    logger("err", `Failed to check when the login token for account '${e.accountName}' is going to expire!`);
                }

                // Check if this was the last iteration and display message if at least one account was found
                if (i + 1 == docs.length && expiring.length > 0) {
                    let msg;

                    // Make it fancy and define different messages depending on how many accs were found
                    if (expiring.length > 1) msg = `The login tokens of ${expiring.length} accounts are expiring in less than 7 days`;
                        else msg = `The login token of account '${e.accountName}' is expiring in less than 7 days`;

                    // Mention how many accounts already expired
                    if (expired.length > 1) msg += ` and ${logger.colors.fgred}${expired.length} accounts have already expired!${logger.colors.reset}\nRestarting will force you to type in their Steam Guard Codes`;           // Append
                        else if (expired.length == 1) msg = `The login token of account '${e.accountName}' ${logger.colors.fgred}has expired!${logger.colors.reset} Restarting will force you to type in the Steam Guard Code`; // Overwrite

                    // Log warning and message owners
                    logger("", `${logger.colors.fgred}Warning:`);
                    logger("", msg + "!", true);
                    
                    cachefile.ownerid.forEach((e, i) => {
                        setTimeout(() => {
                            // eslint-disable-next-line no-control-regex
                            botobject[0].chat.sendFriendMessage(e, msg.replace(/\x1B\[[0-9]+m/gm, "") + "!\nHead over to the terminal to refresh the tokens now if you wish."); // Remove color codes from string
                        }, 1500 * i);
                    })

                    // Ask user if he/she wants to refresh the tokens now
                    //_askForGetNewTokenNow(expiring);
                }
            })
        })
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

}