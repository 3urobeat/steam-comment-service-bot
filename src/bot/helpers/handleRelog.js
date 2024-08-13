/*
 * File: handleRelog.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-10-05 16:14:46
 * Author: 3urobeat
 *
 * Last Modified: 2024-06-06 18:04:20
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser      = require("steam-user");
const SteamCommunity = require("steamcommunity");
const request        = require("request");
const Bot = require("../bot");


/**
 * Changes the proxy of this bot account.
 * @param {number} newProxyIndex Index of the new proxy inside the DataManager.proxies array.
 */
Bot.prototype.switchProxy = function(newProxyIndex) {

    if (newProxyIndex == undefined) return new Error("Parameter newProxyIndex must not be undefined"); // Explicitly check for undefined to prevent the value 0 from triggering this check

    logger("info", `[${this.logPrefix}] Switching proxy from ${this.loginData.proxyIndex} to ${newProxyIndex}. The bot account will relog in a moment...`, false, false, logger.animation("waiting"));

    // Update proxy usage
    this.loginData.proxy      = this.data.proxies[newProxyIndex].proxy;
    this.loginData.proxyIndex = newProxyIndex;

    // Log off account. This will trigger a relog from the disconnected event
    this.user.logOff();

    // Recreate user and community object with new proxy
    this.user      = new SteamUser({ autoRelogin: false, renewRefreshTokens: true, httpProxy: this.loginData.proxy, protocol: SteamUser.EConnectionProtocol.WebSocket });
    this.community = new SteamCommunity({ request: request.defaults({ "proxy": this.loginData.proxy }) });

    // Attach event listeners again. The old ones are taken care of by the Garbage Collector because the object gets destroyed
    this._attachSteamDebugEvent();
    this._attachSteamDisconnectedEvent();
    this._attachSteamErrorEvent();
    this._attachSteamFriendMessageEvent();
    this._attachSteamLoggedOnEvent();
    this._attachSteamFriendRelationshipEvent();
    this._attachSteamGroupRelationshipEvent();
    this._attachSteamWebSessionEvent();

};


/**
 * Checks host internet connection, updates the status of all proxies checked >2.5 min ago and switches the proxy of this bot account if necessary.
 * @returns {Promise.<boolean>} Resolves with a boolean indicating whether the proxy was switched when done. A relog is triggered when the proxy was switched.
 */
Bot.prototype.checkAndSwitchMyProxy = async function() {

    // Attempt to ping github.com (basically any non steamcommunity url) without a proxy to determine if the internet connection is not working
    const hostConnectionRes = await this.controller.misc.checkConnection("https://github.com/3urobeat/steam-comment-service-bot", true)
        .catch((err) => {
            if (this.index == 0) logger("warn", `[Main] Your internet connection seems to be down. ${err.statusMessage}`, false, false, null, true); // Only log message for main acc to reduce clutter
        });

    if (!hostConnectionRes || !hostConnectionRes.statusCode) return false; // Return false if catch from above was triggered


    // Return false if connection is up but Steam cannot be reached as the proxy is not at fault
    if (!(hostConnectionRes.statusCode >= 200 && hostConnectionRes.statusCode < 300)) {
        if (this.index == 0) logger("info", "[Main] Steam is unreachable but your internet connection seems to work.", false, false, null, true); // Only log message for main acc to reduce clutter
        return false;
    }

    if (!this.loginData.proxy) return false; // Ignore anything below if this account does not use a proxy

    logger("info", `[${this.logPrefix}] Steam appears to be reachable without a proxy. Checking if Steam is reachable using proxy ${this.loginData.proxyIndex}...`, false, false, logger.animation("loading"));


    // Refresh online status of all proxies if not done in the last 2.5 minutes to check if this one is down and potentially switch to a working one
    await this.data.checkAllProxies(150000);


    // Check if our proxy is down
    const thisProxy = this.data.proxies.find((e) => e.proxyIndex == this.loginData.proxyIndex);

    if (!thisProxy.isOnline) {
        const activeProxies = this.controller.getBotsPerProxy(true); // Get all online proxies and their associated bot accounts

        // Check if no available proxy was found (exclude host) and return false
        if (activeProxies.length == 0) {
            logger("warn", `[${this.logPrefix}] Failed to ping Steam using proxy ${this.loginData.proxyIndex} but no other available proxy was found! Continuing to try with this proxy...`, false, false, null, true);
            return false;
        }


        // Find proxy with least amount of associated bots
        const leastUsedProxy = activeProxies.reduce((a, b) => a.bots.length < b.bots.length ? a : b);

        logger("warn", `[${this.logPrefix}] Failed to ping Steam using proxy ${this.loginData.proxyIndex}! Switching to proxy ${leastUsedProxy.proxyIndex} which currently has the least amount of usage and appears to be online.`, false, false, null, true);


        // Switch proxy and relog, no need for handleRelog() to do something
        this.switchProxy(leastUsedProxy.proxyIndex);
        this.controller._statusUpdateEvent(this, Bot.EStatus.POSTPONED); // Important: Set to POSTPONED to let the current login request, which this acc is queued in, resolve. The following request will process it. This fixes a softlock where the current login process would never resolve.
        this.controller.login();
        return true;

    } else {

        logger("info", `[${this.logPrefix}] Successfully pinged Steam using proxy ${this.loginData.proxyIndex}. I'll keep using this proxy.`, false, false, null, true);
        return false;
    }

};


/**
 * Attempts to get this account, after failing all logOnRetries, back online after some time. Does not apply to initial logins.
 */
Bot.prototype.handleRelog = async function() {

    this.loginData.relogTries++;

    // Check if proxy might be offline
    const proxySwitched = await this.checkAndSwitchMyProxy();

    if (proxySwitched) return; // Stop execution if proxy was switched and bot is getting relogged

    // Ignore if login timeout handler is disabled in advancedconfig
    if (this.data.advancedconfig.relogTimeout == 0) return logger("debug", `Bot handleRelog(): Ignoring timeout attach request for bot${this.index} because relogTimeout is disabled in advancedconfig!`);
        else logger("info", `[${this.logPrefix}] Attempting to recover lost connection in ${this.data.advancedconfig.relogTimeout / 60000} minutes (attempt ${this.loginData.relogTries})...`, false, false, logger.animation("waiting"));

    // Attempt to relog account after relogTimeout ms
    setTimeout(() => {

        // Abort if account is online again for some reason
        if (this.status == Bot.EStatus.ONLINE) return logger("info", `[${this.logPrefix}] Relog timeout elapsed, however the account is already online again?! Ignoring relog request...`);

        // Update status and call login again
        this.controller._statusUpdateEvent(this, Bot.EStatus.POSTPONED); // Important: Set to POSTPONED to let the current login request, which this acc is queued in, resolve. The following request will process it. This fixes a softlock where the current login process would never resolve.
        this.controller.login();

    }, this.controller.data.advancedconfig.relogTimeout);

};
