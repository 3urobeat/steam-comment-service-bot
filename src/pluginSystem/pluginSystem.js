/*
 * File: pluginSystem.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-03-19 13:34:27
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-11 16:49:10
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller     = require("../controller/controller.js");   // eslint-disable-line
const CommandHandler = require("../commands/commandHandler.js"); // eslint-disable-line
const JobManager     = require("../jobs/jobManager.js");         // eslint-disable-line
const Bot            = require("../bot/bot.js");                 // eslint-disable-line


/**
 * @typedef Plugin Documentation of the Plugin structure for IntelliSense support
 * @type {object}
 * @property {function(): void} load Called on Plugin load
 * @property {function(): void} unload Called on Plugin unload
 * @property {function(): void} ready Controller ready event
 * @property {function(Bot, Bot.EStatus, Bot.EStatus): void} statusUpdate Controller statusUpdate event
 * @property {function(Bot, function(string): void): void} steamGuardInput Controller steamGuardInput event
 * @property {function(Bot, string): void} steamGuardQrCode Controller steamGuardQrCode event
 * @property {function(string, any, any): void} dataUpdate Controller dataUpdate event
 */


/**
 * Constructor - The plugin system loads all plugins and provides functions for plugins to hook into
 * @class
 * @param {Controller} controller Reference to the controller object
 */
const PluginSystem = function (controller) {
    /**
     * Central part of the application and your interface to everything
     * @type {Controller}
     */
    this.controller = controller;

    /**
     * References to all plugin objects
     * @type {{[key: string]: Plugin}}
     */
    this.pluginList = {};

    /**
     * Manages all registered commands and gives you access to them
     * @type {CommandHandler}
     */
    this.commandHandler = controller.commandHandler;

    /**
     * Manages and runs all jobs and lets you register your own
     * @type {JobManager}
     */
    this.jobManager = controller.jobManager;

    // Project's package.json
    this.packageJson = require("../../package.json");

    // Name regex for matching plugins
    this.PLUGIN_REGEX = /^steam-comment-bot-/;

    // Events supported by the PluginSystem
    this.PLUGIN_EVENTS = {
        READY: "ready",
        STATUS_UPDATE: "statusUpdate",
        steamGuardInput: "steamGuardInput",
        steamGuardQrCode: "steamGuardQrCode",
        dataUpdate: "dataUpdate"
    };

    /**
     * Helper function - Get a list of all installed plugins
     * @returns {[string, string][]} Array of arrays containing package name & version of all installed plugins
     */
    this.getInstalledPlugins = (() => Object.entries(this.packageJson.dependencies).filter(([key, value]) => this.PLUGIN_REGEX.test(key))); // eslint-disable-line

    /**
     * Helper function - Get a list of all active (loaded) plugins
     * @returns {[string, string][]} Array of arrays containing package name & version of all active (loaded) plugins
     */
    this.getActivePlugins = (() => Object.keys(this.pluginList).map((key) => [key, this.packageJson.dependencies[key]]));

    // Load helper files
    require("./loadPlugins.js");
    require("./handlePluginData.js");
};

// The plugin system loads all plugins and provides functions for plugins to hook into
module.exports = PluginSystem;


/**
 * Internal: Checks for available updates of all enabled plugins on NPM
 * @param {[string, string][]} [pluginPackages] List of arrays containing plugin name and installed version to check for updates. If not provided, all enabled plugins will be checked
 */
PluginSystem.prototype._checkPluginUpdates = async function(pluginPackages = null) {
    const npminteraction = require("../controller/helpers/npminteraction.js");

    logger("info", "PluginSystem: Searching for and installing plugin updates...", false, true, logger.animation("loading"));

    // Set packageNames to all enabled plugins if null
    if (!pluginPackages) {
        pluginPackages = this.getActivePlugins();
    }

    // Get all plugin names. Ignore locally installed ones by checking for "file:"
    const pluginNamesArr = pluginPackages.flatMap((e) => { // Use flatMap instead of map to omit empty results instead of including undefined
        if (!e[1].startsWith("file:")) return e[0];
            else return [];
    });

    await npminteraction.installLatest(pluginNamesArr)
        .catch((err) => {
            logger("error", "PluginSystem: Failed to update plugins. Resuming with currently installed versions. " + err);
        });

    // Reload package.json to get updated version numbers
    delete require.cache[require.resolve("../../package.json")];
    this.packageJson = require("../../package.json");

    // Check if a plugin needs to be reloaded (different version and plugin instance is registered in pluginList)
    pluginPackages.forEach(([ pluginName, oldVersion ]) => {
        const newVersion = this.packageJson.dependencies[pluginName];    // Get installed version from package.json

        if (oldVersion != newVersion) {
            if (this.pluginList[pluginName]) {
                logger("info", `PluginSystem: Plugin '${pluginName}' has been updated from version '${oldVersion}' to '${newVersion}'. Reloading plugin...`);
                this.reloadPlugin(pluginName);
            } else {
                logger("info", `PluginSystem: Plugin '${pluginName}' has been updated from version '${oldVersion}' to '${newVersion}' but it was not instantiated and therefore must not be reloaded.`, false, false, null, true);
            }
        }
    });
};


/**
 * Registers an plugin update check job. This is called by Controller after the initial _loadPlugins() call
 */
PluginSystem.prototype._registerUpdateChecker = function() {

    // Only register when disablePluginsAutoUpdate is not enabled
    if (!this.controller.data.advancedconfig.disablePluginsAutoUpdate) {

        this.controller.jobManager.registerJob({
            name: "pluginsUpdateCheck",
            description: "Checks for new updates of enabled plugins from npm every 24 hours",
            func: () => { this._checkPluginUpdates(); },
            interval: 8.64e+7, // 24 hours in ms
            runOnRegistration: false
        });

    } else {
        logger("info", "PluginSystem: Skip registering pluginsUpdateCheck job because 'disablePluginsAutoUpdate' in 'advancedconfig.json' is enabled.", false, true);
    }

};


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Internal: Loads a plugin npm package and populates pluginList
 * @param {string} pluginPackageName Name of the plugin npm package to load
 */
PluginSystem.prototype._loadPlugin = async function(pluginPackageName) {}; // eslint-disable-line

/**
 * Internal: Checks for updates (if !disablePluginsAutoUpdate), loads all plugin npm packages and populates pluginList
 */
PluginSystem.prototype._loadPlugins = async function () {};

/**
 * Internal: Unloads a plugin
 * @param {string} pluginName Name of the plugin package to unload
 */
PluginSystem.prototype._unloadPlugin = function(pluginName) {}; // eslint-disable-line

/**
 * Internal: Unloads all plugins
 */
PluginSystem.prototype._unloadAllPlugins = function() {};

/**
 * Reloads a plugin and calls ready event after ~2.5 seconds.
 * @param {string} pluginName Name of the plugin package to reload
 */
PluginSystem.prototype.reloadPlugin = function(pluginName) {}; // eslint-disable-line

/**
 * Reloads all plugins and calls ready event after ~2.5 seconds.
 */
PluginSystem.prototype.reloadPlugins = function () {};

/**
 * Internal: Checks a plugin, displays relevant warnings and decides whether the plugin is allowed to be loaded
 * @param {string} folderName Name of the plugin folder. This is used to reference the plugin when thisPluginConf is undefined
 * @param {object} thisPlugin Plugin file object returned by require()
 * @param {object} thisPluginConf package.json object of this plugin
 * @returns {Promise.<boolean>} Resolved with `true` (can be loaded) or `false` (must not be loaded) on completion
 */
PluginSystem.prototype._checkPlugin = function (folderName, thisPlugin, thisPluginConf) {}; // eslint-disable-line

/**
 * Gets the path holding all data of a plugin. If no folder exists yet, one will be created
 * @param {string} pluginName Name of your plugin
 * @returns {string} Path to the folder containing your plugin data
 */
PluginSystem.prototype.getPluginDataPath = function (pluginName) {}; // eslint-disable-line

/**
 * Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.
 * @param {string} pluginName Name of your plugin
 * @param {string} filename Name of the file to load
 * @returns {Promise.<*>} Resolves with data on success, rejects otherwise with an error
 */
PluginSystem.prototype.loadPluginData = function (pluginName, filename) {}; // eslint-disable-line

/**
 * Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.
 * @param {string} pluginName Name of your plugin
 * @param {string} filename Name of the file to load
 * @param {string} data The data to write
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.writePluginData = function (pluginName, filename, data) {}; // eslint-disable-line

/**
 * Deletes a file in your plugin data folder if it exists.
 * @param {string} pluginName Name of your plugin
 * @param {string} filename Name of the file to load
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.deletePluginData = function (pluginName, filename) {}; // eslint-disable-line

/**
 * Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.
 * @param {string} pluginName Name of your plugin
 * @returns {Promise.<object>} Resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.
 */
PluginSystem.prototype.loadPluginConfig = function (pluginName) {}; // eslint-disable-line

/**
 * Internal: Integrates changes made to a plugin's default config into the user's config
 * @author JLCD <https://github.com/DerDeathraven/>
 * @param {string} pluginName Name of your plugin
 * @param {object} currentConfig Config file currently loaded for this plugin
 * @returns {Record<string,any>} The updated config
 */
PluginSystem.prototype._aggregatePluginConfig = function (pluginName, currentConfig) {}; // eslint-disable-line

/**
 * Writes your plugin config changes to the filesystem. The object data will be processed to JSON.
 * @param {string} pluginName Name of your plugin
 * @param {object} pluginConfig Config object of your plugin
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.writePluginConfig = function (pluginName, pluginConfig) {}; // eslint-disable-line
