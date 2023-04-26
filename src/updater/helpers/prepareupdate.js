/*
 * File: prepareupdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 26.04.2023 20:53:47
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



/**
 * Wait for running comment processes and log off all bot accounts if logged in
 * @param {Steam} responseSteamID A steamID if the user requested an update via the Steam chat to send responses
 * @param {function} [callback] No parameters. Called on completion.
 */
module.exports.run = (responseSteamID, callback) => {

    /* ------------------ Check stuff & Initiate updater & log out ------------------ */

    if (botisloggedin) { // If bot is already logged in we need to check for ongoing comment processes and log all bots out when finished
        logger("", "", true);
        logger("info", "Bot is logged in. Checking for active comment process...", false, true, logger.animation("loading"));


        let controller = require("../../controller/controller.js");

        /* eslint-disable no-inner-declarations */
        function initiateUpdate() { // Make initiating the update a function to simplify the activecomment check below
            controller.relogAfterDisconnect = false; // Prevents disconnect event (which will be called by logOff) to relog accounts

            logger("info", "Logging off all bot accounts in 2.5 seconds...", false, true, logger.animation("waiting"));

            setTimeout(() => {
                Object.keys(controller.botobject).forEach((e) => {
                    controller.botobject[e].logOff(); // Logging off each account
                });

                setTimeout(() => {
                    botisloggedin = false;

                    callback(); // Start update
                }, 2500);
            }, 2500);
        }


        function filterACPobj() {
            let objlength = Object.keys(controller.activeRequests).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

            Object.keys(controller.activeRequests).forEach((e, i) => { // Loop over obj to filter invalid/expired entries

                if (controller.activeRequests[e].status != "active" || Date.now() > controller.activeRequests[e].until + (config.botaccountcooldown * 60000)) { // Check if status is not active or if entry is finished (realistically the status can't be active and finished but it won't hurt to check both to avoid a possible bug)
                    delete controller.activeRequests[e]; // Remove entry from object
                }

                if (i == objlength - 1) {
                    if (Object.keys(controller.activeRequests).length > 0) { // Check if obj is still not empty and recursively call this function again

                        setTimeout(() => { // Wait 2.5 sec and check again
                            filterACPobj();
                        }, 2500);

                    } else { // If the obj is now empty then lets continue with our update
                        logger("info", "Active comment process finished. Starting to log off all accounts...", false, true, logger.animation("loading"));
                        if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, "/me Active comment process finished. Starting to log off all accounts...");

                        initiateUpdate();
                    }
                }
            });
        }


        // Check for active comment process. If obj not empty then first sort out all invalid/expired entries.
        if (Object.keys(controller.activeRequests).length > 0 && Object.values(controller.activeRequests).some(a => a["status"] == "active")) { // Only check object if it isn't empty and has at least one comment process with the status active

            logger("info", "Waiting for an active comment process to finish...", false, true, logger.animation("waiting"));
            if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, "/me Waiting for an active comment process to finish...");

            filterACPobj(); // Note: The comment command has already been blocked by controller.js by setting activeRelog = true

        } else {
            logger("info", "No active comment processes found. Starting to log off all accounts...", false, true, logger.animation("loading"));
            if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, "/me No active comment processes found. Starting to log off all accounts...");

            initiateUpdate();
        }

    } else { // Bot is not logged in so we can instantly start updating without having to worry about logging off accounts
        logger("info", "Bot is not logged in. Skipping trying to log off accounts...", false, true, logger.animation("loading"));

        callback();
    }
};