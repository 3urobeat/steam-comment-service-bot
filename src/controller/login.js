/*
 * File: login.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-26 21:29:28
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
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


let postponedRetries = 0; // Tracks the amount of reruns caused by accounts with POSTPONED status

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

    // Get all new accounts or existing ones that are offline
    allAccounts = allAccounts.filter((e) => !this.bots[e.accountName] || this.bots[e.accountName].status == Bot.EStatus.OFFLINE);

    logger("debug", `Controller login(): Found ${allAccounts.length} login candidate(s)`);


    // Set activeLogin to true if allAccounts is not empty
    if (allAccounts.length == 0) {
        logger("info", "Login queue is empty, all eligible accounts are logged in."); // Kills animation started by "Rechecking login queue for any new entries..." message
        this.info.activeLogin = false;
        return;
    }

    this.info.activeLogin = true;


    // Create new bot objects and register them bot accounts which are "new". We need to recreate bot objects of bots who have changed their proxy in order for it to actually get used
    allAccounts.forEach(async (e, i) => {
        // Check if either no bot object exists yet or if bot has changed proxy and re-create
        if (!this.bots[e.accountName]
            || (this.bots[e.accountName].user && this.bots[e.accountName].user.options.httpProxy != this.bots[e.accountName].loginData.proxy)) {
            logger("debug", `Creating new bot object for account '${e.accountName}'${this.bots[e.accountName] ? " due to proxy change" : ""}...`);

            // Reuse proxy information if bot already existed (and therefore changed its proxy to this one). Otherwise spread all accounts equally with a simple modulo calculation
            const proxyIndex = this.bots[e.accountName] ? this.bots[e.accountName].loginData.proxyIndex : e.index % this.data.proxies.length;

            // Create a new bot object for this account and store a reference to it
            this.bots[e.accountName] = new Bot(this, e.index, proxyIndex);
        } else {
            logger("debug", `Found existing bot object for '${e.accountName}' with unchanged proxy! Reusing it...`);
        }

        // Check if this acc has a valid token stored to qualify for fastQueue. This async function is awaited below for all accounts at once using Promise.all(). Self-assign result in then() so that the value is accessible, instead of nested inside a fulfilled Promise object.
        allAccounts[i].hasStorageValidToken = this.bots[e.accountName].sessionHandler.hasStorageValidToken().then((res) => allAccounts[i].hasStorageValidToken = res);
    });

    await Promise.all(allAccounts.map((e) => e.hasStorageValidToken));

    // Populate main with first account in bots object (NOT in allAccounts so that we don't switch the main account when relogging child accounts later)
    this.main = this.bots[this.data.logininfo[0].accountName];


    // Split login candidates into a fast queue (sync logins for accs on different proxies) & a slow queue (async logins for accs requiring user interaction)
    const fastQueue = [ ...allAccounts.filter((e) => e.hasStorageValidToken) ];
    const slowQueue = [ ...allAccounts.filter((e) => !e.hasStorageValidToken) ];


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
    let lastAmountUpdateTimestamp    = Date.now();
    let lastCancelingInMsgMinute     = 0;          // Last minute value logged in "Canceling this login process in [...]" message used to prevent duplicate messages
    let lastWaitingForDebugMsgAmount = 0;
    let lastWaitingForMsgAmount      = 0;          // Last amount of accounts logged in "[...] waiting for user object [...] to populate" message used to prevent duplicate messages
    let waitingForAmountAccounts     = 0;

    const allAccsOnlineInterval = setInterval(() => {

        // Shorthander that resolves this login process
        const loginFinished = () => {
            clearInterval(allAccsOnlineInterval);

            this.info.activeLogin = false;

            // Emit ready event if this is the first start and no login is pending
            if (this.info.readyAfter == 0) {
                if (!Object.values(this.bots).some((e) => e.status == Bot.EStatus.POSTPONED) || postponedRetries > 0) { // Emit ready event either way if we are already on a rerun to make the bot usable
                    this._readyEvent();
                }

                postponedRetries++;
            }

            // Call itself again to process any POSTPONED or newly qualified accounts - this has to happen after the ready check above as login() sets every POSTPONED account to OFFLINE
            this.login();
        };


        // Process various checks before deeming this login process to be finished

        /**
         * Get all accounts which have not yet switched their status. Only the relevant properties of logininfo are documented here.
         * @type {Array.<{ index: number, accountName: string }>}
         * @private
         */
        const allAccountsOffline = allAccounts.filter((e) => this.bots[e.accountName].status == Bot.EStatus.OFFLINE);

        /**
         * Get all accounts which have not yet fully been populated. Ignore accounts that are not online as they will never populate their user object. Only the relevant properties of logininfo are documented here.
         * @type {Array.<{ index: number, accountName: string }>}
         * @private
         */
        const allAccountsNotPopulated = allAccounts.filter((e) => this.bots[e.accountName].status == Bot.EStatus.ONLINE && !this.bots[e.accountName].user.limitations);

        // Create an array of all account indices !OFFLINE || !populatep and deduplicate it using a Set
        const allAccountsWaitingFor   = [ ...new Set([ ...allAccountsOffline.flatMap((e) => e.index), ...allAccountsNotPopulated.flatMap((e) => e.index) ]) ];


        // Update waitingForAmountAccounts & lastAmountUpdateTimestamp on change
        if (waitingForAmountAccounts != allAccountsWaitingFor.length) {
            waitingForAmountAccounts  = allAccountsWaitingFor.length;
            lastAmountUpdateTimestamp = Date.now();
        }

        // Check if this login process might be softlocked. Display warning after 5 minutes, abort process after 15 minutes
        if (Date.now() - lastAmountUpdateTimestamp > 300000) {     // 300000 ms = 5  min
            if (Date.now() - lastAmountUpdateTimestamp > 900000) { // 900000 ms = 15 min
                logger("warn", `Detected softlocked login process! Setting status of bot(s) '${allAccountsWaitingFor.join(", ")}' to ERROR and calling handleRelog!`, false, false, null, true);

                // Check if main account is involved and this is the initial login and terminate the bot
                if (allAccountsWaitingFor.includes(0) && this.info.readyAfter == 0) {
                    logger("", "", true);
                    logger("error", "Aborting because the first bot account always needs to be logged in!\n        Please correct what caused the error and try again.", true);
                    return this.stop();
                }

                // Set status of every account to OFFLINE and call handleRelog to let it figure this out
                allAccountsWaitingFor.forEach((index) => {
                    const thisBot = this.bots[this.getBots("*").find((e) => e.index == index).accountName];

                    this._statusUpdateEvent(thisBot, Bot.EStatus.ERROR);
                    thisBot.handleRelog();
                    thisBot.loginData.pendingLogin = false;
                });

                loginFinished();
                return;
            }

            const cancelingInMinutes = Math.ceil(((lastAmountUpdateTimestamp + 900000) - Date.now()) / 60000);

            if (lastCancelingInMsgMinute != cancelingInMinutes) {
                logger("warn", `Detected inactivity in current login process! I'm waiting for bot(s) '${allAccountsWaitingFor.join(", ")}' to change their status & become populated since >5 minutes! Canceling this login process in ~${cancelingInMinutes} minutes to prevent a softlock.`, false, true, logger.animation("waiting"));
                lastCancelingInMsgMinute = cancelingInMinutes;
            }

            if (allAccountsOffline.length > 0) return; // Prevents debug msg below from logging, should reduce log spam in debug mode
        }

        // Abort if we are still waiting for accounts to become not OFFLINE
        if (allAccountsOffline.length > 0) {
            // Only reprint this log message when the amount of accounts has changed to prevent spam
            if (lastWaitingForDebugMsgAmount != allAccountsOffline.length) {
                logger("debug", `Controller login(): Waiting for bot(s) '${allAccountsOffline.flatMap((e) => e.index).join(", ")}' to switch status to not OFFLINE before resolving...`, false, true);
                lastWaitingForDebugMsgAmount = allAccountsOffline.length;
            }
            return;
        }

        // Check if all accounts have their SteamUser data populated.
        if (allAccountsNotPopulated.length > 0) {
            // Only reprint this log message when the amount of accounts has changed to prevent spam
            if (lastWaitingForMsgAmount != allAccountsNotPopulated.length) {
                logger("info", `All accounts logged in, waiting for user object of bot(s) '${allAccountsNotPopulated.flatMap((e) => e.index).join(", ")}' to populate...`, false, true, logger.animation("waiting"));
                lastWaitingForMsgAmount = allAccountsNotPopulated.length;
            }
            return;
        }


        // Everything looks good, resolve this login process!
        logger("info", "Finished logging in all currently queued accounts! Rechecking login queue for any new entries...", false, true, logger.animation("loading"));

        loginFinished();

    }, 250);

};


/**
 * Internal: Logs in accounts on different proxies synchronously
 * @private
 * @param {Array} allAccounts Array of logininfo entries of accounts to log in
 */
Controller.prototype._processFastLoginQueue = function(allAccounts) {

    // Iterate over all proxies and log in all accounts associated to each one
    this.data.proxies.forEach((proxy) => {

        // Find all queued accounts using this proxy
        const thisProxyAccs = allAccounts.filter((e) => this.bots[e.accountName].loginData.proxyIndex == proxy.proxyIndex);

        // Make login timestamp entry for this proxy
        if (!this.info.lastLoginTimestamp[String(proxy.proxy)]) this.info.lastLoginTimestamp[String(proxy.proxy)] = 0;

        // Iterate over all accounts, use syncLoop() helper to make our job easier
        misc.syncLoop(thisProxyAccs.length, (loop, i) => {
            const thisAcc = thisProxyAccs[i]; // Get logininfo for this account name

            // Calculate wait time
            let waitTime = (this.info.lastLoginTimestamp[String(proxy.proxy)] + this.data.advancedconfig.loginDelay) - Date.now();
            if (waitTime < 0) waitTime = 0; // Cap wait time to positive numbers

            if (waitTime > 0) logger("info", `Waiting ${misc.round(waitTime / 1000, 2)} seconds between bots ${i > 0 ? this.bots[thisProxyAccs[i - 1].accountName].index : "/"} & ${this.bots[thisAcc.accountName].index}... (advancedconfig loginDelay)`, false, true, logger.animation("waiting"));

            // Wait before starting to log in
            setTimeout(() => {

                const thisbot = this.bots[thisAcc.accountName];

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
                const accIsOnlineInterval = setInterval(() => {
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
 * @private
 * @param {Array} allAccounts Array of logininfo entries of accounts to log in
 */
Controller.prototype._processSlowLoginQueue = function(allAccounts) {

    // Iterate over all accounts, use syncLoop() helper to make our job easier
    misc.syncLoop(allAccounts.length, (loop, i) => {
        const thisAcc = allAccounts[i]; // Get logininfo for this account name

        // Calculate wait time
        let waitTime = (this.info.lastLoginTimestamp[String(this.bots[thisAcc.accountName].loginData.proxy)] + this.data.advancedconfig.loginDelay) - Date.now();
        if (waitTime < 0) waitTime = 0; // Cap wait time to positive numbers

        if (waitTime > 0) logger("info", `Waiting ${misc.round(waitTime / 1000, 2)} seconds between bots ${i > 0 ? this.bots[allAccounts[i - 1].accountName].index : "/"} & ${this.bots[thisAcc.accountName].index}... (advancedconfig loginDelay)`, false, true, logger.animation("waiting"));

        // Wait before starting to log in
        setTimeout(() => {

            const thisbot = this.bots[thisAcc.accountName];

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
            const accIsOnlineInterval = setInterval(() => {
                if (thisbot.status == Bot.EStatus.OFFLINE) return;

                clearInterval(accIsOnlineInterval);
                this.info.lastLoginTimestamp = Date.now();

                // Continue with next iteration
                loop.next();
            }, 250);

        }, waitTime);
    });

};
