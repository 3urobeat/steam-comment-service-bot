/*
 * File: handleCooldowns.js
 * Project: steam-comment-service-bot
 * Created Date: 13.04.2023 17:58:23
 * Author: 3urobeat
 *
 * Last Modified: 29.05.2023 17:13:11
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager");


/**
 * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
 * @param {String} id ID of the user to look up
 * @returns {Promise.<{ lastRequest: number, until: number, lastRequestStr: string, untilStr: string }|null>} Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as String), `untilStr` (Wait until as String). If id wasn't found, `null` will be returned.
 */
DataManager.prototype.getUserCooldown = function(id) {
    return new Promise((resolve) => {

        this.lastCommentDB.findOne({ id: id }, (err, doc) => {
            if (!doc) return resolve(null); // Check if no entry was found and BAIL THE FUCK OUT

            // Format lastRequestStr
            let lastReq = Math.abs((Date.now() - doc.time) / 1000);
            let lastReqUnit = "seconds";

            if (lastReq > 60) {
                lastReq = lastReq / 60; lastReqUnit = "minutes";

                if (lastReq > 60) {
                    lastReq = lastReq / 60; lastReqUnit = "hours";

                    if (lastReq > 24) {
                        lastReq = lastReq / 24; lastReqUnit = "days";
                    }
                }
            }

            lastReq = Number(Math.round(lastReq+"e"+2)+"e-"+2); // Limit lastReq value to two decimals

            // Format untilStr
            let until = Math.abs(((Date.now() - doc.time) / 1000) - (this.config.commentcooldown * 60));
            let untilUnit = "seconds";

            if (until > 60) {
                until = until / 60; untilUnit = "minutes";

                if (until > 60) {
                    until = until / 60; untilUnit = "hours";

                    if (until > 24) {
                        until = until / 24; untilUnit = "days";
                    }
                }
            }

            until = Number(Math.round(until+"e"+2)+"e-"+2); // Limit until value to two decimals

            resolve({
                "lastRequest": doc.time,
                "until": doc.time + (this.config.commentcooldown * 60000),
                "lastRequestStr": `${lastReq} ${lastReqUnit}`,
                "untilStr": `${until} ${untilUnit}`
            });
        });

    });
};


/**
 * Updates or inserts timestamp of a user
 * @param {String} id ID of the user to update
 * @param {Number} timestamp Unix timestamp of the last interaction the user received
 */
DataManager.prototype.setUserCooldown = function(id, timestamp) {
    logger("debug", `DataManager setUserCooldown(): Updating lastcomment db entry for ${id} to ${timestamp}.`);

    this.lastCommentDB.update({ id: id }, { $set: { time: timestamp } }, { upsert: true }, (err) => {
        if (err) logger("error", "Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err);
    });

};