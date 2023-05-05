/*
 * File: prepareUpdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 05.05.2023 16:19:17
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller = require("../../controller/controller.js"); // eslint-disable-line


/**
 * Wait for active requests and log off all bot accounts
 * @param {Controller} controller Reference to the controller object
 * @param {function(string)} respondModule If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins
 * @returns {Promise} Resolves when we can proceed
 */
module.exports.run = (controller, respondModule) => {
    return new Promise((resolve) => {

        if (botisloggedin) { // If bot is already logged in we need to check for ongoing comment processes and log all bots out when finished
            logger("", "", true);
            logger("info", "Bot is logged in. Checking for active comment process...", false, true, logger.animation("loading"));


            /* eslint-disable no-inner-declarations */
            function initiateUpdate() { // Make initiating the update a function to simplify the activecomment check below
                controller.relogAfterDisconnect = false; // Prevents disconnect event (which will be called by logOff) to relog accounts

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

                            logger("info", "Active comment process finished. Starting to log off all accounts...", false, true, logger.animation("loading"));
                            if (respondModule) respondModule("/me Active comment process finished. Starting to log off all accounts...");

                            initiateUpdate();
                        }
                    }
                });
            }


            // Check for active comment process. If obj not empty then first sort out all invalid/expired entries.
            if (Object.keys(controller.activeRequests).length > 0 && Object.values(controller.activeRequests).some(a => a["status"] == "active")) { // Only check object if it isn't empty and has at least one comment process with the status active
                logger("info", "Waiting for an active comment process to finish...", false, true, logger.animation("waiting"));
                if (respondModule) respondModule("/me Waiting for an active comment process to finish...");

                filterACPobj(); // Note: The comment command has already been blocked by controller.js by setting activeLogin = true

            } else {

                logger("info", "No active comment processes found. Starting to log off all accounts...", false, true, logger.animation("loading"));
                if (respondModule) respondModule("/me No active comment processes found. Starting to log off all accounts...");

                initiateUpdate();
            }

        } else { // Bot is not logged in so we can instantly start updating without having to worry about logging off accounts
            logger("info", "Bot is not logged in. Skipping trying to log off accounts...", false, true, logger.animation("loading"));

            resolve();
        }

    });
};