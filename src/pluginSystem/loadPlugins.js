/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:46:09
 * Author: 3urobeat
 *
 * Last Modified: 28.05.2023 11:13:13
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const PluginSystem   = require("./pluginSystem.js");
const { syncLoop }   = require("../controller/helpers/misc.js");
const npmInteraction = require("../controller/helpers/npminteraction.js");


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

            // Iterate over all folders in this dir.
            syncLoop(files.length, (loop, i) => {
                setTimeout(() => { // TODO: SyncLoop ONLY works inside this timeout. Idk why but this is a small price to pay for functionality right now
                    let e = files[i];

                    // Check if not a folder
                    if (!fs.statSync(`./plugins/${e}`).isDirectory()) return loop.next();

                    // Check if entry file or info files are missing and instantly abort
                    if (!fs.existsSync(`./plugins/${e}/plugin.js`)) {
                        logger("error", `Plugin ${e} does not have an entry file called 'plugin.js'! Skipping plugin...`);
                        return loop.next();
                    }

                    if (!fs.existsSync(`./plugins/${e}/package.json`)) {
                        logger("error", `Plugin ${e} does not have an configuration file called 'package.json'! Skipping plugin...`);
                        return loop.next();
                    }

                    // Try to load plugin
                    try {
                        // Load the plugin files
                        let thisPluginConf = require(`../../plugins/${e}/package.json`);

                        // Check if the plugin has no information in config file
                        if (!thisPluginConf || !thisPluginConf.name || !thisPluginConf.version || !thisPluginConf.author || thisPluginConf.pluginConfig.enabled == undefined) {
                            logger("error", `Plugin in folder '${e}' is missing information in its package.json file! Make sure that name, version, author and pluginConfig.enabled are populated.`);
                            return loop.next();
                        }

                        // Skip all checks after determining config is intact if plugin is disabled
                        if (!thisPluginConf.pluginConfig.enabled) {
                            logger("debug", `Plugin '${thisPluginConf.name}' is disabled. Skipping plugin...`);
                            return loop.next();
                        }

                        // Call 'npm install' for this plugin before loading to make sure every desired version is installed. This takes a moment but idk if there is a better way.
                        logger("info", `PluginSystem: Installing dependencies for ${thisPluginConf.name}...`, false, true, logger.animation("loading"));

                        npmInteraction.updateFromPath(`${srcdir}/../plugins/${e}`, async (err) => {
                            if (err) {
                                logger("error", `Failed to install dependencies for plugin ${thisPluginConf.name}! Skipping plugin...\n${err}`);
                                return loop.next();
                            }

                            // Load plugin after installing dependencies
                            let thisPlugin = require(`../../plugins/${e}/plugin.js`);

                            // Run checks for this plugin
                            let canBeLoaded = await this._checkPlugin(e, thisPlugin, thisPluginConf);
                            if (!canBeLoaded) {
                                logger("error", `Plugin ${thisPluginConf.name} failed critical checks. Skipping plugin...`);
                                return loop.next();
                            }

                            // Create new plugin object, add reference to plugin list and call load function
                            thisPlugin = new thisPlugin(this);
                            this.pluginList[thisPluginConf.name] = thisPlugin;

                            logger("info", `PluginSystem: Loading plugin ${thisPluginConf.name} v${thisPluginConf.version} by ${thisPluginConf.author}...`, false, true, logger.animation("loading"));
                            thisPlugin.load();

                            // Attach any event functions the plugin might have exported
                            if (thisPlugin.ready) this.controller.events.on("ready", () => thisPlugin.ready.call(thisPlugin)); // Use call() to apply context which gets replaced with EventEmitter

                            loop.next();
                        });

                    } catch (err) {
                        logger("error", `Error loading plugin '${e}'! Error: ${err.stack}`, true);
                        return loop.next();
                    }
                }, 50);
            }, () => { // Function that will run on exit, aka the last iteration
                resolve();
            });

        });
    });
};