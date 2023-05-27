/*
 * File: ready.js
 * Project: steam-comment-service-bot
 * Created Date: 29.03.2023 12:23:29
 * Author: 3urobeat
 *
 * Last Modified: 27.05.2023 11:09:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const Controller = require("../controller");
const { round }  = require("../helpers/misc.js");


/**
 * Runs internal ready event code and emits ready event for plugins
 */
Controller.prototype._readyEvent = function() {

    // Start logging the ready message block
    logger("", " ", true);
    logger("", "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*", true);
    logger("", `${logger.colors.brfgmagenta}>${logger.colors.reset} ${logger.colors.brfgcyan}steam-comment-service-bot${logger.colors.reset} version ${logger.colors.brfgcyan}${this.data.datafile.versionstr}${logger.colors.reset} by ${this.data.datafile.mestr}`, true);


    // Calculate what the max amount of comments per account is and log it
    let maxCommentsOverall = this.data.config.maxOwnerComments; // Define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
    if (this.data.config.maxComments > this.data.config.maxOwnerComments) maxCommentsOverall = this.data.config.maxComments;

    let repeatedCommentsStr;
    if (maxCommentsOverall > 3) repeatedCommentsStr = `${logger.colors.underscore}${logger.colors.fgred}${round(maxCommentsOverall / this.getBots().length, 2)}`;
        else repeatedCommentsStr = round(maxCommentsOverall / this.getBots().length, 2);

    logger("", `${logger.colors.brfgblue}>${logger.colors.reset} ${this.getBots().length} total account(s) | ${repeatedCommentsStr} comments per account allowed`, true);


    // Display amount of proxies if any were used
    if (this.data.proxies.length > 1) { // 'null' will always be in the array (your own ip)
        logger("", `${logger.colors.fgcyan}>${logger.colors.reset} Using ${this.data.proxies.length} proxies | ${round(this.getBots().length / this.data.proxies.length, 2)} account(s) per proxy`, true);
    }


    // Calculate and display amount of limited accounts
    let limitedaccs = 0;
    let failedtocheck = 0;

    this.getBots().forEach((e, i) => {
        if (e.user.limitations && e.user.limitations.limited) { // Check if limitations obj is populated before accessing limited just to be sure. The ready event should not have been called if limitations is not populated but better safe than sorry
            limitedaccs++;
        } else {
            logger("debug", `Controller limitedCheck(): Failed to check if bot${e.index} is limited, showing it as unlimited...`);
            failedtocheck++;
        }

        // Check for last iteration
        if (i + 1 == this.getBots().length) {
            let failedtocheckmsg = "";
            if (failedtocheck > 0) failedtocheckmsg = `(Couldn't check ${failedtocheck} account(s))`;

            logger("", `${logger.colors.brfggreen}>${logger.colors.reset} ${limitedaccs}/${this.getBots().length} account(s) are ${logger.colors.fgred}limited${logger.colors.reset} ${failedtocheckmsg}`, true);
        }
    });


    // Log warning message if automatic updater is turned off
    if (this.data.advancedconfig.disableAutoUpdate) logger("", `${logger.colors.bgred}${logger.colors.fgblack}>${logger.colors.reset} Automatic updating is ${logger.colors.underscore}${logger.colors.fgred}turned off${logger.colors.reset}!`, true);


    // Log amount of loaded plugins
    if (Object.keys(this.pluginSystem.pluginList).length > 0) logger("", `${logger.colors.fgblack}>${logger.colors.reset} Successfully loaded ${Object.keys(this.pluginSystem.pluginList).length} plugins!`, true);


    // Log which games the main and child bots are playing
    let playinggames = "";
    if (this.data.config.playinggames[1]) playinggames = `(${this.data.config.playinggames.slice(1, this.data.config.playinggames.length)})`;

    logger("", `${logger.colors.brfgyellow}>${logger.colors.reset} Playing status: ${logger.colors.fggreen}${this.data.config.playinggames[0]}${logger.colors.reset} ${playinggames}`, true);


    // Calculate time the bot took to start
    const bootend = Date.now();
    this.info.readyAfter = ((bootend - this.info.bootStartTimestamp) - this.info.steamGuardInputTime) / 1000;

    let readyAfter = this.info.readyAfter;
    let readyAfterUnit = "seconds";
    if (readyAfter > 60) { readyAfter = readyAfter / 60; readyAfterUnit = "minutes"; }
    if (readyAfter > 60) { readyAfter = readyAfter / 60; readyAfterUnit = "hours"; }

    logger("", `${logger.colors.brfgred}>${logger.colors.reset} Ready after ${round(readyAfter, 2)} ${readyAfterUnit}!`, true);
    this.data.datafile.timesloggedin++;
    this.data.datafile.totallogintime += this.info.readyAfter / this.getBots("*").length; // Get rough logintime of only one account


    // Finished logging ready message
    logger("", "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*", true);
    logger("", " ", true);


    // Show disclaimer message to not misuse this bot if firststart
    if (this.data.datafile.firststart) logger("", `${logger.colors.reset}[${logger.colors.fgred}Disclaimer${logger.colors.reset}]: Please don't misuse this bot by spamming or posting malicious comments. Your accounts can get banned from Steam if you do that.\n              You are responsible for the actions of your bot instance.\n`, true);


    // Log amount of skippedaccounts
    if (this.info.skippedaccounts.length > 0) logger("info", `Skipped Accounts: ${this.info.skippedaccounts.length}/${Object.keys(this.data.logininfo).length}\n`, true);


    // Log amount of warnings displayed by dataCheck and remind the user to take a look
    if (this.info.startupWarnings > 0) logger("warn", `The bot started with ${this.info.startupWarnings} warning(s)! Please scroll up and read the warnings displayed during startup!\n`, true);


    // Please star my repo :)
    if (this.data.datafile.firststart) logger("", "If you like my work please consider giving my repository a star! It helps me alot and I'd really appreciate it!\nhttps://github.com/HerrEurobeat/steam-comment-service-bot\n", true);


    // Log extra messages that were suppressed during login
    this._loggerLogAfterReady();


    // Refresh backups in cache.json
    this.data.refreshCache();


    // Friendlist capacity check for all accounts
    this.getBots().forEach((e) => {
        this.friendListCapacityCheck(e, (remaining) => {
            if (remaining && remaining < 25) logger("warn", `The friendlist space of bot${e} is running low! (${remaining} remaining)`);
        });
    });


    // Message owners if firststart is true that the bot just updated itself
    if (this.data.datafile.firststart) this.data.cachefile.ownerid.forEach(e => this.main.sendChatMessage(this.main, { steamID64: e }, `I have updated myself to version ${this.data.datafile.versionstr}!\nWhat's new: ${this.data.datafile.whatsnew}`));


    // Check for friends who haven't requested comments in config.unfriendtime days every 60 seconds and unfriend them if unfriendtime is > 0
    if (this.data.config.unfriendtime > 0) {
        let lastcommentUnfriendCheck = Date.now(); // This is useful because intervals can get imprecise over time

        setInterval(() => {
            if (lastcommentUnfriendCheck + 60000 > Date.now()) return; // Last check is more recent than 60 seconds
            lastcommentUnfriendCheck = Date.now();

            this._lastcommentUnfriendCheck();
        }, 60000); // 60 seconds
    }


    // Write logintime stuff to data.json
    logger("debug", "Writing logintime to data.json...", false, true, logger.animation("loading"));
    this.data.datafile.totallogintime = round(this.data.datafile.totallogintime, 2);
    this.data.datafile.firststart = false;

    fs.writeFile(srcdir + "/data/data.json", JSON.stringify(this.data.datafile, null, 4), err => { // Write changes
        if (err) logger("error", "change this.data.datafile to false error: " + err);
    });


    // Print startup complete message and erase it after 5 sec
    setTimeout(() => {
        logger("info", "Startup complete!", false, true, ["✅"]);

        setTimeout(() => {
            logger("", "", true, true); // Clear out last remove message
        }, 5000);
    }, 2000);


    // Emit ready event for plugins to use
    this.events.emit("ready");

};