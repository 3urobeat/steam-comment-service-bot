/*
 * File: manage.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-28 12:56:44
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-16 22:08:29
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller  = require("./controller.js");
const Bot         = require("../bot/bot.js");     // eslint-disable-line
const EStatus     = require("../bot/EStatus.js");


/**
 * Adds a new account to the set of bot accounts in use and writes changes to accounts.txt
 * @param {string} accountName Username of the account
 * @param {string} password Password of the account
 * @param {string} [sharedSecret] Optional: Shared secret of the account
 */
Controller.prototype.addAccount = function(accountName, password, sharedSecret = "") {

    // Add to logininfo. Doing this here directly instead of letting the DataManager do it is not ideal practice
    this.data.logininfo.push({
        index: this.data.logininfo.length,
        accountName: accountName,
        password: password,
        sharedSecret: sharedSecret,
        steamGuardCode: null
    });

    // Make sure this account is not included in skippedaccounts
    this.info.skippedaccounts = this.info.skippedaccounts.filter((e) => e != accountName);

    // Call login handler to let it create a new Bot instance, register it and log the account in
    this.login();   // TODO: It sucks that we don't get a response here whether the account credentials are correct or not

    // Write changes to accounts.txt
    this.data.writeLogininfoToDisk();

};


/**
 * Removes an account from the active set of bot accounts and writes changes to accounts.txt
 * @param {string} accountName Username of the account to remove
 */
Controller.prototype.removeAccount = function(accountName) {

    // Remove affected entry from logininfo
    this.data.logininfo = this.data.logininfo.filter((e) => e.accountName != accountName); // TODO: Is a gap in the array (= missing index) a problem?

    // Abort if this account does not exist
    if (!this.bots[accountName]) {
        logger("warn", `Cannot remove account '${accountName}' because no bot instance exists for it!`);
        return;
    }

    // Log out this account if online and push to skippedaccounts to avoid bot attempting relog
    this.info.skippedaccounts.push(accountName);

    if (this.bots[accountName].status == EStatus.ONLINE) {
        this.bots[accountName].user.logOff();
    }

    // Delete bot instance
    delete this.bots[accountName];

    // Write changes (generated from this.bots) to accounts.txt
    this.data.writeLogininfoToDisk();

};


/**
 * Relogs an account
 * @param {string} accountName Username of the account to relog
 */
Controller.prototype.relogAccount = function(accountName) {

    // Abort if this account does not exist
    if (!this.bots[accountName]) {
        logger("error", `Cannot relog account '${accountName}' because no bot instance exists for it!`);
        return;
    }

    // Make sure this account is not included in skippedaccounts
    this.info.skippedaccounts = this.info.skippedaccounts.filter((e) => e != accountName);

    // If ONLINE, log off account and disconnect event will trigger relog. If not, set status to OFFLINE and let login handler figure out what to do
    if (this.bots[accountName].status == EStatus.ONLINE) {
        this.bots[accountName].user.logOff();
    } else {
        this._statusUpdateEvent(this.bots[accountName], EStatus.OFFLINE);
        this.login();
    }

};


/**
 * Reloads and respreads all proxies and relogs affected accounts
 */
Controller.prototype.respreadProxies = async function() {
    logger("info", "Reloading proxies from disk, respreading them and relogging affected accounts...", false, false, logger.animation("loading"));

    // Reload proxies from disk real quick
    this.data.proxies = await this.data.importProxiesFromDisk();

    // Update status of all proxies once
    await this.data.checkAllProxies(15000);

    // Get all proxies which are online and calculate perfect balance
    const onlineProxies = this.data.proxies.filter((e) => e.isOnline);
    let   pendingRelogs = [];                                                         // Stores bot accountNames which are waiting for an active request to finish before relogging
    const balance       = Math.ceil(this.getBots("*").length / onlineProxies.length);

    this.getBots("*").forEach((e) => {
        const currentProxy = e.loginData.proxy;

        // Check if this proxy is down or above balance and switch this bot away from it
        if (!onlineProxies.find((f) => f.proxy == currentProxy) || this.getBotsPerProxy().find((f) => f.proxy == currentProxy).bots.length > balance) {
            // Get the first proxy below perfect balance
            const newProxy = this.getBotsPerProxy().find((f) => f.bots.length < balance); // Must re-fetch getBotsPerProxy() result to include changes made by previous iteration

            // Assign new proxy info
            this.bots[e.accountName].loginData.proxyIndex = newProxy.proxyIndex;
            this.bots[e.accountName].loginData.proxy      = newProxy.proxy;

            // Deny further requests and queue account for relog
            this.info.activeLogin = true;
            pendingRelogs.push(e.accountName);

            logger("info", `Account '${e.accountName}' switched from proxy '${currentProxy}' to proxy '${newProxy.proxy}'. Queueing relog for account...`);
        } else {
            logger("debug", `Account '${e.accountName}' has not switched from proxy '${currentProxy}'. No relog required.`);
        }
    });

    // Check every queued account once a second if they are free to relog and resolve
    await new Promise((resolve) => {
        let lastPendingRelogsMsgAmount = 0;

        const pendingCheckInterval = setInterval(() => {
            // Create a collection of all accountNames currently in active requests
            const accountsActive = Object.values(this.activeRequests).flatMap((e) => e.status == "active" ? e.accounts : []);

            // Check every account if they are not included in accountsActive, then relog and remove them from pendingRelogs
            pendingRelogs = pendingRelogs.filter((accountName) => {
                if (!accountsActive.includes(accountName)) {
                    logger("info", `Relogging account '${accountName}' to apply proxy switch...`);

                    if (this.bots[accountName].status == EStatus.ONLINE) {
                        this.bots[accountName].user.logOff();
                    } else {
                        this._statusUpdateEvent(this.bots[accountName], EStatus.OFFLINE);
                    }

                    return false; // Tell filter() to remove this item from the pendingRelogs
                }

                return true; // Keep this item in pendingRelogs
            });

            // Break interval & resolve if no account is pending anymore, otherwise display waiting message
            if (pendingRelogs.length == 0) {
                clearInterval(pendingCheckInterval);
                resolve();
            } else {
                if (lastPendingRelogsMsgAmount != pendingRelogs.length) {
                    logger("info", `Waiting for bot(s) '${pendingRelogs.map((e) => this.bots[e].index).join(", ")}' to finish their active request to relog to apply proxy switch...`, false, false, logger.animation("waiting")); // Using !remove because a blocking request would bury this message instantly
                    lastPendingRelogsMsgAmount = pendingRelogs.length;
                }
            }
        }, 1000);
    });

    // Request a login to get all OFFLINE bots back online
    this.info.activeLogin = false;  // Must be false as login() will otherwise refuse to proceed
    this.login();
};


/**
 * Filters the active set of bot accounts by a given criteria
 * @param {function(Bot): boolean} predicate Function that returns true if the account should be included in the result
 * @returns {Array.<Bot>} Array of bot instances that match the criteria
 */
Controller.prototype.filterAccounts = function(predicate) { // TODO: Adapt getBots() function to use this function
    return this.getBots("*").filter(predicate);
};

/**
 * Set of premade functions for filterAccounts()
 * @type {{ all: Function, statusOffline: Function, statusOnline: Function, statusError: Function, statusSkipped: Function, limited: Function, unlimited: Function }}
 */
Controller.prototype.filters = {
    all:            (bot) => bot != null,
    statusOffline:  (bot) => bot.status == EStatus.OFFLINE,
    statusOnline:   (bot) => bot.status == EStatus.ONLINE,
    statusError:    (bot) => bot.status == EStatus.ERROR,
    statusSkipped:  (bot) => bot.status == EStatus.SKIPPED,
    limited:        (bot) => !bot.user.limitations || bot.user.limitations.limited == true,
    unlimited:      (bot) => bot.user.limitations  && bot.user.limitations.limited == false
};
