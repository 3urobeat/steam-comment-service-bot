/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-06-04 15:37:17
 * Author: DerDeathraven
 *
 * Last Modified: 2025-01-03 14:14:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const PluginSystem = require("./pluginSystem.js");


/**
 * Attempts to instantiate a plugin
 * @param {string} pluginName Name of the plugin package
 * @returns {{ pluginName: string, pluginInstance: object, pluginJson: object }} Creates a plugin instance and returns it along with more information
 */
function instantiatePlugin(pluginName) {
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
 * Internal: Loads a plugin npm package and populates pluginList
 * @param {string} pluginPackageName Name of the plugin npm package to load
 */
PluginSystem.prototype._loadPlugin = async function(pluginPackageName) {

    // Check if a plugin with this name is already loaded
    if (this.pluginList[pluginPackageName]) {
        logger("warn", `PluginSystem: Plugin '${pluginPackageName}' is already loaded! Skipping...`, false, false, null, true); // Force print now
        return;
    }

    // Attempt to instantiate the plugin
    const instantiatedPlugin = instantiatePlugin.bind(this)(pluginPackageName);

    const { pluginName, pluginInstance, pluginJson } = instantiatedPlugin;

    // Abort if plugin couldn't be instantiated
    if (!pluginInstance) {
        logger("warn", `Skipping plugin '${pluginName}'...`, false, false, null, true); // Force print now
        return;
    }

    // Attempt to load plugin config, skip in error
    let pluginConfig = await this.loadPluginConfig(pluginName).catch((err) => logger("error", `The config of plugin '${pluginName}' is fucked, skipping plugin. ${err}`));

    if (!pluginConfig) return;


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
        return;
    }

    logger("info", `PluginSystem: Loading plugin '${pluginName}' v${pluginJson.version} by '${pluginJson.author}' made for v${pluginJson.botVersion}...`, false, false, logger.animation("loading"), true);

    // Display warning if bot version mismatches plugin's botVersion
    try {
        if (pluginJson.botVersion) {
            if (pluginJson.botVersion != this.controller.data.datafile.versionstr) {
                if (this.controller.data.advancedconfig.blockPluginLoadOnMismatchedBotVersion) {
                    logger("warn", `Plugin '${pluginName}' wasn't made for this version! Blocking load because 'blockPluginLoadOnMismatchedBotVersion' is enabled.`, true);
                    return;
                }

                logger("warn", `Plugin '${pluginName}' was made for v${pluginJson.botVersion} but the bot runs on v${this.controller.data.datafile.versionstr}. This plugin might not function correctly but I'm loading it anyway.`, true); // Log now
            }
        } else {
            if (this.controller.data.advancedconfig.blockPluginLoadOnMismatchedBotVersion) {
                logger("warn", `Plugin '${pluginName}' does not specify a botVersion! Blocking load because 'blockPluginLoadOnMismatchedBotVersion' is enabled.`, true);
                return;
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
    Object.entries(this.PLUGIN_EVENTS).forEach(([eventName, event]) => { // eslint-disable-line no-unused-vars
        this.controller.events.on(event, (...args) => pluginInstance[event]?.call(pluginInstance, ...args));
    });

};


/**
 * Internal: Checks for updates (if !disablePluginsAutoUpdate), loads all plugin npm packages and populates pluginList
 */
PluginSystem.prototype._loadPlugins = async function () {

    // Get all plugins with the matching regex
    const plugins = Object.entries(this.packageJson.dependencies).filter(([key, value]) => this.PLUGIN_REGEX.test(key)); // eslint-disable-line

    // Check for the latest version of all plugins
    if (!this.controller.data.advancedconfig.disablePluginsAutoUpdate) {
        await this._checkPluginUpdates(plugins);
    } else {
        logger("info", "PluginSystem: Skipping plugins auto update because 'disablePluginsAutoUpdate' in 'advancedconfig.json' is enabled.", false, true);
    }

    // Initalize and load each plugin
    for (const plugin of plugins) {
        this._loadPlugin(plugin[0]);
    }

};


/**
 * Internal: Unloads a plugin
 * @param {string} pluginName Name of the plugin package to unload
 */
PluginSystem.prototype._unloadPlugin = function(pluginName) {
    if (!pluginName) throw new Error("pluginName parameter is undefined");

    logger("info", `PluginSystem: Unloading plugin '${pluginName}'...`, false, false, null, true);

    if (this.pluginList[pluginName].unload) {
        this.pluginList[pluginName].unload();
    } else {
        logger("warn", `PluginSystem _unloadPlugin: Plugin '${pluginName}' does not have an unload function, un-/reloading might not work properly!`, false, false, null, true);
    }

    // Delete the original path of the plugin, otherwise plugins linked via 'npm link' won't be reloaded correctly
    delete require.cache[require.resolve(pluginName)];

    // Make sure to delete subfiles of this plugin
    Object.keys(require.cache).forEach((key) => {
        if (key.includes(pluginName) || key.includes("/plugins/")) {
            delete require.cache[require.resolve(key)];
        }
    });

    // Delete entry from pluginList object
    delete this.pluginList[pluginName];
};


/**
 * Internal: Unloads all plugins
 */
PluginSystem.prototype._unloadAllPlugins = function() {
    logger("info", "PluginSystem: Unloading all plugins...", false, false, null, true);

    // Delete all plugin objects and their subfiles
    Object.keys(this.pluginList).forEach((e) => {
        this._unloadPlugin(e);
    });
};


/**
 * Reloads a plugin and calls ready event after ~2.5 seconds.
 * @param {string} pluginName Name of the plugin package to reload
 */
PluginSystem.prototype.reloadPlugin = function(pluginName) {
    this._unloadPlugin(pluginName);

    setTimeout(() => this._loadPlugin(pluginName), 500);

    // Call ready event if plugin has one, 2.5 seconds after loading
    setTimeout(() => {
        const plugin = this.pluginList[pluginName];

        if (plugin.ready) plugin.ready();
    }, 3000);
};


/**
 * Reloads all plugins and calls ready event after ~2.5 seconds.
 */
PluginSystem.prototype.reloadPlugins = function() {
    // Delete all plugin objects and their subfiles
    this._unloadAllPlugins();

    this.pluginList = {};
    setTimeout(() => this._loadPlugins(), 500);

    // Call ready event for every plugin which has one, 2.5 seconds after loading
    setTimeout(() => {
        Object.values(this.pluginList).forEach((e) => {
            if (e.ready) e.ready();
        });
    }, 3000);
};
