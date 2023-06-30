/*
 * File: refreshCache.js
 * Project: steam-comment-service-bot
 * Created Date: 29.03.2023 17:44:47
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs      = require("fs");
const SteamID = require("steamid");

const DataManager = require("../dataManager");


/**
 * Refreshes Backups in cache.json with new data
 */
DataManager.prototype.refreshCache = function() {
    logger("info", "Refreshing data backups in cache.json...", false, true, logger.animation("loading"));

    // Refresh cache of bot account ids, check if they inflict with owner settings
    let tempArr = [];

    this.controller.getBots().forEach((e, i) => { // Get all online accounts
        tempArr.push(new SteamID(String(e.user.steamID)).getSteamID64());

        // Check if this bot account is listed as an owner id and display warning
        if (this.cachefile.ownerid.includes(tempArr[i])) logger("warn", `You provided an ownerid in the config that points to a bot account used by this bot! This is not allowed.\n       Please change id ${tempArr[i]} to point to your personal steam account!`, true);

        // Write tempArr to cachefile on last iteration
        if (this.controller.getBots().length == i + 1) {
            this.cachefile["botaccid"] = tempArr;

            // TODO: This must be run through steamidresolver beforehand or am I wrong?
            if (tempArr.includes(this.cachefile.ownerlinkid)) logger("warn", "The owner link you set in the config points to a bot account used by this bot! This is not allowed.\n       Please change the link to your personal steam account!", true);
        }
    });


    // Update Backups
    logger("debug", "Writing backups to cache.json...", false, true, logger.animation("loading"));
    this.cachefile["configjson"] = this.config;
    this.cachefile["advancedconfigjson"] = this.advancedconfig;
    this.cachefile["datajson"] = this.datafile;


    // Write changes to file
    fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(this.cachefile, null, 4), err => {
        if (err) logger("error", "error writing file backups to cache.json: " + err);
    });
};