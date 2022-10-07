/*
 * File: steamSessionHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 06.10.2022 20:02:03
 * Author: 3urobeat
 * 
 * Last Modified: 07.10.2022 09:39:28
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamSession = require("steam-session");


/**
 * Handles getting a refresh token using steam-session for steam-user to login with
 * @param {String} thisbot The thisbot string of the calling account
 * @param {Object} logOnOptions Object containing username, password and optionally steamGuardCode
 */
module.exports.getRefreshToken = (thisbot, logOnOptions) => {
    return new Promise((resolve, reject) => {
        
        logger("debug", `[${thisbot}] getRefreshToken(): Login request recieved`)

        // Init new session
        let session = new SteamSession.LoginSession(SteamSession.EAuthTokenPlatformType.SteamClient);

        session.startWithCredentials(logOnOptions);

        // Return refresh token if logged on successfully
        session.on("authenticated", () => {

            resolve(session.refreshToken);

        })
        
        session.on("timeout", () => {
            logger("warn", `[${thisbot}] Login attempt timed out!`);

            reject();
        })

        session.on("error", (err) => {
            logger("error", `[${thisbot}] Error logging in: ${err}`);

            reject();
        })

    })
}