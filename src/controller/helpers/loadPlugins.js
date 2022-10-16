/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 09:36:27
 * Author: 3urobeat
 *
 * Last Modified: 25.02.2022 13:49:18
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
 * Load all plugins in /plugins dir
 * @returns {Promise} Promise that returns {@link {Object<string, object>} plugins (all plugins, key: name, value: everything that is exported by plugin)} if resolved and {@link {Object} empty object} if rejected.
 */
module.exports.loadPlugins = () => {
    logger("info", "Loading all plugin files in ./plugins...", false, true, logger.animation("loading"));

    return new Promise((resolve, reject) => {
        let plugins = {};

        fs.readdir("./plugins", (err, files) => {
            if (err) {
                logger("error", "Error while reading plugins dir: " + err, true);
                return reject({});
            }

            // Filter non js files
            var jsfiles = files.filter(p => p.split(".").pop() === "js");

            // Resolve now if nothing was found
            if (jsfiles.length == 0) {
                logger("info", "No plugins in ./plugins found!", false, true, logger.animation("loading"));
                resolve(plugins);
            }

            // Iterate over all js files in this dir
            jsfiles.forEach((e, i) => {
                try {
                    logger("debug", `Loading plugin ${e}...`);
                    var pl = require(`../../../plugins/${e}`);
                } catch (err) {
                    return logger("error", `Error loading plugin file ${e}! Error: ${err}`, true);
                }

                // Ignore template plugin
                if (pl.info.name != "template") {
                    // Check if plugin with same name was already found and print error msg, otherwise add plugin to obj
                    if (Object.keys(plugins).includes(pl.info.name)) logger("warn", `Duplicate plugin with the name ${pl.info.name} found! Ignoring this plugin...`, true);
                        else plugins[pl.info.name] = pl;
                }

                // Resolve promise on last iteration
                if (i + 1 == jsfiles.length) {
                    if (Object.keys(plugins).length == 0) logger("info", "No plugins in ./plugins found!", false, true, logger.animation("loading"));
                    resolve(plugins);
                }
            });
        });
    });
};