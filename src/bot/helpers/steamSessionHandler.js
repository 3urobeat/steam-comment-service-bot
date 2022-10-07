/*
 * File: steamSessionHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 06.10.2022 20:02:03
 * Author: 3urobeat
 * 
 * Last Modified: 07.10.2022 17:48:58
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

        // Init new session
        let session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

        // Login with credentials supplied in logOnOptions
        session.startWithCredentials(logOnOptions)
            .then((res) => {
                // Check if Steam requests to do something (get a 2FA code for example)
                if (res.actionRequired) {
                    logger("debug", `[${thisbot}] getRefreshToken(): Recieved startWithCredentials() actionRequired response. Type: ${res.validActions[0].type} | Detail: ${res.validActions[0].detail}`);

                    switch (res.validActions[0].type) {
                        case SteamSession.EAuthSessionGuardType.EmailCode: // 2
                            break;
                        case SteamSession.EAuthSessionGuardType.DeviceCode: // 3
                            break;
                        case SteamSession.EAuthSessionGuardType.DeviceConfirmation: // 4
                            break;
                        case SteamSession.EAuthSessionGuardType.EmailConfirmation: // 5
                            break;
                        default: // Dunno what to do with the other types
                            logger("error", `[${thisbot}] Failed to get login session! Unexpected 2FA type ${res.validActions[0].type}! Sorry, I need to skip this account...`);
                            skipAccount(loginindex);
                    }
                }
            })
            .catch((err) => {
                if (err) logger("err", `[${thisbot}] Error trying to get SteamSession with credentials: ${err}`);
            })

       
        /* ------------ Events: ------------ */ 
        session.on("authenticated", () => {
            logger("debug", `[${thisbot}] getRefreshToken(): Login request successful, '${session.accountName}' authenticated. Resolving Promise...`);

            resolve(session.refreshToken);
        })
        
        session.on("timeout", () => {
            logger("warn", `[${thisbot}] Login attempt timed out. Skipping account...`);
            skipAccount(loginindex);
            resolve(null);
        })

        session.on("error", (err) => {
            logger("error", `[${thisbot}] Failed to log in! Error: ${err}\nSkipping account...`);
            skipAccount(loginindex);
            resolve(null);
        })

    })
}