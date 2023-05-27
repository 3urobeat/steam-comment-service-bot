/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:46:09
 * Author: 3urobeat
 *
 * Last Modified: 27.05.2023 16:19:44
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
 * @returns {Promise} Resolves when all plugins have been loaded
 */
PluginSystem.prototype._loadPlugins = function() {
    return new Promise((resolve) => {
        logger("info", "PluginSystem: Loading all plugins in /plugins directory...", false, true, logger.animation("loading"));

        fs.readdir("./plugins", (err, files) => {

            // Stop now on error or if nothing was found
            if (err)               return logger("error", "Error while reading plugins dir: " + err, true);
            if (files.length == 0) return logger("info", "No plugins in ./plugins found!", false, true, logger.animation("loading"));

            // Iterate over all folders in this dir
            files.forEach(async (e, i) => {
                if (fs.existsSync(`./plugins/${e}/plugin.js`)) { // Welcome to stupid indentation world, I hope you like your stay
                    if (fs.existsSync(`./plugins/${e}/config.json`)) {

                        // Try to load plugin
                        try {
                            // Load the plugin files
                            let thisPlugin     = require(`../../plugins/${e}/plugin.js`);
                            let thisPluginConf = require(`../../plugins/${e}/config.json`);

                            // Run checks for this plugin
                            let canBeLoaded = await this._checkPlugin(e, thisPlugin, thisPluginConf);

                            if (canBeLoaded) {
                                // Create new plugin object, add reference to plugin list and call load function
                                thisPlugin = new thisPlugin(this);
                                this.pluginList[thisPluginConf.name] = thisPlugin;

                                logger("info", `Loading plugin ${thisPluginConf.name} v${thisPluginConf.version} by ${thisPluginConf.author}...`, false, true, logger.animation("loading"));
                                thisPlugin.load();

                                // Attach any event functions the plugin might have exported
                                if (thisPlugin.ready) this.controller.events.on("ready", () => thisPlugin.ready.call(thisPlugin)); // Use call() to apply context which gets replaced with EventEmitter

                            } else {

                                logger("error", `Plugin ${thisPluginConf.name} failed critical checks. Skipping plugin...`);
                            }
                        } catch (err) {
                            logger("error", `Error loading plugin '${e}'! Error: ${err.stack}`, true);
                        }

                    } else {
                        logger("error", `Plugin ${e} does not have an configuration file called 'config.json'! Skipping plugin...`);
                    }
                } else {
                    logger("error", `Plugin ${e} does not have an entry file called 'plugin.js'! Skipping plugin...`);
                }

                // Resolve promise if we are on the last iteration
                if (i + 1 == files.length) resolve();

            });
        });
    });
};