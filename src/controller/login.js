/*
 * File: login.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-03 19:55:19
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamTotp = require("steam-totp");

const Controller = require("./controller.js");
const Bot        = require("../bot/bot.js");
const ascii      = require("../data/ascii.js");
const misc       = require("./helpers/misc.js");


/**
 * Attempts to log in all bot accounts which are currently offline one after another.
 * Creates a new bot object for every new account and reuses existing one if possible
 * @param {boolean} firstLogin Is set to true by controller if this is the first login to display more information
 */
Controller.prototype.login = async function(firstLogin) {

    if (firstLogin) {
        // Update global var
        botisloggedin = true;

        // Create a new progress bar for some ✨ fancy log shenanigans ✨
        logger.setProgressBar(0);

        // Print ASCII art
        logger("", "", true);
        if (Math.floor(Math.random() * 100) <= 1) logger("", ascii.hellothereascii + "\n", true, false, null, false, true); // 1% chance
            else if (Math.floor(Math.random() * 100) <= 2) logger("", ascii.binaryascii + "\n", true, false, null, false, true); // 2% chance
            else logger("", ascii.ascii[Math.floor(Math.random() * ascii.ascii.length)] + "\n", true, false, null, false, true); // Last param makes sure to cut the width

        logger("", "", true); // Put one line above everything that will come to make the output cleaner

        // Print whatsnew message if this is the first start with this version
        if (this.data.datafile.firststart) logger("", `${logger.colors.reset}What's new: ${this.data.datafile.whatsnew}\n`, false, false, null, true); // Force print message now

        if (checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<") this.stop(); // eslint-disable-line
    }

    // Ignore login request if another login is running
    if (this.info.activeLogin) return logger("info", "Login for all offline accounts requested but there is already one process running. Ignoring request for now, it will be handled after this process is done.", false, true);

    logger("debug", "Controller login(): Login requested, checking for any accounts currently OFFLINE or POSTPONED...");


    // Get array of all accounts
    let allAccounts = [ ... this.data.logininfo ];

    // Remove accounts which were skipped
    allAccounts = allAccounts.filter((e) => !this.info.skippedaccounts.includes(e.accountName));

    // Set all POSTPONED accounts to offline, as they are now going to be processed (this is important so that the allAccsOnlineInterval below doesn't plow through). Ignore acc if it doesn't have a bots entry yet
    allAccounts.forEach((e) => this.bots[e.accountName] && this.bots[e.accountName].status == Bot.EStatus.POSTPONED ? this.bots[e.accountName].status = Bot.EStatus.OFFLINE : null);

    // Get all new accounts or existing ones that are offline or were postponed
    allAccounts = allAccounts.filter((e) => !this.bots[e.accountName] || this.bots[e.accountName].status == Bot.EStatus.OFFLINE);

    logger("debug", `Controller login(): Found ${allAccounts.length} login candidate(s)`);


    // Set activeLogin to true if allAccounts is not empty
    if (allAccounts.length == 0) return this.info.activeLogin = false;

    this.info.activeLogin = true;


    // Create new bot objects and register them bot accounts which are "new"
    allAccounts.forEach(async (e, i) => {
        if (!this.bots[e.accountName]) {
            logger("debug", `Creating new bot object for ${e.accountName}...`);

            this.bots[e.accountName] = new Bot(this, e.index); // Create a new bot object for this account and store a reference to it
        } else {
            logger("debug", `Found existing bot object for ${e.accountName}! Reusing it...`);
        }

        // Check if this acc has a valid token stored to qualify for fastQueue. This async function is awaited below for all accounts at once using Promise.all(). Self-assign result in then() so that the value is accessible, instead of nested inside a fulfilled Promise object.
        allAccounts[i].hasStorageValidToken = this.bots[e.accountName].sessionHandler.hasStorageValidToken().then((res) => allAccounts[i].hasStorageValidToken = res);
    });

    await Promise.all(allAccounts.map((e) => e.hasStorageValidToken));

    // Populate main with first account in bots object (NOT in allAccounts so that we don't switch the main account when relogging child accounts later)
    this.main = this.bots[this.data.logininfo[0].accountName];


    // Split login candidates into a fast queue (sync logins for accs on different proxies) & a slow queue (async logins for accs requiring user interaction)
    let fastQueue = [ ...allAccounts.filter((e) => e.hasStorageValidToken) ];
    let slowQueue = [ ...allAccounts.filter((e) => !e.hasStorageValidToken) ];


    // Calculate login time
    let timePerAccount = 5; // 5 seconds per account as default
    if (this.data.datafile.timesloggedin > 5) timePerAccount = this.data.datafile.totallogintime / this.data.datafile.timesloggedin; // Only use "intelligent" evaluation method when the bot was started more than 5 times

    let estimatedlogintime = (slowQueue.length + (fastQueue / this.data.proxies.length));

    estimatedlogintime = ((Math.max(0, fastQueue.length - 1) * ((this.data.advancedconfig.loginDelay / 1000) + timePerAccount)) / this.data.proxies.length) + (Math.max(0, slowQueue.length - 1) * ((this.data.advancedconfig.loginDelay / 1000) + timePerAccount)) + timePerAccount; // Math.max() caps to positive numbers

    // Get the correct unit
    let estimatedlogintimeunit = "seconds";
    if (estimatedlogintime > 60) { estimatedlogintime = estimatedlogintime / 60; estimatedlogintimeunit = "minutes"; }
    if (estimatedlogintime > 60) { estimatedlogintime = estimatedlogintime / 60; estimatedlogintimeunit = "hours"; }                                                                                                                                                                                                                                                                          // 🥚!

    logger("info", `Logging in ${allAccounts.length} account(s), where ${fastQueue.length} qualify for fast login... Estimated wait time: ${misc.round(estimatedlogintime, 2)} ${estimatedlogintimeunit}`, false, false, logger.animation("loading"), true);


    // Start processing the queues
    this._processFastLoginQueue(fastQueue); // TODO: This might cause issues with accounts logging in at the same time on the same proxy, once in this loop and once in the other
    this._processSlowLoginQueue(slowQueue);


    // Register interval to check if all accounts have been processed
    let allAccsOnlineInterval = setInterval(() => {

        // Check if all accounts have been processed
        let allNotOffline = allAccounts.every((e) => this.bots[e.accountName].status != Bot.EStatus.OFFLINE);// && this.bots[e.accountName].status != Bot.EStatus.POSTPONED);

        if (!allNotOffline) return;

        // Check if all accounts have their SteamUser data populated. Ignore accounts that are not online as they will never populate their user object
        let allAccountsNotPopulated = allAccounts.filter((e) => this.bots[e.accountName].status == Bot.EStatus.ONLINE && !this.bots[e.accountName].user.limitations);

        if (allAccountsNotPopulated.length > 0) {
            logger("info", `All accounts logged in, waiting for user object of bot(s) '${allAccountsNotPopulated.flatMap((e) => e.index).join(", ")}' to populate...`, true, true, logger.animation("waiting")); // Cannot log with date to prevent log output file spam
            return;
        }

        clearInterval(allAccsOnlineInterval);

        logger("info", "Finished logging in all currently queued accounts! Checking for any new accounts...", false, false, logger.animation("loading"));

        this.info.activeLogin = false;

        // Emit ready event if this is the first start and no login is pending
        if (this.info.readyAfter == 0 && !Object.values(this.bots).some((e) => e.status == Bot.EStatus.POSTPONED)) {
            this._readyEvent();
        }

        // Call itself again to process any POSTPONED or newly qualified accounts - this has to happen after the ready check above as login() sets every POSTPONED account to OFFLINE
        this.login();

    }, 250);

};


/**
 * Internal: Logs in accounts on different proxies synchronously
 * @param {Array} allAccounts Array of logininfo entries of accounts to log in
 */
Controller.prototype._processFastLoginQueue = function(allAccounts) {

    // Iterate over all proxies and log in all accounts associated to each one
    this.data.proxies.forEach((proxy) => {

        // Find all queued accounts using this proxy
        let thisProxyAccs = allAccounts.filter((e) => this.bots[e.accountName].loginData.proxyIndex == proxy.proxyIndex);

        // Make login timestamp entry for this proxy
        if (!this.info.lastLoginTimestamp[String(proxy.proxy)]) this.info.lastLoginTimestamp[String(proxy.proxy)] = 0;

        // Iterate over all accounts, use syncLoop() helper to make our job easier
        misc.syncLoop(thisProxyAccs.length, (loop, i) => {
            let thisAcc = thisProxyAccs[i]; // Get logininfo for this account name

            // Calculate wait time
            let waitTime = (this.info.lastLoginTimestamp[String(proxy.proxy)] + this.data.advancedconfig.loginDelay) - Date.now();
            if (waitTime < 0) waitTime = 0; // Cap wait time to positive numbers

            if (waitTime > 0) logger("info", `Waiting ${misc.round(waitTime / 1000, 2)} seconds between bots ${i > 0 ? this.bots[thisProxyAccs[i - 1].accountName].index : "/"} & ${this.bots[thisAcc.accountName].index}... (advancedconfig loginDelay)`, false, true, logger.animation("waiting"));

            // Wait before starting to log in
            setTimeout(() => {

                let thisbot = this.bots[thisAcc.accountName];

                // Reset logOnTries (do this here to guarantee a bot object exists for this account)
                thisbot.loginData.logOnTries = 0;

                // Generate steamGuardCode with shared secret if one was provided
                if (thisAcc.sharedSecret) {
                    logger("debug", `Found shared_secret for bot${this.bots[thisAcc.accountName].index}! Generating AuthCode and adding it to logOnOptions...`);
                    thisAcc.steamGuardCode = SteamTotp.generateAuthCode(thisAcc.sharedSecret);
                }

                // Login!
                thisbot._loginToSteam();

                // Check if this bot is not offline anymore, resolve this iteration and update lastLoginTimestamp
                let accIsOnlineInterval = setInterval(() => {
                    if (thisbot.status == Bot.EStatus.OFFLINE) return;

                    clearInterval(accIsOnlineInterval);
                    this.info.lastLoginTimestamp[String(proxy.proxy)] = Date.now();

                    // Continue with next iteration
                    loop.next();
                }, 250);

            }, waitTime);
        });

    });

};


/**
 * Internal: Logs in accounts asynchronously to allow for user interaction
 * @param {Array} allAccounts Array of logininfo entries of accounts to log in
 */
Controller.prototype._processSlowLoginQueue = function(allAccounts) {

    // Iterate over all accounts, use syncLoop() helper to make our job easier
    misc.syncLoop(allAccounts.length, (loop, i) => {
        let thisAcc = allAccounts[i]; // Get logininfo for this account name

        // Calculate wait time
        let waitTime = (this.info.lastLoginTimestamp[String(this.bots[thisAcc.accountName].loginData.proxy)] + this.data.advancedconfig.loginDelay) - Date.now();
        if (waitTime < 0) waitTime = 0; // Cap wait time to positive numbers

        if (waitTime > 0) logger("info", `Waiting ${misc.round(waitTime / 1000, 2)} seconds between bots ${i > 0 ? this.bots[allAccounts[i - 1].accountName].index : "/"} & ${this.bots[thisAcc.accountName].index}... (advancedconfig loginDelay)`, false, true, logger.animation("waiting"));

        // Wait before starting to log in
        setTimeout(() => {

            let thisbot = this.bots[thisAcc.accountName];

            // Reset logOnTries (do this here to guarantee a bot object exists for this account)
            thisbot.loginData.logOnTries = 0;

            // Generate steamGuardCode with shared secret if one was provided
            if (thisAcc.sharedSecret) {
                logger("debug", `Found shared_secret for bot${this.bots[thisAcc.accountName].index}! Generating AuthCode and adding it to logOnOptions...`);
                thisAcc.steamGuardCode = SteamTotp.generateAuthCode(thisAcc.sharedSecret);
            }

            // Login!
            thisbot._loginToSteam();

            // Check if this bot is not offline anymore, resolve this iteration and update lastLoginTimestamp
            let accIsOnlineInterval = setInterval(() => {
                if (thisbot.status == Bot.EStatus.OFFLINE) return;

                clearInterval(accIsOnlineInterval);
                this.info.lastLoginTimestamp = Date.now();

                // Continue with next iteration
                loop.next();
            }, 250);

        }, waitTime);
    });

};
