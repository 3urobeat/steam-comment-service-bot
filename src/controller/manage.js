/*
 * File: manage.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-28 12:56:44
 * Author: 3urobeat
 *
 * Last Modified: 2024-12-31 14:19:40
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
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

    // Write changes to accounts.txt
    this.data.writeLogininfoToDisk();

    // Abort if this account does not exist
    if (!this.bots[accountName]) {
        logger("warn", `No bot instance exists for account '${accountName}'. The accountName has been removed from accounts.txt if an entry existed for it.`);
        return;
    }

    // Log out this account if online and push to skippedaccounts to avoid bot attempting relog
    this.info.skippedaccounts.push(accountName);

    if (this.bots[accountName].status == EStatus.ONLINE) {
        this.bots[accountName].user.logOff();
    }

    // Delete bot instance
    delete this.bots[accountName];

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
 * Respreads all proxies and relogs affected accounts
 */
Controller.prototype.respreadProxies = async function() {

    logger("debug", "Respreading proxies and relogging affected accounts...");

    // Update status of all proxies once
    await this.data.checkAllProxies(15000);

    // Option 1 (untested): Call checkAndSwitchMyProxy for all bot accounts to let them rebalance to the least used proxy. Might cause unnecessary requests but reuses existing code
    /* this.getBots("*").forEach((e) => e.checkAndSwitchMyProxy(true)); */

    // Option 2: Get all proxies which are online. More straight forward but introduces potentially duplicate code
    const onlineProxies = this.data.proxies.filter((e) => e.isOnline);

    this.getBots("*").forEach((e) => {
        const currentProxy = e.loginData.proxy;
        const newProxy     = onlineProxies[e.index % onlineProxies.length]; // Spread all accounts over all online proxies

        // Assign new proxy info
        this.bots[e.accountName].loginData.proxyIndex = newProxy.proxyIndex;
        this.bots[e.accountName].loginData.proxy      = newProxy.proxy;

        // Relog account if proxy has changed and account is online
        if (currentProxy != newProxy.proxy) {
            logger("info", `Account '${e.accountName}' switched from proxy '${currentProxy}' to proxy '${newProxy.proxy}'. Relogging account...`);

            if (e.status == EStatus.ONLINE) {
                this.bots[e.accountName].user.logOff();
            } else {
                this._statusUpdateEvent(this.bots[e.accountName], EStatus.OFFLINE);
            }
        } else {
            logger("debug", `Account '${e.accountName}' has not switched from proxy '${newProxy.proxy}'. No relog required.`);
        }
    });

    // Request a login to get all OFFLINE bots back online
    this.login();

};


/**
 * Filters the active set of bot accounts by a given criteria
 * @param {function(Bot): boolean} predicate Function that returns true if the account should be included in the result
 */
Controller.prototype.filterAccounts = function(predicate) { // TODO: Adapt getBots() function to use this function
    return this.getBots("*").filter(predicate);
};

/**
 * Set of premade functions for filterAccounts()
 * @type {{ statusOnline: Function, limited: Function }}
 */
Controller.prototype.filters = {
    statusOffline:  (bot) => bot.status == EStatus.OFFLINE,
    statusOnline:   (bot) => bot.status == EStatus.ONLINE,
    statusError:    (bot) => bot.status == EStatus.ERROR,
    statusSkipped:  (bot) => bot.status == EStatus.SKIPPED,
    limited:        (bot) => !bot.user.limitations || bot.user.limitations.limited == true,
    unlimited:      (bot) => bot.user.limitations  && bot.user.limitations.limited == false
};
