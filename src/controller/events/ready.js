/*
 * File: ready.js
 * Project: steam-comment-service-bot
 * Created Date: 29.03.2023 12:23:29
 * Author: 3urobeat
 *
 * Last Modified: 29.03.2023 18:13:40
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
    let maxCommentsOverall = config.maxOwnerComments; // Define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
    if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments;

    if (maxCommentsOverall > 3) var repeatedCommentsStr = `${logger.colors.underscore}${logger.colors.fgred}${round(maxCommentsOverall / Object.keys(this.bots).length, 2)}`;
        else var repeatedCommentsStr = round(maxCommentsOverall / Object.keys(this.bots).length, 2);

    logger("", `${logger.colors.brfgblue}>${logger.colors.reset} ${Object.keys(this.bots).length} total account(s) | ${repeatedCommentsStr} comments per account allowed`, true);


    // Display amount of proxies if any were used
    if (this.data.proxies.length > 1) { // 'null' will always be in the array (your own ip)
        logger("", `${logger.colors.fgcyan}>${logger.colors.reset} Using ${this.data.proxies.length} proxies | ${round(Object.keys(this.bots).length / this.data.proxies.length, 2)} account(s) per proxy`, true);
    }


    // Display amount of limited accounts
    require("../helpers/limitedcheck.js").check(this.bots, (limited, failed) => {
        let failedtocheckmsg = "";
        if (failed > 0) failedtocheckmsg = `(Couldn't check ${failed} account(s))`;

        logger("", `${logger.colors.brfggreen}>${logger.colors.reset} ${limited}/${Object.keys(this.bots).length} account(s) are ${logger.colors.fgred}limited${logger.colors.reset} ${failedtocheckmsg}`, true);
    });


    // Log warning message if automatic updater is turned off
    if (advancedconfig.disableAutoUpdate) logger("", `${logger.colors.bgred}${logger.colors.fgblack}>${logger.colors.reset} Automatic updating is ${logger.colors.underscore}${logger.colors.fgred}turned off${logger.colors.reset}!`, true);


    // Log amount of loaded plugins
    if (Object.keys(this.pluginSystem.pluginList).length > 0) logger("", `${logger.colors.fgblack}>${logger.colors.reset} Successfully loaded ${Object.keys(this.pluginSystem.pluginList).length} plugins!`, true);


    // Log which games the main and child bots are playing
    let playinggames = "";
    if (config.playinggames[1]) playinggames = `(${config.playinggames.slice(1, config.playinggames.length)})`;

    logger("", `${logger.colors.brfgyellow}>${logger.colors.reset} Playing status: ${logger.colors.fggreen}${config.playinggames[0]}${logger.colors.reset} ${playinggames}`, true);


    // Calculate time the bot took to start
    const bootend = Date.now();
    this.info.readyAfter = ((bootend - this.info.bootStartTimestamp) - this.info.steamGuardInputTime) / 1000;

    let readyAfter = this.info.readyAfter;
    let readyAfterUnit = "seconds";
    if (readyAfter > 60) { readyAfter = readyAfter / 60; readyAfterUnit = "minutes"; }
    if (readyAfter > 60) { readyAfter = readyAfter / 60; readyAfterUnit = "hours"; }

    logger("", `${logger.colors.brfgred}>${logger.colors.reset} Ready after ${round(readyAfter, 2)} ${readyAfterUnit}!`, true);
    this.data.datafile.timesloggedin++;
    this.data.datafile.totallogintime += this.info.readyAfter / Object.keys(this.bots).length; // Get rough logintime of only one account


    // Finished logging ready message
    logger("", "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*", true);
    logger("", " ", true);


    // Show disclaimer message to not misuse this bot if firststart
    if (this.data.datafile.firststart) logger("", `${logger.colors.reset}[${logger.colors.fgred}Disclaimer${logger.colors.reset}]: Please don't misuse this bot by spamming or posting malicious comments. Your accounts can get banned from Steam if you do that.\n              You are responsible for the actions of your bot instance.\n`, true);


    // Log amount of skippedaccounts
    if (Controller.skippedaccounts.length > 0) logger("info", `Skipped Accounts: ${Controller.skippedaccounts.length}/${Object.keys(this.data.logininfo).length}\n`, true);


    // Please star my repo :)
    if (this.data.datafile.firststart) logger("", "If you like my work please consider giving my repository a star! It helps me alot and I'd really appreciate it!\nhttps://github.com/HerrEurobeat/steam-comment-service-bot\n", true);


    // Log extra messages that were suppressed during login
    logger("debug", "Logging suppressed logs...", false, true, logger.animation("loading"));
    this.readyafterlogs.forEach(e => { logger(e[0], e[1], e[2], e[3], e[4]); }); // Log suppressed logs


    // Refresh backups in cache.json
    this.data.refreshCache();


    // Friendlist capacity check
    Object.keys(this.bots).forEach((e) => {
        require("../helpers/friendlist.js").friendlistcapacitycheck(parseInt(e), (remaining) => {
            if (remaining < 25) {
                logger("warn", `The friendlist space of bot${e} is running low! (${remaining} remaining)`);
            }
        });
    });


    // Message owners if firststart is true that the bot just updated itself
    if (this.data.datafile.firststart) cachefile.ownerid.forEach(e => this.main.chat.sendFriendMessage(e, `I have updated myself to version ${this.data.datafile.versionstr}!\nWhat's new: ${this.data.datafile.whatsnew}`));


    // Check for friends who haven't requested comments in config.unfriendtime days every 60 seconds and unfriend them if unfriendtime is > 0
    if (config.unfriendtime > 0) {
        let lastcommentUnfriendCheck = Date.now(); // This is useful because intervals can get imprecise over time

        setInterval(() => {
            if (lastcommentUnfriendCheck + 60000 > Date.now()) return; // Last check is more recent than 60 seconds
            lastcommentUnfriendCheck = Date.now();

            logger("debug", "60 seconds passed, calling lastcommentUnfriendCheck()...");

            require("../helpers/friendlist.js").lastcommentUnfriendCheck();
        }, 60000); // 60 seconds
    }


    // Write logintime stuff to data.json
    logger("debug", "Writing logintime to data.json...", false, true, logger.animation("loading"));
    this.data.datafile.totallogintime = round(this.data.datafile.totallogintime, 2);
    this.data.datafile.firststart = false;

    fs.writeFile(srcdir + "/data/data.json", JSON.stringify(this.data.datafile, null, 4), err => { // Write changes
        if (err) logger("error", "change this.data.datafile to false error: " + err);
    });


    // Show information message and message all owners about the login flow change in 2.13.0
    let loginFlowMsgs = [ // Store msgs in an array to easily send them seperately to avoid Steam chat cooldowns
        "IMPORTANT:\nValve changed the method of logging in into Steam. The new system uses tokens which expire after 200 days, forcing you to **type in a Steam Guard Code every 200 days** (won't affect accounts with shared_secret).\nWith the upcoming version 2.13.0 this bot **will remove support for the old system** as Steam and the steam-user library dropped support for it as well.",
        "If you haven't already followed the previous message displayed on start to convert your accs: Delete your sentry files and restart the bot. You can find the location for your OS here: https://github.com/DoctorMcKay/node-steam-user#datadirectory\nIf you don't do this now your bot won't start after automatically updating to 2.13 as it must wait for you to input your Steam Guard Codes. Please do this now to avoid inconveniences later."
    ];

    logger("", "", true);
    logger("warn", loginFlowMsgs[0], true);
    logger("",     loginFlowMsgs[1], true);
    logger("", "", true);

    cachefile.ownerid.forEach(e => {
        setTimeout(() => this.main.chat.sendFriendMessage(e, loginFlowMsgs[0]), 5000);  // Delay msgs a lot to make sure everyone receives them as Steam looovees to block long-ish msgs
        setTimeout(() => this.main.chat.sendFriendMessage(e, loginFlowMsgs[1]), 15000);
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