/*
 * File: customUpdateRules.js
 * Project: steam-comment-service-bot
 * Created Date: 22.02.2022 17:39:21
 * Author: 3urobeat
 *
 * Last Modified: 22.05.2022 15:21:42
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


/**
 * Custom update rules for a few files (gets called by downloadupdate.js)
 */
module.exports.customUpdateRules = (compatibilityfeaturedone, oldconfig, oldadvancedconfig, oldextdata, callback) => {
    // Config.json
    logger("", `${logger.colors.fgyellow}Clearing cache of config.json...`, true, false, logger.animation("loading"));

    delete require.cache[require.resolve(srcdir + "/../config.json")]; // Delete cache
    let newconfig = require(srcdir + "/../config.json");

    logger("", `${logger.colors.fgyellow}Transferring your changes to new config.json...`, true, false, logger.animation("loading"));

    Object.keys(newconfig).forEach(e => {
        if (!Object.keys(oldconfig).includes(e)) return; // Config value seems to be new so don't bother trying to set it to something (which would probably be undefined anyway)

        newconfig[e] = oldconfig[e]; // Transfer setting
    });

    // Get arrays on one line
    var stringifiedconfig = JSON.stringify(newconfig, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
        if(v instanceof Array)
        return JSON.stringify(v);
        return v;
    }, 4)
        .replace(/"\[/g, "[")
        .replace(/\]"/g, "]")
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    logger("", `${logger.colors.fgyellow}Writing new data to config.json...`, true, false, logger.animation("loading"));
    fs.writeFile(srcdir + "/../config.json", stringifiedconfig, err => { // Write the changed file
        if (err) {
            logger("error", `Error writing changes to config.json: ${err}`, true);
        }
    });


    // Advancedconfig.json
    logger("", `${logger.colors.fgyellow}Clearing cache of advancedconfig.json...`, true, false, logger.animation("loading"));

    delete require.cache[require.resolve(srcdir + "/../advancedconfig.json")]; // Delete cache
    let newadvancedconfig = require(srcdir + "/../advancedconfig.json");

    logger("", `${logger.colors.fgyellow}Transferring your changes to new advancedconfig.json...`, true, false, logger.animation("loading"));

    Object.keys(newadvancedconfig).forEach(e => {
        if (!Object.keys(oldadvancedconfig).includes(e)) return; // Config value seems to be new so don't bother trying to set it to something (which would probably be undefined anyway)

        newadvancedconfig[e] = oldadvancedconfig[e]; // Transfer setting
    });

    // Get arrays on one line
    var stringifiedadvancedconfig = JSON.stringify(newadvancedconfig, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
        if(v instanceof Array)
        return JSON.stringify(v);
        return v;
    }, 4)
        .replace(/"\[/g, "[")
        .replace(/\]"/g, "]")
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    logger("", `${logger.colors.fgyellow}Writing new data to advancedconfig.json...`, true, false, logger.animation("loading"));
    fs.writeFile(srcdir + "/../advancedconfig.json", stringifiedadvancedconfig, err => { // Write the changed file
        if (err) {
            logger("error", `Error writing changes to advancedconfig.json: ${err}`, true);
        }
    });


    // Data.json
    logger("", `${logger.colors.fgyellow}Clearing cache of data.json...`, true, false, logger.animation("loading"));

    delete require.cache[require.resolve(srcdir + "/data/data.json")]; // Delete cache
    let newextdata = require(srcdir + "/data/data.json");

    logger("", `${logger.colors.fgyellow}Transferring changes to new data.json...${logger.colors.reset}`, true, false, logger.animation("loading"));

    if (Object.keys(extdata).length > 2) { // Only do this if the data.json update call originates from the updater and not from the integrity check
        if (compatibilityfeaturedone) newextdata.compatibilityfeaturedone = true;

        newextdata.urlrequestsecretkey = oldextdata.urlrequestsecretkey;
        newextdata.timesloggedin = oldextdata.timesloggedin;
        newextdata.totallogintime = oldextdata.totallogintime;
    }

    logger("", `${logger.colors.fgyellow}Writing new data to data.json...`, true, false, logger.animation("loading"));
    fs.writeFile(srcdir + "/data/data.json", JSON.stringify(newextdata, null, 4), err => { // Write the changed file
        if (err) {
            logger("error", `Error writing changes to data.json: ${err}`, true);
            logger("error", "\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true);

            callback(err);
        }
    });
};