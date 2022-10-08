/*
 * File: steamSessionHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 06.10.2022 20:02:03
 * Author: 3urobeat
 * 
 * Last Modified: 08.10.2022 14:11:16
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamSession = require("steam-session");

const controller = require("../../controller/controller.js");
const login      = require("../../controller/login.js");


// Helper function to easily skip this account if login attempt failed
function skipAccount(loginindex) {
    login.accisloggedin = true; //set to true to log next account in

    controller.skippedaccounts.push(loginindex);
    login.skippednow.push(loginindex);
}


// Helper function to get 2FA code from user
function get2FAUserInput(thisbot, loginindex, logOnOptions, callback) {

    // Start timer to subtract it later from readyafter time
    var steamGuardInputStart = Date.now(); // Measure time to subtract it later from readyafter time
    
    // Define different question and timeout for main account as it can't be skipped
    let question;
    let timeout;
    
    if (loginindex == 0) {
        question = `[${logOnOptions.accountName}] Steam Guard Code: `;
        timeout = 0;
    } else {
        question = `[${logOnOptions.accountName}] Steam Guard Code (leave empty and press ENTER to skip account): `;
        timeout = 90000;
    }

    // Ask user for code
    logger.readInput(question, timeout, (text) => {
        if (!text || text == "") { // No response or manual skip
            
            if (text == null) logger("info", "Skipping account because you didn't respond in 1.5 minutes...", true); // No need to check for main acc as timeout is disabled for it

            if (loginindex == 0) { // First account can't be skipped
                logger("warn", "The first account always has to be logged in!", true)

                setTimeout(() => {
                    get2FAUserInput(thisbot, loginindex, logOnOptions, (callback)); // Run function again, pass callback along so a deeper level will callback to the top level
                }, 500);
            } else { // Skip account if not bot0
                logger("info", `[${thisbot}] steamGuard input empty, skipping account...`, false, true, logger.animation("loading"))
                
                login.accisloggedin = true; // Set to true to log next account in
                controller.skippedaccounts.push(loginindex);
                login.skippednow.push(loginindex);
                
                callback(null)
                return;
            }

        } else { // User entered code

            logger("info", `[${thisbot}] Accepting Steam Guard Code...`, false, true, logger.animation("loading"))
            callback(text.toString().trim()) // Give code back to node-steam-user

        }

        login.steamGuardInputTimeFunc(Date.now() - steamGuardInputStart) // Measure time and subtract it from readyafter time
    })
}


// Helper function to make accepting and re-requesting invalid steam guard codes easier
function acceptSteamGuardCode(thisbot, loginindex, session, code) {

    session.submitSteamGuardCode(code)
        .then((res) => {
            logger("debug", `[${thisbot}] acceptSteamGuardCode(): User supplied correct code, authenticated event should trigger. Response: ${res}`);
        })
        .catch((err) => {
            logger("warn", `[${thisbot}] ${err}`); // TODO: Retry?
        })

}


/**
 * Handles getting a refresh token using steam-session for steam-user to login with
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Number} loginindex The loginindex of the calling account
 * @param {Object} logOnOptions Object containing username, password and optionally steamGuardCode
 * @returns {Promise} `refreshToken` on success or `null` on failure
 */
module.exports.getRefreshToken = (thisbot, loginindex, logOnOptions) => {
    return new Promise((resolve) => {
        
        logger("debug", `[${thisbot}] getRefreshToken(): Login request recieved`);

        login.additionalaccinfo[loginindex].logOnTries++

        // Init new session
        let session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

        // Login with credentials supplied in logOnOptions
        session.startWithCredentials(logOnOptions)
            .then((res) => {

                // Check if Steam requests to do something (get a 2FA code for example)
                if (res.actionRequired) {
                    logger("debug", `[${thisbot}] getRefreshToken(): Recieved startWithCredentials() actionRequired response. Type: ${res.validActions[0].type} | Detail: ${res.validActions[0].detail}`);

                    // Check if user enabled skipSteamGuard and skip asking for 2FA if this is not the main account
                    if (config.skipSteamGuard) {
                        if (loginindex > 0) {
                            logger("info", `[${thisbot}] Skipping account because skipSteamGuard is enabled...`, false, true, logger.animation("loading"))
                            skipAccount(loginindex);
                            resolve(null);
                            return;
                        } else {
                            logger("warn", "Even with skipSteamGuard enabled, the first account always has to be logged in.", true);
                        }
                    } 

                    // Get 2FA code/prompt confirmation from user, mentioning the correct source
                    switch (res.validActions[0].type) {
                        case SteamSession.EAuthSessionGuardType.EmailCode:          // Type 2
                            logger("info", `[${thisbot}] Please enter the Steam Guard Code from your email address at ${res.validActions[0].detail}. Skipping automatically in 1.5 minutes if you don't respond...`, true);

                            get2FAUserInput(thisbot, loginindex, logOnOptions, (code) => acceptSteamGuardCode(thisbot, loginindex, session, code)); // Pass callback directly to acceptSteamGuard helper function
                            break;

                        case SteamSession.EAuthSessionGuardType.DeviceConfirmation: // Type 4 (more convenient than type 3, both can be active at the same time so we check for this one first)
                            logger("info", `[${thisbot}] Please confirm this login request in your Steam Mobile App.`, false, false, logger.animation("waiting"));
                            break;

                        case SteamSession.EAuthSessionGuardType.DeviceCode:         // Type 3
                            logger("info", `[${thisbot}] Please enter the Steam Guard Code from your Steam Mobile App. Skipping automatically in 1.5 minutes if you don't respond...`, true);

                            get2FAUserInput(thisbot, loginindex, logOnOptions, (code) => acceptSteamGuardCode(thisbot, loginindex, session, code)); // Pass callback directly to acceptSteamGuard helper function
                            break;

                        case SteamSession.EAuthSessionGuardType.EmailConfirmation:  // Type 5
                            logger("info", `[${thisbot}] Please confirm this login request via the confirmation email sent to you.`, false, false, logger.animation("waiting"));
                            break;

                        default: // Dunno what to do with the other types
                            logger("error", `[${thisbot}] Failed to get login session! Unexpected 2FA type ${res.validActions[0].type}! Sorry, I need to skip this account...`);

                            skipAccount(loginindex);
                            resolve(null);
                            return;
                    }
                }

            })
            .catch((err) => {
                if (err) {
                    logger("err", `[${thisbot}] Error trying to get SteamSession with credentials: ${err}`); 

                    // TODO: retry?

                    skipAccount(loginindex);
                    resolve(null);
                    return;
                }
            })

       
        /* ------------ Events: ------------ */ 
        session.on("authenticated", () => { // Success
            logger("debug", `[${thisbot}] getRefreshToken(): Login request successful, '${session.accountName}' authenticated. Resolving Promise...`);

            resolve(session.refreshToken);
        })
        
        session.on("timeout", () => { // Login attempt took too long, failure
            logger("warn", `[${thisbot}] Login attempt timed out. Skipping account...`);
            
            skipAccount(loginindex);
            resolve(null);
        })

        session.on("error", (err) => { // Failure
            logger("error", `[${thisbot}] Failed to log in! Error: ${err}\nSkipping account...`);

            // TODO: Retry until advancedconfig.maxLogOnRetries?

            skipAccount(loginindex);
            resolve(null);
        })

    })
}