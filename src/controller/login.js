/*
 * File: login.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 03.04.2023 19:26:36
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
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
 * Internal: Performs certain checks before logging in for the first time and then calls login()
 */
Controller.prototype._preLogin = async function() {

    // Update global var
    botisloggedin = true;


    // Print ASCII art
    logger("", "", true);
    if (Math.floor(Math.random() * 100) <= 2) logger("", ascii.hellothereascii + "\n", true); // 2% chance
        else if (Math.floor(Math.random() * 100) <= 5) logger("", ascii.binaryascii + "\n", true); // 5% chance
        else logger("", ascii.ascii[Math.floor(Math.random() * ascii.ascii.length)] + "\n", true);

    logger("", "", true); // Put one line above everything that will come to make the output cleaner


    // Load intern event handlers & helpers
    require("./events/ready.js");
    require("./events/statusUpdate.js");
    require("./helpers/friendlist.js");


    // Load commandHandler
    let CommandHandler = require("../commands/commandHandler.js");

    this.commandHandler = new CommandHandler(this);
    this.commandHandler._importCoreCommands();


    // Load pluginSystem
    let PluginSystem = require("../pluginSystem/pluginSystem");

    this.pluginSystem = new PluginSystem(this);


    // Check if SteamCommunity is up
    logger("info", "Checking if Steam is reachable...", false, true, logger.animation("loading"));

    await misc.checkConnection("https://steamcommunity.com", true)
        .then((res) => {
            logger("info", `SteamCommunity is up! Status code: ${res.statusCode}`, false, true, logger.animation("loading"));
        })
        .catch((res) => {
            // Check if the request itself failed and display a different message
            if (!res.statusCode) logger("error", `SteamCommunity seems to be down or your internet isn't working! Check: https://steamstat.us \n        ${res.statusMessage}\n\n        Aborting...\n`, true);
                else logger("error", `Your internet is working but SteamCommunity seems to be down! Check: https://steamstat.us \n        ${res.statusMessage} (Status Code ${res.statusCode})\n\n        Aborting...\n`, true);

            return this.stop(); // Stop the bot as there is nothing more we can do
        });


    /* ------------ Log comment related config settings: ------------ */
    let maxCommentsOverall = this.data.config.maxOwnerComments; // Define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
    if (this.data.config.maxComments > this.data.config.maxOwnerComments) maxCommentsOverall = this.data.config.maxComments;
    logger("info", `Comment settings: commentdelay: ${this.data.config.commentdelay} | botaccountcooldown: ${this.data.config.botaccountcooldown} | maxCommentsOverall: ${maxCommentsOverall} | randomizeAcc: ${this.data.config.randomizeAccounts}`, false, true, logger.animation("loading"));


    // Print whatsnew message if this is the first start with this version
    if (this.data.datafile.firststart) logger("", `${logger.colors.reset}What's new: ${this.data.datafile.whatsnew}\n`, false, false, null, true); // Force print message now


    // Evaluate estimated wait time for login:
    logger("debug", "Evaluating estimated login time...");
    let estimatedlogintime;

    // Only use "intelligent" evaluation method when the bot was started more than 5 times
    if (this.data.datafile.timesloggedin < 5) estimatedlogintime = ((this.data.advancedconfig.loginDelay * (Object.keys(this.data.logininfo).length - 1 - Controller.skippedaccounts.length)) / 1000) + 5; // 5 seconds tolerance
        else estimatedlogintime = ((this.data.datafile.totallogintime / this.data.datafile.timesloggedin) + (this.data.advancedconfig.loginDelay / 1000)) * (Object.keys(this.data.logininfo).length - Controller.skippedaccounts.length);

    let estimatedlogintimeunit = "seconds";
    if (estimatedlogintime > 60) { estimatedlogintime = estimatedlogintime / 60; estimatedlogintimeunit = "minutes"; }
    if (estimatedlogintime > 60) { estimatedlogintime = estimatedlogintime / 60; estimatedlogintimeunit = "hours"; }                                                                                                                                                                                                                                                                          // 🥚!

    logger("info", `Logging in... Estimated wait time: ${misc.round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`, false, false, logger.animation("loading"), true);
    if (checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<") this.stop(); // eslint-disable-line

};


/**
 * Attempts to log in all bot accounts which are currently offline one after another
 * Creates a new bot object for every new account and reuses existing one if possible
 */
Controller.prototype.login = function() {
    logger("debug", "Controller login(): Login requested, checking for any accounts currently offline...");

    // Iterate over all accounts in logininfo, use syncLoop() helper to make our job easier
    misc.syncLoop(Object.keys(this.data.logininfo).length, (loop, i) => {
        let k = Object.values(this.data.logininfo)[i];

        // Ignore account if it was skipped
        if (Controller.skippedaccounts.includes(k.accountName)) {
            logger("info", `[skippedaccounts] ${k.accountName} is in skippedaccounts array, skipping login request`, false, true);
            module.exports.skippednow.push(k.accountName);
            return;
        }

        // TODO: Check for connection loss timestamp when it is available and wait a bit before retrying a failed login. Maybe add reason why account was skipped to not reattempt steam guard login

        // Calculate wait time
        let waitTime = (this.info.lastLoginTimestamp + this.data.advancedconfig.loginDelay) - Date.now();
        if (waitTime < 0) waitTime = 0; // Cap wait time to positive numbers

        if (waitTime > 0) logger("info", `Waiting ${misc.round(waitTime / 1000, 2)} seconds... (advancedconfig loginDelay)`, false, true, logger.animation("waiting"));

        // Wait before starting to log in
        setTimeout(() => {

            // Check if no bot object entry exists for this account and create one
            if (!this.bots[k.accountName]) {
                logger("info", `Creating new bot object for ${k.accountName}...`, false, true, logger.animation("loading"));
                this.bots[k.accountName] = new Bot(this, i); // Create a new bot object for this account and store a reference to it

            } else {

                // Ignore iteration if account is currently not offline
                if (this.bots[k.accountName].status != "offline") return;
                logger("info", `Found existing bot object for ${k.accountName}! Reusing it...`, false, true, logger.animation("loading"));
            }

            // Generate steamGuardCode with shared secret if one was provided
            if (this.data.logininfo[k.accountName].sharedSecret) {
                logger("debug", `Found shared_secret for bot${i}! Generating AuthCode and adding it to logOnOptions...`);
                this.data.logininfo[k.accountName].steamGuardCode = SteamTotp.generateAuthCode(this.data.logininfo[k.accountName].sharedSecret);
            }

            // Login!
            this.bots[k.accountName]._loginToSteam();

            // Check if this bot is not offline anymore, resolve this iteration and update lastLoginTimestamp
            let accIsOnlineInterval = setInterval(() => {
                if (this.bots[k.accountName].status == "offline") return;

                // Keep waiting if we are on the last iteration and user object is not fully populated yet, this takes a few seconds after login
                if (i + 1 == Object.keys(this.data.logininfo).length && !this.bots[k.accountName].user.limitations) return logger("info", "Last account logged in, waiting for user object to populate...", false, true, logger.animation("waiting"));

                clearInterval(accIsOnlineInterval);
                this.info.lastLoginTimestamp = Date.now();

                // Populate this.main if we just logged in the first account
                if (Object.keys(this.bots)[0] == k.accountName) this.main = this.bots[k.accountName];

                logger("debug", `Controller login(): bot${i} changed status from offline to ${this.bots[k.accountName].status}! Continuing with next account...`);

                // Check for last iteration, call again and emit ready event
                if (i + 1 == Object.keys(this.data.logininfo).length) {
                    logger("debug", "Controller login(): Finished logging in all accounts! Calling myself again to check for any new accounts...");
                    this.login();
                    this._readyEvent();
                }

                // Continue with next iteration
                loop.next();
            }, 250);

        }, waitTime);
    });
};