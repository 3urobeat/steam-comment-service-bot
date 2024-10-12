/*
 * File: handleMissingGameLicenses.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-06-29 21:31:53
 * Author: 3urobeat
 *
 * Last Modified: 2024-10-12 12:36:10
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Handles checking for missing game licenses, requests them and then starts playing
 */
Bot.prototype.handleMissingGameLicenses = function() {
    const data = this.controller.data;

    const configMainGames  = data.config.playinggames || [];
    let   configChildGames = data.config.childaccplayinggames || [];

    // Check if user provided games specifically for this account. We only need to check this for child accounts
    if (configChildGames && typeof configChildGames[0] == "object" && configChildGames[0] != null) { // - typeof null == "object"
        if (Object.keys(configChildGames[0]).includes(this.accountName)) configChildGames = configChildGames[0][this.accountName]; // Get the specific settings for this account if included
            else configChildGames = configChildGames.slice(1);                                                                     // ...otherwise remove object containing acc specific settings to use the generic ones

        logger("debug", `[${this.logPrefix}] Bot handleMissingGameLicenses(): Setting includes specific games, filtered for this account: ${configChildGames.join(", ")}`);
    }


    // Shorthander for starting to play
    const startPlaying = () => { if (this.index == 0) this.user.gamesPlayed(this.controller.data.config.playinggames); else this.user.gamesPlayed(configChildGames); };

    const options = {
        includePlayedFreeGames: true,
        filterAppids: this.index == 0 ? configMainGames.filter(e => !isNaN(e)) : configChildGames.filter(e => !isNaN(e) && e != null), // We only need to check for these appIDs. Filter custom game string and null values
        includeFreeSub: false
    };

    // Only request owned apps if we are supposed to idle something
    if (options.filterAppids.length > 0) {
        this.user.getUserOwnedApps(this.user.steamID, options, (err, res) => {
            if (err) {
                logger("error", `[${this.logPrefix}] Failed to get owned apps! Attempting to play set appIDs anyways...`);

                // Set playinggames for main account and child account
                startPlaying();
                return;
            }

            // Check if we are missing a license
            let missingLicenses = options.filterAppids.filter(e => !isNaN(e) && res.apps.filter(f => f.appid == e).length == 0);

            // Redeem missing licenses or start playing if none are missing. Event will get triggered again on change.
            if (missingLicenses.length > 0) {
                // Check if we are missing more than 50 licenses (limit per hour) and cut array
                if (missingLicenses.length > 50) {
                    logger("warn", `[${this.logPrefix}] This account is missing more than 50 licenses! Steam only allows registering 50 licenses per hour.\n                             I will register 50 licenses now and check again in 1 hour to work on the next 50 licenses.`);
                    missingLicenses = missingLicenses.splice(0, 50);

                    setTimeout(() => {
                        logger("info", `[${this.logPrefix}] handleMissingGameLicenses(): Running myself again to register the next 50 licenses...`);
                        this.handleMissingGameLicenses();
                    }, 3.6e+6 + 300000); // 1 hour plus 5 minutes for good measure
                }

                logger("info", `[${this.logPrefix}] Requesting ${missingLicenses.length} missing license(s) before starting to play games set in config...`, false, true, logger.animation("loading"));

                this.user.requestFreeLicense(missingLicenses, (err) => {
                    if (err) {
                        logger("error", `[${this.logPrefix}] Failed to request missing licenses! Starting to play anyways...`);
                        startPlaying();
                    } else {
                        logger("info", `[${this.logPrefix}] Successfully requested ${missingLicenses.length} missing game license(s)!`);
                        setTimeout(() => startPlaying(), 2500);
                    }
                });
            } else {
                logger("debug", `[${this.logPrefix}] Bot handleMissingGameLicenses(): ${options.filterAppids.length} appIDs are set, user is missing 0 of them. Starting to play...`);
                startPlaying();
            }
        });

    } else { // ...check for custom game which was filtered above

        logger("debug", `[${this.logPrefix}] Bot handleMissingGameLicenses(): No appIDs are set, starting to play custom game if one is set...`);
        startPlaying();
    }

};
