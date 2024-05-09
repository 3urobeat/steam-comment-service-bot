/*
 * File: dataCheck.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-04 11:28:44
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const os                = require("os");
const steamIdResolver   = require("steamid-resolver");
const { EPersonaState } = require("steam-user");

const DataManager = require("./dataManager.js");


/**
 * Checks currently loaded data for validity and logs some recommendations for a few settings.
 * @returns {Promise.<null|string>} Resolves with `null` when all settings have been accepted, or with a string containing reasons if a setting has been reset. On reject you should terminate the application. It is called with a String specifying the failed check.
 */
DataManager.prototype.checkData = function() {
    return new Promise((resolve, reject) => {
        logger("info", "Running datachecks and displaying config recommendations...", false, true, logger.animation("loading"));

        // Shorthander for checks below to log warning and count it. Must be an ES6 function to not create a new context for 'this.' to work!
        const logWarn = ((a, b, c) => { logger(a, b, c); this.controller.info.startupWarnings++; }); // I originally wanted to use iArguments instead of hardcoding a, b, c but that didn't work out easily so I digress

        this.controller.info.startupWarnings = 0; // Reset value to start fresh if this module should be integrated into a plugin or something like that

        let resolveMsg = ""; // Collects all warnings from value resets to resolve with them at the end


        // Display warning/notice if user is running in beta mode. Don't count this to startupWarnings
        if (this.datafile.branch == "beta-testing") {
            logger("", "", true, true); // Add one empty line that only appears in output.txt
            logger("", `${logger.colors.reset}[${logger.colors.fgred}Notice${logger.colors.reset}] Your updater and bot is running in beta mode. These versions are often unfinished and can be unstable.\n         If you would like to switch, open data.json and change 'beta-testing' to 'master'.\n         If you find an error or bug please report it: https://github.com/3urobeat/steam-comment-service-bot/issues/new/choose\n`, true);
        }


        // Filter all invalid ownerids which got replaced with null by processData()
        if (this.cachefile.ownerid.filter(e => e != null).length == 0) {
            logWarn("error", "Error: You did not set at least one valid ownerid in config.json! Aborting!");
            return reject(new Error("No ownerid found!"));
        }


        // Check config for default value leftovers when the bot is not running on my machines
        if ((process.env.LOGNAME !== "tomg") || (!["Tomkes-PC", "Tomkes-Server", "Tomkes-Thinkpad", "Tomkes-Thinkpad-Z13"].includes(os.hostname()))) {
            let write = false;

            if (this.config.owner.includes(this.datafile.mestr))   { this.config.owner = ""; write = true; }
            if (this.config.ownerid.includes("76561198260031749")) { this.config.ownerid.splice(this.config.ownerid.indexOf("76561198260031749"), 1); write = true; }
            if (this.config.ownerid.includes("3urobeat"))          { this.config.ownerid.splice(this.config.ownerid.indexOf("3urobeat"), 1); write = true; }

            if (write) this.writeConfigToDisk();
        }


        // Check config values:
        this.config.maxRequests      = Math.round(this.config.maxRequests); // Round maxRequests number every time to avoid user being able to set weird numbers (who can comment 4.8 times? right - no one)
        this.config.maxOwnerRequests = Math.round(this.config.maxOwnerRequests);

        let maxRequestsOverall = this.config.maxOwnerRequests; // Define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
        if (this.config.maxRequests > this.config.maxOwnerRequests) maxRequestsOverall = this.config.maxRequests;

        if (this.logininfo.length == 0) { // Check real quick if logininfo is empty
            logWarn("error", `${logger.colors.fgred}Your accounts.txt or logininfo.json file doesn't seem to contain any valid login credentials! Aborting...`, true);
            return reject(new Error("No logininfo found!"));
        }
        if (this.config.maxOwnerRequests < 1) {
            logWarn("info", `${logger.colors.fgred}Your maxOwnerRequests value in config.json can't be smaller than 1! Automatically setting it to 1...`, true);
            resolveMsg += "Your maxOwnerRequests value in config.json can't be smaller than 1! Automatically setting it to 1...\n";
            this.config.maxOwnerRequests = 1;
        }
        if (this.config.requestDelay <= 500) {
            logWarn("warn", `${logger.colors.fgred}Your requestDelay is set to a way too low value!\n       Using a requestDelay of 500ms or less will result in an instant cooldown from Steam and therefore a failed comment request.\n       Automatically setting it to the default value of 15 seconds...`, true);
            resolveMsg += "Your requestDelay is set to a way too low value!\n       Using a requestDelay of 500ms or less will result in an instant cooldown from Steam and therefore a failed comment request.\n       Automatically setting it to the default value of 15 seconds...\n";
            this.config.requestDelay = 15000;
        }
        if (this.config.requestDelay / (maxRequestsOverall / 2) < 1250) {
            logWarn("warn", `${logger.colors.fgred}You have raised maxRequests or maxOwnerRequests but I would recommend to raise the requestDelay further. Not increasing it raises the probability of getting cooldowns from Steam, leading to failed requests.`, true);
        }
        /* If (this.config.requestDelay * maxRequestsOverall > 2147483647) { // Check for 32-bit integer limit for commentcmd timeout --- Disabled because that calculation got removed during some rework in the past
            logWarn("error", `${logger.colors.fgred}Your maxRequests and/or maxOwnerRequests and/or requestDelay value in the config are too high.\n        Please lower these values so that 'requestDelay * maxRequests' is not bigger than 2147483647 (32-bit integer limit).\n\nThis will otherwise cause an error when trying to comment. Aborting...\n`, true);
            this.config.requestDelay = 15000;
            return reject(new Error("requestDelay times maxRequests exceeds 32bit integer limit!"));
        } */
        if (this.config.randomizeAccounts && this.logininfo.length <= 5 && maxRequestsOverall > this.logininfo.length * 2) {
            logWarn("warn", `${logger.colors.fgred}I wouldn't recommend using randomizeAccounts with 5 or less accounts when each account can/has to comment multiple times. The chance of an account getting a cooldown is higher.\n       Please make sure your requestDelay is set adequately to reduce the chance of this happening.`, true);
        }
        if (!Object.keys(this.lang).includes(this.config.defaultLanguage.toLowerCase())) {
            logWarn("warn", `${logger.colors.fgred}You've set an unsupported language as defaultLanguage in your config.json. Please choose one of the following: ${Object.keys(this.lang).join(", ")}.\n       Defaulting to English...`, true);
            resolveMsg += `You've set an unsupported language as defaultLanguage in your config.json. Please choose one of the following: ${Object.keys(this.lang).join(", ")}. Defaulting to English...\n`;
            this.config.defaultLanguage = "english";
        }
        if (this.advancedconfig.loginDelay < 500) { // Don't allow a logindelay below 500ms
            logWarn("error", `${logger.colors.fgred}I won't allow a logindelay below 500ms as this will probably get you blocked by Steam nearly instantly. I recommend setting it to 2500.\n        If you are using one proxy per account you might try setting it to 500 (on your own risk!). Aborting...`, true);
            this.advancedconfig.loginDelay = 2500;
            return reject(new Error("Logindelay is set below 500ms!"));
        }
        if (EPersonaState[this.advancedconfig.onlineStatus] == undefined) { // Explicitly check for undefined because Offline (0) resolves to false
            logWarn("warn", `You've set an invalid value '${this.advancedconfig.onlineStatus}' as 'onlineStatus' in 'advancedconfig.json'! Defaulting to 'Online'...`);
            this.advancedconfig.onlineStatus = "Online";
        }
        if (EPersonaState[this.advancedconfig.childAccOnlineStatus] == undefined) { // Explicitly check for undefined because Offline (0) resolves to false
            logWarn("warn", `You've set an invalid value '${this.advancedconfig.childAccOnlineStatus}' as 'childAccOnlineStatus' in 'advancedconfig.json'! Defaulting to 'Online'...`);
            this.advancedconfig.childAccOnlineStatus = "Online";
        }
        if (this.advancedconfig.lastQuotesSize >= this.quotes) { // Force clear lastQuotes array if we have less or equal amount of quotes to choose from than lastQuotesSize to avoid infinite loop
            logWarn("warn", "lastQuoteSize in 'advancedconfig.json' is greater or equal than the amount of quotes found in 'quotes.txt'. I'm therefore unable to filter recently used quotes when choosing a new one!", true);
        }


        // Check language for too long strings and display warning. This will of course not catch replacements that happen at runtime but it's better than nothing
        Object.values(this.lang).forEach((translation) => {
            Object.keys(translation).forEach((e) => {
                if (translation[e].length > 500) logWarn("warn", `Your language string '${e}' of '${translation.langname}' is ${translation[e].length} chars long! I will need to cut in parts to send it in the Steam Chat! Please consider reducing it to less than 500 chars.`, true);
            });
        });


        global.checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<";

        // Check if owner link is correct
        if (!this.config.owner.includes("steamcommunity.com")) {
            logWarn("warn", "You haven't set a correct owner link to your profile in the config!\n       Please add this to refer to yourself as the owner and operator of this bot.", true);

        } else {

            try {
                // Check if user provided /profiles/steamID64 link or /id/customURL link
                if (this.config.owner.includes("/profiles/")) {
                    steamIdResolver.steamID64ToFullInfo(this.config.owner, (err, ownerResult) => {
                        if (err == "The specified profile could not be found.") { // If the profile couldn't be found display specific message
                            return logWarn("warn", "You haven't set a correct owner link to your profile in the config!\n       Please add this to refer to yourself as the owner and operator of this bot.\n       Error: " + err, true);
                        } else {
                            if (err) return logger("error", "Error checking if owner is valid: " + err); // If a different error then display a generic message with the error
                        }

                        this.cachefile["ownerlinkid"] = ownerResult.steamID64[0]; // Refresh ownerlinkid in cache.json

                        logger("debug", `DataManager checkData(): Successfully checked owner link. customURL: ${ownerResult.customURL[0]}`);
                    });

                } else {

                    steamIdResolver.customUrlToSteamID64(this.config.owner, (err, ownerResult) => {
                        if (err == "The specified profile could not be found.") { // If the profile couldn't be found display specific message
                            return logWarn("warn", "You haven't set a correct owner link to your profile in the config!\n       Please add this to refer to yourself as the owner and operator of this bot.\n       Error: " + err, true);
                        } else {
                            if (err) return logger("error", "Error checking if owner is valid: " + err); // If a different error then display a generic message with the error
                        }

                        this.cachefile["ownerlinkid"] = ownerResult; // Refresh ownerlinkid in cache.json

                        logger("debug", `DataManager checkData(): Successfully checked owner link. steamID64: ${ownerResult}`);
                    });
                }

            } catch (err) {
                if (err) return logger("error", "error getting owner profile xml info: " + err, true);
            }
        }


        // Resolve promise if this point was reached
        logger("debug", "DataManager checkData(): All checks ran successfully! Resolving promise...");
        resolve(resolveMsg || null);
    });
};
