/*
 * File: ownershipCached.js
 * Project: steam-comment-service-bot
 * Created Date: 24.05.2023 21:28:07
 * Author: 3urobeat
 *
 * Last Modified: 22.06.2023 22:58:35
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot = require("../bot.js");


/**
 * Handles the SteamUser ownershipCached event and tries to redeem licenses for games the account is missing
 */
Bot.prototype._attachSteamOwnershipCachedEvent = function() {

    // Emitted when steam-user knows about which apps we own
    this.user.on("ownershipCached", () => {
        logger("debug", `[${this.logPrefix}] Bot ownershipCached: Checking for missing licenses...`);

        let ownedLicenses = this.user.getOwnedApps();

        // Check if we are missing a license
        let missingLicenses = [];
        missingLicenses = this.data.config.playinggames.filter(e => !isNaN(e) && !ownedLicenses.includes(e));

        // Redeem missing licenses or start playing if none are missing. Event will get triggered again on change.
        if (missingLicenses.length > 0) {
            logger("info", `[${this.logPrefix}] Requesting ${missingLicenses.length} missing license(s) before starting to play games set in config...`, false, true, logger.animation("loading"));

            this.user.requestFreeLicense(missingLicenses, (err) => {
                if (err) {
                    logger("error", `[${this.logPrefix}] Failed to request missing licenses! Starting to play anyways...`);

                    // Set playinggames for main account and child account
                    if (this.index == 0) this.user.gamesPlayed(this.controller.data.config.playinggames);
                    if (this.index != 0) this.user.gamesPlayed(this.controller.data.config.childaccplayinggames);

                } else {

                    logger("info", `[${this.logPrefix}] Successfully requested ${missingLicenses.length} license(s). Starting to play games in a moment...`);
                }
            });

        } else {

            // Set playinggames for main account and child account
            if (this.index == 0) this.user.gamesPlayed(this.controller.data.config.playinggames);
            if (this.index != 0) this.user.gamesPlayed(this.controller.data.config.childaccplayinggames);
        }


        // Clear picsCache to save memory as we don't need it anymore. Give the Garbage Collector a few seconds to pick it up
        setTimeout(() => {
            logger("debug", `[${this.logPrefix}] Clearing picsCache for this account...`);
            this.user.picsCache.apps = {};
        }, 2500);


        // Increase progress bar if one is active
        if (logger.getProgressBar()) logger.increaseProgressBar((100 / Object.keys(this.data.logininfo).length) / 3);
    });

};
