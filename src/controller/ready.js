/*
 * File: ready.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 23.03.2023 22:06:38
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



/**
 * Checks if the startup is completed and shows some messages
 * @param {Object} logininfo The logininfo object imported in login.js
 */
module.exports.readyCheck = (logininfo) => {
    var fs         = require("fs");
    var SteamID    = require("steamid");

    var controller = require("./controller.js");
    var login      = require("./login.js");
    var round      = require("./helpers/round.js");
    var cache      = require("../data/cache.json");

    var { botobject, communityobject } = controller; // Import these two directly for simplicity

    var readyafter = 0;


    var readyinterval = setInterval(async () => { // Run ready check every x ms
        let allAccountsInStorage = Object.keys(communityobject).length + login.skippednow.length == Object.keys(logininfo).length; // Make sure all accounts were processed and are either logged in or were skipped
        let lastAccIndex         = Object.keys(logininfo).length - login.skippednow.length - 1;                                    // Calculate index of last account
        let lastAccPopulated     = Object.values(botobject)[lastAccIndex] && Object.values(botobject)[lastAccIndex].steamID;       // Make sure bot can only start when steamID is populated which sometimes takes a bit longer, causing issues below (see issue #135 for example)

        if (allAccountsInStorage && login.accisloggedin == true && lastAccPopulated) {
            clearInterval(readyinterval); // Stop checking if startup is done


            // Start logging the ready message block
            logger("", " ", true);
            logger("", "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*", true);
            logger("", `${logger.colors.brfgmagenta}>${logger.colors.reset} ${logger.colors.brfgcyan}steam-comment-service-bot${logger.colors.reset} version ${logger.colors.brfgcyan}${extdata.versionstr}${logger.colors.reset} by ${extdata.mestr}`, true);


            // Calculate what the max amount of comments per account is and log it
            var maxCommentsOverall = config.maxOwnerComments; // Define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
            if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments;

            if (maxCommentsOverall > 3) var repeatedCommentsStr = `${logger.colors.underscore}${logger.colors.fgred}${round(maxCommentsOverall / Object.keys(botobject).length, 2)}`;
                else var repeatedCommentsStr = round(maxCommentsOverall / Object.keys(botobject).length, 2);

            logger("", `${logger.colors.brfgblue}>${logger.colors.reset} ${Object.keys(communityobject).length} total account(s) | ${repeatedCommentsStr} comments per account allowed`, true);


            // Display amount of proxies if any were used
            if (login.proxies.length > 1) { // 'null' will always be in the array (your own ip)
                logger("", `${logger.colors.fgcyan}>${logger.colors.reset} Using ${login.proxies.length} proxies | ${round(Object.keys(communityobject).length / login.proxies.length, 2)} account(s) per proxy`, true);
            }


            // Display amount of limited accounts
            require("./helpers/limitedcheck.js").check(botobject, (limited, failed) => {
                if (failed > 0) var failedtocheckmsg = `(Couldn't check ${failed} account(s))`;
                    else var failedtocheckmsg = "";

                logger("", `${logger.colors.brfggreen}>${logger.colors.reset} ${limited}/${Object.keys(botobject).length} account(s) are ${logger.colors.fgred}limited${logger.colors.reset} ${failedtocheckmsg}`, true);
            });


            // Log warning message if automatic updater is turned off
            if (advancedconfig.disableAutoUpdate) logger("", `${logger.colors.bgred}${logger.colors.fgblack}>${logger.colors.reset} Automatic updating is ${logger.colors.underscore}${logger.colors.fgred}turned off${logger.colors.reset}!`, true);


            // Log amount of loaded plugins
            if (Object.keys(controller.pluginSystem.pluginList).length > 0) logger("", `${logger.colors.fgblack}>${logger.colors.reset} Successfully loaded ${Object.keys(controller.pluginSystem.pluginList).length} plugins!`, true);


            // Log which games the main and child bots are playing
            var playinggames = "";
            if (config.playinggames[1]) var playinggames = `(${config.playinggames.slice(1, config.playinggames.length)})`;
            logger("", `${logger.colors.brfgyellow}>${logger.colors.reset} Playing status: ${logger.colors.fggreen}${config.playinggames[0]}${logger.colors.reset} ${playinggames}`, true);


            // Calculate time the bot took to start
            const bootend = Date.now();
            readyafter = ((bootend - controller.bootstart) - login.steamGuardInputTime) / 1000;
            module.exports.readyafter = readyafter; // Refresh exported variable to now allow cmd usage

            var readyafterunit = "seconds";
            if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "minutes"; }
            if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "hours"; }

            logger("", `${logger.colors.brfgred}>${logger.colors.reset} Ready after ${round(readyafter, 2)} ${readyafterunit}!`, true);
            extdata.timesloggedin++;
            extdata.totallogintime += readyafter / Object.keys(communityobject).length; // Get rough logintime of only one account


            // Finished logging ready message
            logger("", "*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*", true);
            logger("", " ", true);


            // Show disclaimer message to not misuse this bot if firststart
            if (extdata.firststart) logger("", `${logger.colors.reset}[${logger.colors.fgred}Disclaimer${logger.colors.reset}]: Please don't misuse this bot by spamming or posting malicious comments. Your accounts can get banned from Steam if you do that.\n              You are responsible for the actions of your bot instance.\n`, true);


            // Log amount of skippedaccounts
            if (controller.skippedaccounts.length > 0) logger("info", `Skipped Accounts: ${controller.skippedaccounts.length}/${Object.keys(logininfo).length}\n`, true);


            // Please star my repo :)
            if (extdata.firststart) logger("", "If you like my work please consider giving my repository a star! I would really appreciate it!\nhttps://github.com/HerrEurobeat/steam-comment-service-bot\n", true);


            // Log extra messages that were suppressed during login
            logger("debug", "Logging suppressed logs...", false, true, logger.animation("loading"));
            controller.readyafterlogs.forEach(e => { logger(e[0], e[1], e[2], e[3], e[4]); }); // Log suppressed logs


            // Refresh cache of bot account ids, check if they inflict with owner settings
            logger("debug", "Refreshing cache of bot account ids...", false, true, logger.animation("loading"));
            let tempArr = [];

            Object.keys(botobject).forEach((e, i) => {
                tempArr.push(new SteamID(String(Object.values(botobject)[i].steamID)).getSteamID64()); // Use Object.values(obj)[index] to check by index, not by botindex to accomodate for skipped accounts

                // Check if this bot account is listed as an owner id and display warning
                if (cache.ownerid.includes(tempArr[i])) logger("warn", `You provided an ownerid in the config that points to a bot account used by this bot! This is not allowed.\n       Please change id ${tempArr[i]} to point to your personal steam account!`, true);

                // Write tempArr to cachefile on last iteration
                if (Object.keys(botobject).length == i + 1) {
                    cache["botaccid"] = tempArr;

                    if (tempArr.includes(cache.ownerlinkid)) logger("warn", "The owner link you set in the config points to a bot account used by this bot! This is not allowed.\n       Please change the link to your personal steam account!", true);
                }
            });


            // Add backups to cache.json
            logger("debug", "Writing backups to cache.json...", false, true, logger.animation("loading"));
            cache["configjson"] = config;
            cache["advancedconfigjson"] = advancedconfig;
            cache["datajson"] = extdata;

            fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cache, null, 4), err => {
                if (err) logger("error", "error writing file backups to cache.json: " + err);
            });


            // Friendlist capacity check
            Object.keys(botobject).forEach((e) => {
                require("./helpers/friendlist.js").friendlistcapacitycheck(parseInt(e), (remaining) => {
                    if (remaining < 25) {
                        logger("warn", `The friendlist space of bot${e} is running low! (${remaining} remaining)`);
                    }
                });
            });


            // Message owners if firststart is true that the bot just updated itself
            if (extdata.firststart) {
                cachefile.ownerid.forEach(e => {
                    botobject[0].chat.sendFriendMessage(e, `I have updated myself to version ${extdata.versionstr}!\nWhat's new: ${extdata.whatsnew}`);
                });
            }


            // Check for friends who haven't requested comments in config.unfriendtime days every 60 seconds and unfriend them if unfriendtime is > 0
            if (config.unfriendtime > 0) {
                let lastcommentUnfriendCheck = Date.now(); // This is useful because intervals can get imprecise over time

                setInterval(() => {
                    if (lastcommentUnfriendCheck + 60000 > Date.now()) return; // Last check is more recent than 60 seconds
                    lastcommentUnfriendCheck = Date.now();

                    logger("debug", "60 seconds passed, calling lastcommentUnfriendCheck()...");

                    require("./helpers/friendlist.js").lastcommentUnfriendCheck();
                }, 60000); // 60 seconds
            }


            // Write logintime stuff to data.json
            logger("debug", "Writing logintime to data.json...", false, true, logger.animation("loading"));
            extdata.totallogintime = round(extdata.totallogintime, 2);
            extdata.firststart = false;

            fs.writeFile(srcdir + "/data/data.json", JSON.stringify(extdata, null, 4), err => { // Write changes
                if (err) logger("error", "change extdata to false error: " + err);
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
                setTimeout(() => botobject[0].chat.sendFriendMessage(e, loginFlowMsgs[0]), 5000);  // Delay msgs a lot to make sure everyone receives them as Steam looovees to block long-ish msgs
                setTimeout(() => botobject[0].chat.sendFriendMessage(e, loginFlowMsgs[1]), 15000);
            });


            // Check tokens database for tokens that will soon expire
            require("../sessions/helpers/handleExpiringTokens.js").detectExpiringTokens(botobject, logininfo);


            // Print startup complete message and erase it after 5 sec
            setTimeout(() => {
                logger("info", "Startup complete!", false, true, ["✅"]);

                setTimeout(() => {
                    logger("", "", true, true); // Clear out last remove message
                }, 5000);
            }, 2000);
        }
    }, 500);
};