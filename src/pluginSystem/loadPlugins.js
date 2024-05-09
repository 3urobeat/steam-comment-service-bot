/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-06-04 15:37:17
 * Author: DerDeathraven
 *
 * Last Modified: 2024-05-03 12:52:12
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const PluginSystem = require("./pluginSystem.js");

const PLUGIN_REGEX = /^steam-comment-bot-/;
const packageJson = require("../../package.json");

const PLUGIN_EVENTS = {
    READY: "ready",
    STATUS_UPDATE: "statusUpdate",
    steamGuardInput: "steamGuardInput",
    steamGuardQrCode: "steamGuardQrCode"
};


/**
 * Attempt to load all plugins. If a critical check fails loading will be denied
 * @param {string} pluginName Name of the plugin package
 * @returns {{ pluginName: string, pluginInstance: object, pluginJson: object }} Creates a plugin instance and returns it along with more information
 */
function loadPlugin(pluginName) {
    try {
        // Load plugin and pluginJson
        const importedPlugin = require(pluginName);
        const pluginJson = require(`${srcdir}/../node_modules/${pluginName}/package.json`);

        // Check if plugin is missing required functions
        if (!(typeof importedPlugin === "function") || !importedPlugin.prototype || !importedPlugin.prototype.load) {
            logger("error", `Plugin '${pluginName}' is missing a constructor, load function or the object isn't being exported!`);
            return {};
        }

        // Display warning if the function is missing a unload function
        if (!importedPlugin.prototype.unload) logger("warn", `Plugin '${pluginName}' does not have an unload function! This may prevent the reloading function from working properly.`);

        // Create new plugin object
        const pluginInstance = new importedPlugin(this);
        return { pluginName, pluginInstance, pluginJson };
    } catch (e) {
        logger("error", `Plugin '${pluginName}' could not be instantiated: ${e.stack}`);
        return { pluginName, pluginInstance: null, pluginJson: null };
    }
}

/**
 * Internal: Loads all plugin npm packages and populates pluginList
 */
PluginSystem.prototype._loadPlugins = async function () {

    // Get all plugins with the matching regex
    const plugins = Object.entries(packageJson.dependencies).filter(([key, value]) => PLUGIN_REGEX.test(key)); // eslint-disable-line


    // Check for the latest version of all plugins
    if (!this.controller.data.advancedconfig.disablePluginsAutoUpdate) {
        const npminteraction = require("../controller/helpers/npminteraction.js");

        logger("info", "PluginSystem: Searching for and installing plugin updates...", false, true, logger.animation("loading"));

        // Get all plugin names. Ignore locally installed ones by checking for "file:"
        const pluginNamesArr = plugins.flatMap((e) => { // Use flatMap instead of map to omit empty results instead of including undefined
            if (!e[1].startsWith("file:")) return e[0];
                else return [];
        });

        await npminteraction.installLatest(pluginNamesArr)
            .catch((err) => {
                logger("error", "PluginSystem: Failed to update plugins. Resuming with currently installed versions. " + err);
            });
    } else {
        logger("info", "PluginSystem: Skipping plugins auto update because 'disablePluginsAutoUpdate' in 'advancedconfig.json' is enabled.", false, true);
    }


    // Initalize and load each plugin
    const initiatedPlugins = plugins.map(([plugin]) => loadPlugin.bind(this)(plugin));

    for (const plugin of initiatedPlugins) {
        const { pluginName, pluginInstance, pluginJson } = plugin;

        // Skip iteration if plugin couldn't be instantiated
        if (!pluginInstance) {
            logger("warn", `Skipping plugin '${pluginName}'...`, false, false, null, true); // Force print now
            continue;
        }

        // Attempt to load plugin config, skip in error
        let pluginConfig = await this.loadPluginConfig(pluginName).catch((err) => logger("error", `The config of plugin '${pluginName}' is fucked, skipping plugin. ${err}`));

        if (!pluginConfig) continue;

        // Handle plugin update by updating config file
        const lastSeenVersion = this.controller.data.cachefile.pluginVersions;

        if (lastSeenVersion && lastSeenVersion[pluginName] && lastSeenVersion[pluginName] !== pluginJson.version) {
            logger("warn", `Detected version change for plugin '${pluginName}'! Updating config...\n                             You might need to make changes and reload/restart the bot. Please check the plugin's release notes.`, false, false, null, true); // Force print now
            pluginConfig = this._aggregatePluginConfig(pluginName, pluginConfig);
        }

        // Update last seen version of this plugin
        if (!lastSeenVersion) this.controller.data.cachefile.pluginVersions = {};
        this.controller.data.cachefile.pluginVersions[pluginName] = pluginJson.version;

        // Skip plugin if it is disabled
        if (!pluginConfig || !pluginConfig.enabled) {
            logger("debug", `Plugin '${pluginName}' is disabled. Skipping plugin...`);
            continue;
        }

        logger("info", `PluginSystem: Loading plugin '${pluginName}' v${pluginJson.version} by '${pluginJson.author}' made for v${pluginJson.botVersion}...`, false, true, logger.animation("loading"));

        // Display warning if bot version mismatches plugin's botVersion
        try {
            if (pluginJson.botVersion) {
                if (pluginJson.botVersion != this.controller.data.datafile.versionstr) {
                    if (this.controller.data.advancedconfig.blockPluginLoadOnMismatchedBotVersion) {
                        logger("warn", `Plugin '${pluginName}' wasn't made for this version! Blocking load because 'blockPluginLoadOnMismatchedBotVersion' is enabled.`, true);
                        continue; // Important: Cannot use return instead as it would break the loop
                    }

                    logger("warn", `Plugin '${pluginName}' was made for v${pluginJson.botVersion} but the bot runs on v${this.controller.data.datafile.versionstr}. This plugin might not function correctly but I'm loading it anyway.`, true); // Log now
                }
            } else {
                if (this.controller.data.advancedconfig.blockPluginLoadOnMismatchedBotVersion) {
                    logger("warn", `Plugin '${pluginName}' does not specify a botVersion! Blocking load because 'blockPluginLoadOnMismatchedBotVersion' is enabled.`, true);
                    continue; // Important: Cannot use return instead as it would break the loop
                }

                logger("warn", `Plugin '${pluginName}' does not specify a botVersion in their package.json! This plugin might not function correctly as it could have been made for an outdated version.`, true); // Log now
            }
        } catch (err) {
            logger("err", `PluginSystem: Failed to check compatibility of plugin '${pluginName}' by comparing botVersion value. Attempting to load anyway. ${err}`);
        }

        // Add plugin reference to pluginList and call load function
        this.pluginList[pluginName] = pluginInstance;
        pluginInstance.load();

        // Call the exposed event functions if they exist
        Object.entries(PLUGIN_EVENTS).forEach(([eventName, event]) => { // eslint-disable-line no-unused-vars
            this.controller.events.on(event, (...args) => pluginInstance[event]?.call(pluginInstance, ...args));
        });
    }

};
