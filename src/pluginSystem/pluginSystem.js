/*
 * File: pluginSystem.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:34:27
 * Author: 3urobeat
 *
 * Last Modified: 04.07.2023 18:03:48
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const Controller = require("../controller/controller.js"); // eslint-disable-line
const CommandHandler = require("../commands/commandHandler.js"); // eslint-disable-line
const Bot = require("../../src/bot/bot.js"); // eslint-disable-line

/**
 * @typedef Plugin Documentation of the Plugin structure for IntelliSense support
 * @type {object}
 * @property {function} load Called on Plugin load
 * @property {function} unload Called on Plugin unload
 * @property {function} ready Controller ready event
 * @property {function(Bot, Bot.EStatus, Bot.EStatus)} statusUpdate Controller statusUpdate event
 * @property {function(Bot, function(string))} steamGuardInput Controller steamGuardInput event
 */

/**
 * Constructor - The plugin system loads all plugins and provides functions for plugins to hook into
 * @class
 * @param {Controller} controller Reference to the controller object
 */
const PluginSystem = function (controller) {
    /**
     * Reference to the controller object
     * @type {Controller}
     */
    this.controller = controller;

    /**
     * References to all plugin objects
     * @type {object.<string, Plugin>}
     */
    this.pluginList = {};

    /**
     * @type {CommandHandler}
     */
    this.commandHandler = controller.commandHandler;

    // Load helper files
    require("./loadPlugins.js");
    require("./handlePluginData.js");
};

// The plugin system loads all plugins and provides functions for plugins to hook into
module.exports = PluginSystem;

/**
 * Reloads all plugins and calls ready event after ~2.5 seconds.
 */
PluginSystem.prototype.reloadPlugins = function () {
    // Delete all plugin objects. (I'm not sure if this is necessary or if clearing the pluginList obj will garbage collect them)
    Object.keys(this.pluginList).forEach((e) => {
        if (this.pluginList[e].unload) {
            this.pluginList[e].unload();
        } else {
            logger("warn", `PluginSystem reloadPlugins: Plugin ${e} does not have an unload function, reloading might not work properly!`);
        }

        delete this.pluginList[e];
    });

    // Delete cache so requiring plugins again will load new changes
    Object.keys(require.cache).forEach((key) => {
        if (key.includes("node_modules/steam-comment-bot-") || key.includes("/plugins/")) delete require.cache[key];
    });

    this.pluginList = {};
    setTimeout(() => this._loadPlugins(), 500);

    // Call ready event for every plugin which has one, 2.5 seconds after loading
    setTimeout(() => {
        Object.values(this.pluginList).forEach((e) => {
            if (e.ready) e.ready();
        });
    }, 3000);
};

/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Internal: Loads all plugin npm packages and populates pluginList
 */
PluginSystem.prototype._loadPlugins = function () {};

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
 * Writes your plugin config changes to the filesystem. The object data will be processed to JSON.
 * @param {string} pluginName Name of your plugin
 * @param {object} pluginConfig Config object of your plugin
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.writePluginConfig = function (pluginName, pluginConfig) {}; // eslint-disable-line
/**
 * Integrates changes made to the config to the users config
 * @param {string} pluginName
 * @returns {Record<string,any>} the config
 */
PluginSystem.prototype.aggregatePluginConfig = function (pluginName) {}; // eslint-disable-line
