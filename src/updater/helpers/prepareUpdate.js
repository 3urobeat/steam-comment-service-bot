/*
 * File: prepareUpdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 09.07.2023 13:31:38
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller = require("../../controller/controller.js"); // eslint-disable-line


/**
 * Wait for active requests and log off all bot accounts
 * @param {Controller} controller Reference to the controller object
 * @param {function(object, string): void} respondModule If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters.
 * @param {import("../../commands/commandHandler.js").resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @returns {Promise.<void>} Resolves when we can proceed
 */
module.exports.run = (controller, respondModule, resInfo) => {
    return new Promise((resolve) => {
        if (resInfo) resInfo.prefix = "/me"; // All respondModule calls in this function use the "/me" prefix

        if (botisloggedin) { // If bot is already logged in we need to check for ongoing requests and log all bots out when finished
            logger("", "", true);
            logger("info", "Bot is logged in. Checking for active requests...", false, true, logger.animation("loading"));


            /* eslint-disable no-inner-declarations, jsdoc/require-jsdoc */
            function initiateUpdate() { // Make initiating the update a function to simplify the activerequest check below
                controller.info.relogAfterDisconnect = false; // Prevents disconnect event (which will be called by logOff) to relog accounts

                logger("info", "Logging off all bot accounts in 5 seconds...", false, true, logger.animation("waiting"));

                setTimeout(() => {
                    controller.getBots().forEach(e => e.user.logOff()); // Log off every account which is online

                    // Start updating in 2.5 seconds to ensure every account had time to log off
                    setTimeout(() => {
                        botisloggedin = false;
                        resolve();
                    }, 2500);
                }, 5000);
            }


            function filterACPobj() { // Filters activeRequests object
                let objlength = Object.keys(controller.activeRequests).length; // Save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

                Object.keys(controller.activeRequests).forEach((e, i) => { // Loop over obj to filter invalid/expired entries
                    if (controller.activeRequests[e].status != "active" || Date.now() > controller.activeRequests[e].until + (controller.data.config.botaccountcooldown * 60000)) { // Check if status is not active or if entry is finished (realistically the status can't be active and finished but it won't hurt to check both to avoid a possible bug)
                        delete controller.activeRequests[e]; // Remove entry from object
                    }

                    if (i == objlength - 1) {
                        if (Object.keys(controller.activeRequests).length > 0) { // Check if obj is still not empty and recursively call this function again
                            setTimeout(() => { // Wait 2.5 sec and check again
                                filterACPobj();
                            }, 2500);

                        } else { // If the obj is now empty then lets continue

                            logger("info", "Active request finished. Starting to log off all accounts...", false, true, logger.animation("loading"));
                            if (respondModule) respondModule(resInfo, "Active request finished. Starting to log off all accounts...");

                            initiateUpdate();
                        }
                    }
                });
            }
            /* eslint-enable no-inner-declarations, jsdoc/require-jsdoc */


            // Check for active request process. If obj not empty then first sort out all invalid/expired entries.
            if (Object.keys(controller.activeRequests).length > 0 && Object.values(controller.activeRequests).some(a => a["status"] == "active")) { // Only check object if it isn't empty and has at least one request with the status active
                logger("info", "Waiting for an active request to finish...", false, true, logger.animation("waiting"));
                if (respondModule) respondModule(resInfo, "Waiting for an active request to finish...");

                filterACPobj(); // Note: All request commands have already been blocked by controller.js by setting activeLogin = true

            } else {

                logger("info", "No active request found. Starting to log off all accounts...", false, true, logger.animation("loading"));
                if (respondModule) respondModule(resInfo, "No active request found. Starting to log off all accounts...");

                initiateUpdate();
            }

        } else { // Bot is not logged in so we can instantly start updating without having to worry about logging off accounts
            logger("info", "Bot is not logged in. Skipping trying to log off accounts...", false, true, logger.animation("loading"));

            resolve();
        }

    });
};