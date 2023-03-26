/*
 * File: login.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 26.03.2023 19:15:44
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
 * Returns steam guard input time from steamGuard.js back to login.js to subtract it from readyafter time
 * @param {Number} arg Adds this time in ms to the steamGuardInputTime
 */
module.exports.steamGuardInputTimeFunc = (arg) => { // Small function to return new value from bot.js
    this.steamGuardInputTime += arg;
};


/**
  * Internal: Creates a new bot object for every account
  */
Controller.prototype._login = async function() {

    module.exports.steamGuardInputTime = 0;
    module.exports.accisloggedin       = true; // Var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account
    module.exports.skippednow          = [];   // Array to track which accounts have been skipped


    // Update global var
    botisloggedin = true;


    // Print ASCII art
    logger("", "", true);
    if (Math.floor(Math.random() * 100) <= 2) logger("", ascii.hellothereascii + "\n", true); // 2% chance
        else if (Math.floor(Math.random() * 100) <= 5) logger("", ascii.binaryascii + "\n", true); // 5% chance
        else logger("", ascii.ascii[Math.floor(Math.random() * ascii.ascii.length)] + "\n", true);

    logger("", "", true); // Put one line above everything that will come to make the output cleaner


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

            return process.send("stop()"); // Stop the bot as there is nothing more we can do
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
    if (checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<") process.send("stop()"); // eslint-disable-line


    // Start starting bot.js for each account
    logger("info", "Loading logininfo for each account...", false, true, logger.animation("loading"));

    Object.keys(this.data.logininfo).forEach((k, i) => { // Log all accounts in with the logindelay
        setTimeout(() => {
            let startnextinterval = setInterval(() => { // Run check every x ms

                // Check if previous account is logged in
                if (module.exports.accisloggedin == true && i == Object.keys(Controller.botobject).length + module.exports.skippednow.length || module.exports.accisloggedin == true && module.exports.skippednow.includes(i - 1)) { // I is being counted from 0, length from 1 -> checks if last iteration is as long as botobject
                    clearInterval(startnextinterval); // Stop checking

                    // Start ready check on last iteration
                    if (Object.keys(this.data.logininfo).length == i + 1) require("./ready.js").readyCheck(this.data.logininfo);

                    // If this iteration exists in the skippedaccounts array, automatically skip acc again
                    if (Controller.skippedaccounts.includes(i)) {
                        logger("info", `[skippedaccounts] Automatically skipped ${k}!`, false, true);
                        module.exports.skippednow.push(i);
                        return;
                    }

                    if (i > 0) logger("info", `Waiting ${this.data.advancedconfig.loginDelay / 1000} seconds... (advancedconfig loginDelay)`, false, true, logger.animation("waiting")); // First iteration doesn't need to wait duh


                    // Wait logindelay and then start bot.js with the account of this iteration
                    setTimeout(() => {
                        logger("info", `Starting bot.js for ${k}...`, false, true, logger.animation("loading"));

                        // Overwrite logininfo entry for this account with a properly formatted object
                        this.data.logininfo[i] = {
                            accountName: this.data.logininfo[k][0],
                            password: this.data.logininfo[k][1],
                            machineName: `${this.data.datafile.mestr}'s Comment Bot`,       // For steam-user
                            deviceFriendlyName: `${this.data.datafile.mestr}'s Comment Bot` // For steam-session
                        };

                        // If a shared secret was provided in the logininfo then add it to logOnOptions object
                        if (this.data.logininfo[k][2] && this.data.logininfo[k][2] != "" && this.data.logininfo[k][2] != "shared_secret") {
                            logger("debug", `Found shared_secret for ${k}! Generating AuthCode and adding it to logOnOptions...`);

                            this.data.logininfo[k]["steamGuardCode"] = SteamTotp.generateAuthCode(this.data.logininfo[k][2]);
                            this.data.logininfo[k]["steamGuardCodeForRelog"] = this.data.logininfo[k][2]; // Add raw shared_secret to obj as well to be able to access it more easily from relogAccount.js
                        }

                        this.bots[i] = new Bot(this, i); // Create a new bot object for this account and store a reference to it
                    }, this.data.advancedconfig.loginDelay * Number(i > 0)); // Ignore delay for first account
                }

            }, 250);
        }, (this.data.advancedconfig.loginDelay * (i - module.exports.skippednow.length)) * Number(i > 0)); // Wait loginDelay ms before checking if the next account is ready to be logged in if not first iteration. This should reduce load and ram usage as less intervals run at the same time (this gets more interesting when lots of accs are used)
    });
};