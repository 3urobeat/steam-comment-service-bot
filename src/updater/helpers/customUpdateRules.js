/*
 * File: customUpdateRules.js
 * Project: steam-comment-service-bot
 * Created Date: 22.02.2022 17:39:21
 * Author: 3urobeat
 *
 * Last Modified: 04.06.2023 22:36:09
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
 * Applies custom update rules for a few files (gets called by downloadUpdate.js)
 * @param {any} compatibilityfeaturedone Legacy param, is unused
 * @param {Object} oldconfig The old config from before the update
 * @param {Object} oldadvancedconfig The old advancedconfig from before the update
 * @param {Object} olddatafile The old datafile from before the update
 * @param {function} callback Legacy param, is unused
 * @returns {Promise.<void>} Resolves when we can proceed
 */
module.exports.customUpdateRules = (compatibilityfeaturedone, oldconfig, oldadvancedconfig, olddatafile, callback) => { // eslint-disable-line
    return new Promise((resolve) => {

        /* --------------------- config.json --------------------- */
        logger("", `${logger.colors.fgyellow}Transferring your changes to new config.json...`, true, false, logger.animation("loading"));

        delete require.cache[require.resolve(srcdir + "/../config.json")]; // Delete cache
        let newconfig = require(srcdir + "/../config.json");

        // Transfer every setting to the new config
        Object.keys(newconfig).forEach(e => {
            if (!Object.keys(oldconfig).includes(e)) return; // Config value seems to be new so don't bother trying to set it to something (which would probably be undefined anyway)

            newconfig[e] = oldconfig[e]; // Transfer setting
        });

        // Get arrays on one line
        let stringifiedconfig = JSON.stringify(newconfig, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
            if (v instanceof Array) return JSON.stringify(v);
            return v;
        }, 4)
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        // Write changes to file
        fs.writeFile(srcdir + "/../config.json", stringifiedconfig, (err) => { // Write the changed file
            if (err) logger("error", `customUpdateRules: Error writing changes to config.json: ${err}`, true);
        });


        /* --------------------- advancedconfig.json --------------------- */
        logger("", `${logger.colors.fgyellow}Transferring your changes to new advancedconfig.json...`, true, false, logger.animation("loading"));

        delete require.cache[require.resolve(srcdir + "/../advancedconfig.json")]; // Delete cache
        let newadvancedconfig = require(srcdir + "/../advancedconfig.json");

        // Transfer every setting to the new advancedconfig
        Object.keys(newadvancedconfig).forEach(e => {
            if (!Object.keys(oldadvancedconfig).includes(e)) return; // Config value seems to be new so don't bother trying to set it to something (which would probably be undefined anyway)

            newadvancedconfig[e] = oldadvancedconfig[e]; // Transfer setting
        });

        // Get arrays on one line
        let stringifiedadvancedconfig = JSON.stringify(newadvancedconfig, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array) return JSON.stringify(v);
            return v;
        }, 4)
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        // Write changes to file
        fs.writeFile(srcdir + "/../advancedconfig.json", stringifiedadvancedconfig, (err) => { // Write the changed file
            if (err) logger("error", `customUpdateRules: Error writing changes to advancedconfig.json: ${err}`, true);
        });


        /* --------------------- data.json --------------------- */
        logger("", `${logger.colors.fgyellow}Transferring changes to new data.json...${logger.colors.reset}`, true, false, logger.animation("loading"));

        delete require.cache[require.resolve(srcdir + "/data/data.json")]; // Delete cache
        let newextdata = require(srcdir + "/data/data.json");

        // Transfer a few specific values to the new datafile if they exist to avoid errors
        if (olddatafile.timesloggedin)       newextdata.timesloggedin       = olddatafile.timesloggedin;
        if (olddatafile.totallogintime)      newextdata.totallogintime      = olddatafile.totallogintime;

        // Write changes to file
        fs.writeFile(srcdir + "/data/data.json", JSON.stringify(newextdata, null, 4), (err) => { // Write the changed file
            if (err) {
                logger("error", `customUpdateRules: Error writing changes to data.json: ${err}`, true);
                logger("error", "\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true);
            }

            // Resolve when the last write finished
            resolve();
        });

    });
};