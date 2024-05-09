/*
 * File: handleCooldowns.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-04-13 17:58:23
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:13:55
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManager");


/**
 * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
 * @param {string} id ID of the user to look up
 * @returns {Promise.<{ lastRequest: number, until: number, lastRequestStr: string, untilStr: string }|null>} Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as String), `untilStr` (Wait until as String). If id wasn't found, `null` will be returned.
 */
DataManager.prototype.getUserCooldown = function(id) {
    return new Promise((resolve) => {

        const obj = {
            "lastRequest": 0,
            "until": 0,
            "lastRequestStr": "",
            "untilStr": ""
        };

        this.lastCommentDB.findOne({ id: id }, (err, doc) => {
            if (!doc) { // Check if no entry was found and BAIL THE FUCK OUT
                logger("warn", `User '${id}' has no lastComment database entry! Permitting request and hoping an entry will be inserted afterwards.\n                             If this warning appears multiple times for the same user you need to take action. Need help? https://github.com/3urobeat/steam-comment-service-bot/issues/new/choose\n                             If this warning is caused by a plugin for a userID from outside the Steam Chat for their first request you can ignore this warning as the behavior is to be expected.`);
                return resolve(obj);
            }

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
            let until = Math.abs(((Date.now() - doc.time) / 1000) - (this.config.requestCooldown * 60));
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

            obj.lastRequest    = doc.time;
            obj.until          = doc.time + (this.config.requestCooldown * 60000);
            obj.lastRequestStr = `${lastReq} ${lastReqUnit}`;
            obj.untilStr       = `${until} ${untilUnit}`;

            resolve(obj);
        });

    });
};


/**
 * Updates or inserts timestamp of a user
 * @param {string} id ID of the user to update
 * @param {number} timestamp Unix timestamp of the last interaction the user received
 */
DataManager.prototype.setUserCooldown = function(id, timestamp) {
    if (!id) return logger("error", "CRITICAL: setUserCooldown was called without an ID! I am unable to apply a cooldown for this user!\n                              Not fixing this error will render the cooldown system useless and exposes your accounts to the risk of getting banned!");

    logger("debug", `DataManager setUserCooldown(): Updating lastcomment db entry for ${id} to ${timestamp}.`);

    this.lastCommentDB.update({ id: id }, { $set: { time: timestamp } }, { upsert: true }, (err) => {
        if (err) logger("error", "Error adding cooldown to user in database! You should probably *not* ignore this error!\nError: " + err);
    });

};
