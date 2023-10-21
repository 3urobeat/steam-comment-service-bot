/*
 * File: login.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 21.10.2023 12:52:52
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
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
Controller.prototype.login = function(firstLogin) {

    if (firstLogin) {
        // Update global var
        botisloggedin = true;

        // Create a new progress bar for some ✨ fancy log shenanigans ✨
        logger.setProgressBar(0);

        // Print ASCII art
        logger("", "", true);
        if (Math.floor(Math.random() * 100) <= 2) logger("", ascii.hellothereascii + "\n", true, false, null, false, true); // 2% chance
            else if (Math.floor(Math.random() * 100) <= 5) logger("", ascii.binaryascii + "\n", true, false, null, false, true); // 5% chance
            else logger("", ascii.ascii[Math.floor(Math.random() * ascii.ascii.length)] + "\n", true, false, null, false, true); // Last param makes sure to cut the width

        logger("", "", true); // Put one line above everything that will come to make the output cleaner

        /* ------------ Log comment related config settings: ------------ */
        let maxRequestsOverall = this.data.config.maxOwnerRequests; // Define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
        if (this.data.config.maxRequests > this.data.config.maxOwnerRequests) maxRequestsOverall = this.data.config.maxRequests;
        logger("info", `Comment settings: requestDelay: ${this.data.config.requestDelay} | botaccountcooldown: ${this.data.config.botaccountcooldown} | maxRequestsOverall: ${maxRequestsOverall} | randomizeAcc: ${this.data.config.randomizeAccounts}`, false, true, logger.animation("loading"));


        // Print whatsnew message if this is the first start with this version
        if (this.data.datafile.firststart) logger("", `${logger.colors.reset}What's new: ${this.data.datafile.whatsnew}\n`, false, false, null, true); // Force print message now


        // Evaluate estimated wait time for login:
        logger("debug", "Evaluating estimated login time...");
        let estimatedlogintime;

        // Only use "intelligent" evaluation method when the bot was started more than 5 times
        if (this.data.datafile.timesloggedin < 5) estimatedlogintime = ((this.data.advancedconfig.loginDelay * (this.data.logininfo.length - 1 - this.info.skippedaccounts.length)) / 1000) + 5; // 5 seconds tolerance
            else estimatedlogintime = ((this.data.datafile.totallogintime / this.data.datafile.timesloggedin) + (this.data.advancedconfig.loginDelay / 1000)) * (this.data.logininfo.length - this.info.skippedaccounts.length);

        let estimatedlogintimeunit = "seconds";
        if (estimatedlogintime > 60) { estimatedlogintime = estimatedlogintime / 60; estimatedlogintimeunit = "minutes"; }
        if (estimatedlogintime > 60) { estimatedlogintime = estimatedlogintime / 60; estimatedlogintimeunit = "hours"; }                                                                                                                                                                                                                                                                          // 🥚!

        logger("info", `Logging in... Estimated wait time: ${misc.round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`, false, false, logger.animation("loading"), true);
        if (checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<") this.stop(); // eslint-disable-line
    }


    if (this.info.activeLogin) return logger("debug", "Controller login(): Login requested but there is already a login process active. Ignoring...");
        else logger("debug", "Controller login(): Login requested, checking for any accounts currently offline...");

    // Get array of all account names
    let allAccounts = this.data.logininfo.map((e) => e.accountName);

    // Filter accounts which were skipped
    allAccounts = allAccounts.filter(e => !this.info.skippedaccounts.includes(e));

    // Filter accounts which are not offline
    allAccounts = allAccounts.filter(e => !this.bots[e] || this.bots[e].status == Bot.EStatus.OFFLINE); // If no bot object exists yet the account must be offline

    logger("debug", `Controller login(): Found ${allAccounts.length} account(s) which aren't logged in and weren't skipped`);


    // Set activeLogin to true if allAccounts is not empty
    if (allAccounts.length == 0) return this.info.activeLogin = false;
        else this.info.activeLogin = true;

    // Iterate over all accounts, use syncLoop() helper to make our job easier
    misc.syncLoop(allAccounts.length, (loop, i) => {
        let k = this.data.logininfo.find((e) => e.accountName == allAccounts[i]); // Get logininfo for this account name

        // Calculate wait time
        let waitTime = (this.info.lastLoginTimestamp + this.data.advancedconfig.loginDelay) - Date.now();
        if (waitTime < 0) waitTime = 0; // Cap wait time to positive numbers

        if (waitTime > 0) logger("info", `Waiting ${misc.round(waitTime / 1000, 2)} seconds... (advancedconfig loginDelay)`, false, true, logger.animation("waiting"));

        // Wait before starting to log in
        setTimeout(() => {

            // Check if no bot object entry exists for this account and create one
            if (!this.bots[k.accountName]) {
                logger("info", `Creating new bot object for ${k.accountName}...`, false, true, logger.animation("loading"));

                this.bots[k.accountName] = new Bot(this, k.index); // Create a new bot object for this account and store a reference to it
            } else {
                logger("debug", `Found existing bot object for ${k.accountName}! Reusing it...`, false, true, logger.animation("loading"));
            }

            let thisbot = this.bots[k.accountName];

            // Reset logOnTries (do this here to guarantee a bot object exists for this account)
            thisbot.loginData.logOnTries = 0;

            // Generate steamGuardCode with shared secret if one was provided
            if (k.sharedSecret) {
                logger("debug", `Found shared_secret for bot${this.bots[k.accountName].index}! Generating AuthCode and adding it to logOnOptions...`);
                k.steamGuardCode = SteamTotp.generateAuthCode(k.sharedSecret);
            }

            // Login!
            thisbot._loginToSteam();

            // Check if this bot is not offline anymore, resolve this iteration and update lastLoginTimestamp
            let accIsOnlineInterval = setInterval(() => {
                if (thisbot.status == Bot.EStatus.OFFLINE) return;

                // Keep waiting if we are on the last iteration and user object is not fully populated yet, this takes a few seconds after login. Make sure to check for limitations of last entry in array instead of this iteration to not break when the this last acc got skipped
                let onlineBots = this.getBots();
                let lastBot    = onlineBots[onlineBots.length - 1];

                if (i + 1 == Object.keys(this.data.logininfo).length && lastBot && !lastBot.user.limitations) { // Only attempt to check if a lastBot was found, this can otherwise cause an infinite error loop
                    return logger("info", `Last account logged in, waiting for user object of Bot ${lastBot.index} to populate...`, true, true, logger.animation("waiting"));
                }

                clearInterval(accIsOnlineInterval);
                this.info.lastLoginTimestamp = Date.now();

                // Populate this.main if we just logged in the first account
                if (Object.keys(this.bots)[0] == k.accountName) this.main = thisbot;

                logger("debug", `Controller login(): bot${this.bots[k.accountName].index} changed status from OFFLINE to ${Bot.EStatus[thisbot.status]}! Continuing with next account...`);

                // Check for last iteration, call again and emit ready event
                if (i + 1 == allAccounts.length) {
                    logger("debug", "Controller login(): Finished logging in all accounts! Calling myself again to check for any new accounts...");
                    this.info.activeLogin = false;
                    this.login();
                    if (this.info.readyAfter == 0) this._readyEvent(); // Only call ready event if this is the first start
                }

                // Continue with next iteration
                loop.next();
            }, 250);

        }, waitTime);
    });

};