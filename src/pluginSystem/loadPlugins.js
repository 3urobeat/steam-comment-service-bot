/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:46:09
 * Author: 3urobeat
 *
 * Last Modified: 05.05.2023 17:10:37
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const PluginSystem = require("./pluginSystem.js");


/**
 * Internal: Loads all plugins in /plugins dir and exports them as PluginSystem.pluginList object
 */
PluginSystem.prototype._loadPlugins = function() {
    this.pluginList = {};

    logger("info", "PluginSystem: Loading all plugins in /plugins directory...", false, true, logger.animation("loading"));

    fs.readdir("./plugins", (err, files) => {

        // Stop now on error or if nothing was found
        if (err)               return logger("error", "Error while reading plugins dir: " + err, true);
        if (files.length == 0) return logger("info", "No plugins in ./plugins found!", false, true, logger.animation("loading"));

        // Iterate over all folders in this dir
        files.forEach((e) => {
            let thisPlugin;

            // Try to load plugin
            try {
                // Load the plugin file
                thisPlugin = require(`../../plugins/${e}/plugin.js`);

                // Ignore template plugin
                if (thisPlugin.info.name == "template") return;


                // Call the plugin's load function
                logger("info", `Loading plugin ${thisPlugin.info.name} v${thisPlugin.info.version} by ${thisPlugin.info.author}...`, false, true, logger.animation("loading"));

                thisPlugin.load(this); // Call the exported load function and pass a reference to the pluginSystem


                // Check if plugin with same name was already found and print error msg, otherwise add plugin to obj
                if (Object.keys(this.pluginList).includes(thisPlugin.info.name)) return logger("warn", `Duplicate plugin with the name ${thisPlugin.info.name} found! Ignoring this plugin...`, true);

                this.pluginList[thisPlugin.info.name] = thisPlugin;

            } catch (err) {

                return; // Logger("error", `Error loading plugin '${e}'! Error: ${err.stack}`, true); // TODO: Ignore for now, as plugins are not included in update set yet so this will trigger even after an successful update
            }
        });
    });
};