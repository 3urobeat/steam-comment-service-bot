/*
 * File: getBots.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-05-02 13:46:21
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:09:26
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Bot        = require("../../bot/bot.js");
const Controller = require("../controller");
const EStatus    = Bot.EStatus;


/**
 * Retrieves all matching bot accounts and returns them.
 * @param {(EStatus|EStatus[]|string)} [statusFilter=EStatus.ONLINE] Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
 * @param {boolean} mapToObject Optional: If true, an object will be returned where every bot object is mapped to their accountName.
 * @returns {Array|object} An array or object if `mapToObject == true` containing all matching bot accounts.
 */
Controller.prototype.getBots = function(statusFilter, mapToObject) {
    if (statusFilter == null) statusFilter = EStatus.ONLINE; // Explicitly check for null so that filtering for OFFLINE (enum 0) works properly

    let accs = Object.values(this.bots); // Mark all bots as candidates

    if (Array.isArray(statusFilter)) accs = accs.filter(e => statusFilter.includes(e.status)); // Filter after multiple statuses
    if (statusFilter != "*")         accs = accs.filter(e => statusFilter == e.status);        // Filter after one specified status

    // Map values back to an accountName as key object if mapToObject == true
    if (mapToObject && accs.length > 0) accs = Object.assign(...accs.map(k => ( { [k.loginData.logOnOptions.accountName]: k } ) ));

    // Return result
    return accs;
};


/**
 * Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.
 * @param {boolean} [filterOffline=false] Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand!
 * @returns {Array.<{ bots: Array.<Bot>, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number }>} Bot accounts mapped to their associated proxy
 */
Controller.prototype.getBotsPerProxy = function(filterOffline = false) {

    // Get all bot accounts
    let accs = this.getBots("*");

    // Prefill mappedProxies
    let mappedProxies = [];

    this.data.proxies.forEach((e) => mappedProxies.push({ bots: [], ...e }));

    // Find associated proxies
    accs.forEach((e) => {
        let associatedProxy = mappedProxies[e.loginData.proxyIndex];

        associatedProxy.bots.push(e);
    });

    // Filter inactive proxies if desired
    if (filterOffline) mappedProxies = mappedProxies.filter((e) => e.isOnline);

    // Return result
    return mappedProxies;

};
