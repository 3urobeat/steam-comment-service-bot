/*
 * File: ready.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 16.10.2022 17:13:20
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



module.exports.plugins = {};

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
        let allAccountsInStorage = Object.keys(communityobject).length + login.skippednow.length == Object.keys(logininfo).length;       // Make sure all accounts were processed and are either logged in or were skipped
        let lastAccPopulated     = botobject[Object.keys(logininfo).length - 1] && botobject[Object.keys(logininfo).length - 1].steamID; // Make sure bot can only start when steamID is populated which sometimes takes a bit longer, causing issues below (see issue #135 for example)

        if (allAccountsInStorage && login.accisloggedin == true && lastAccPopulated) {
            clearInterval(readyinterval); // Stop checking if startup is done


            // Load plugins
            var plugins = await require("./helpers/loadPlugins.js").loadPlugins();
            module.exports.plugins = plugins; // Refresh exported obj


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
            if (Object.keys(plugins).length > 0) logger("", `${logger.colors.fgblack}>${logger.colors.reset} Successfully loaded ${Object.keys(plugins).length} plugins!`, true);


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
                tempArr.push(new SteamID(String(controller.botobject[i].steamID)).getSteamID64());

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


            // Run all loaded plugins
            Object.values(plugins).forEach((e) => {
                try {
                    logger("info", `Running plugin ${e.info.name} v${e.info.version} by ${e.info.author}...`, false, true, logger.animation("loading"));
                    e.run(botobject[0], botobject, communityobject);
                } catch (err) {
                    logger("error", `Error running plugin ${e.info.name}! Error:\n${err.stack}`);
                }
            });


            // Show information message about the login flow change
            logger("", "", true);
            logger("info", "Valve is changing the method of logging into Steam soon. The new system uses tokens which expire after 200 days, forcing you to **type in a Steam Guard Code every 200 days**.", true);
            logger("", "       This sucks but we have to accept it. (This change does not affect accounts you have provided a shared_secret for, they'll work just like before)", true);
            logger("", "       This bot will continue to support the old login style until it doesn't work anymore, any new accounts you add however will automatically use the new system.", true);
            logger("", "\n       If you wish to convert your accounts now to not run into issues when this method stops working, delete/rename your sentry files and restart the bot. You'll need to type in the Steam Guard Code for every account again.", true);
            logger("", "       You can find the sentry file location for your OS here: https://github.com/DoctorMcKay/node-steam-user#datadirectory", true);
            logger("", "", true);


            // Check tokens database for tokens that will soon expire
            require("./helpers/handleExpiringTokens.js").detectExpiringTokens(botobject, logininfo);


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