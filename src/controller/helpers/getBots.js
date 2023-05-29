/*
 * File: getBots.js
 * Project: steam-comment-service-bot
 * Created Date: 02.05.2023 13:46:21
 * Author: 3urobeat
 *
 * Last Modified: 29.05.2023 18:01:36
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller = require("../controller");
const EStatus    = require("../../bot/EStatus.js");


/**
 * Retrieves all matching bot accounts and returns them.
 * @param {(EStatus|EStatus[]|string)} [statusFilter=EStatus.ONLINE] EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
 * @param {Boolean} mapToObject If true, an object will be returned where every bot object is mapped to their accountName.
 * @returns {Array|Object} An array or object if `mapToObject == true` containing all matching bot accounts.
 */
Controller.prototype.getBots = function(statusFilter, mapToObject) {
    if (!statusFilter) statusFilter = EStatus.ONLINE;

    let accs = Object.values(this.bots); // Mark all bots as candidates

    if (Array.isArray(statusFilter)) accs = accs.filter(e => statusFilter.includes(e.status)); // Filter after multiple statuses
    if (statusFilter != "*")         accs = accs.filter(e => statusFilter == e.status);        // Filter after one specified status

    // Map values back to an accountName as key object if mapToObject == true
    if (mapToObject) accs = Object.assign(...accs.map(k => ( { [k.loginData.logOnOptions.accountName]: k } ) ));

    // Return result
    return accs;
};