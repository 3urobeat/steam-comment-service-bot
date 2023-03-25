/*
 * File: misc.js
 * Project: steam-comment-service-bot
 * Created Date: 24.03.2023 18:58:55
 * Author: 3urobeat
 *
 * Last Modified: 25.03.2023 14:01:29
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const DataManager = require("../dataManagement.js");


/**
 * Retrieves the last processed comment request of anyone or a specific steamID64 from the lastcomment database
 * @param {String} steamID64 Search for a specific user
 * @returns {Promise} Called with the greatest timestamp (Number) found
 */
DataManager.prototype.getLastCommentRequest = function(steamID64 = null) {

    return new Promise((resolve) => {

        let searchFor = {};                           // Get all documents
        if (steamID64) searchFor = { id: steamID64 }; // Get a specific id

        let greatestValue = 0;

        this.lastCommentDB.find(searchFor, (err, docs) => {
            docs.forEach((e, i) => {
                if (e.time > greatestValue) greatestValue = Number(e.time); // Check if this iteration is a new highscore

                if (i == docs.length - 1) resolve(greatestValue); // Resolve on the last iteration
            });
        });

    });

};