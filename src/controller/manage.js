/*
 * File: manage.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-12-28 12:56:44
 * Author: 3urobeat
 *
 * Last Modified: 2024-12-28 15:26:28
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller  = require("./controller.js");
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
