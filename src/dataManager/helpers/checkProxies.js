/*
 * File: checkProxies.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-10-09 21:08:13
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:14:31
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
 * Checks if a proxy can reach steamcommunity.com and updates its isOnline and lastOnlineCheck
 * @param {number} proxyIndex Index of the proxy to check in the DataManager proxies array
 * @returns {boolean} True if the proxy can reach steamcommunity.com, false otherwise.
 */
DataManager.prototype.checkProxy = async function(proxyIndex) {
    let { checkConnection, splitProxyString } = this.controller.misc;

    let thisProxy = this.proxies[proxyIndex];

    // Check connection using checkConnection helper
    await checkConnection("https://steamcommunity.com", true, thisProxy.proxy != null ? splitProxyString(thisProxy.proxy) : null) // Quick ternary to only split non-hosts
        .then((res) => {
            thisProxy.isOnline = res.statusCode >= 200 && res.statusCode < 300; // Check if response code is in 200 (OK) range
        })
        .catch(() => {
            thisProxy.isOnline = false;
        });

    thisProxy.lastOnlineCheck = Date.now();

    // Return result of check above
    return thisProxy.isOnline;
};


/**
 * Checks all proxies if they can reach steamcommunity.com and updates their entries
 * @param {number} [ignoreLastCheckedWithin=0] Ignore proxies that have already been checked in less than `ignoreLastCheckedWithin` ms
 * @returns {Promise.<void>} Resolves when all proxies have been checked
 */
DataManager.prototype.checkAllProxies = async function(ignoreLastCheckedWithin = 0) {
    let promiseArr = [];

    // Iterate over all proxies and call this.checkProxies(). We don't need any delay here as all requests go over different IPs
    this.proxies.forEach((e) => {
        if (ignoreLastCheckedWithin && ignoreLastCheckedWithin + e.lastOnlineCheck > Date.now()) return; // Ignore proxy if it has been checked recently

        promiseArr.push(this.checkProxy(e.proxyIndex));
    });

    // Await all promises so this function resolves when all proxies have been checked
    await Promise.all(promiseArr);
};
