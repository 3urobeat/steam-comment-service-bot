/*
 * File: pluginSystem.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:34:27
 * Author: 3urobeat
 *
 * Last Modified: 04.06.2023 16:13:52
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const Controller = require("../controller/controller.js"); // eslint-disable-line
const CommandHandler = require("../commands/commandHandler.js"); // eslint-disable-line
const Bot = require("../../src/bot/bot.js"); // eslint-disable-line

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
     * @typedef Plugin Documentation of the Plugin structure for IntelliSense support
     * @type {object}
     * @property {function} load Called on Plugin load
     * @property {function} unload Called on Plugin unload
     * @property {function} ready Controller ready event
     * @property {function(Bot, Bot.EStatus, Bot.EStatus)} statusUpdate Controller statusUpdate event
     * @property {function(Bot, function(string))} steamGuardInput Controller steamGuardInput event
     */

    /**
     * References to all plugin objects
     * @type {Object.<string, Plugin>}
     */
    this.pluginList = {};

    /**
     * @type {CommandHandler}
     */
    this.commandHandler = controller.commandHandler;

    // Load helper files
    require("./loadPlugins.js");
    require("./pluginCheck.js");
};

// The plugin system loads all plugins and provides functions for plugins to hook into
module.exports = PluginSystem;

/**
 * Reloads all plugins and calls ready event after ~2.5 seconds.
 */
PluginSystem.prototype.reloadPlugins = function () {
    // Delete all plugin objects. (I'm not sure if this is necessary or if clearing the pluginList obj will garbage collect them)
    Object.keys(this.pluginList).forEach((e) => {
        this.pluginList[e].unload();

        delete this.pluginList[e];
    });

    // Delete cache so requiring plugins again will load new changes
    Object.keys(require.cache).forEach((key) => {
        if (key.includes("/plugins/")) delete require.cache[key];
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
 * @param {String} folderName Name of the plugin folder. This is used to reference the plugin when thisPluginConf is undefined
 * @param {Object} thisPlugin Plugin file object returned by require()
 * @param {Object} thisPluginConf package.json object of this plugin
 * @returns {Promise.<boolean>} Resolved with `true` (can be loaded) or `false` (must not be loaded) on completion
 */
PluginSystem.prototype._checkPlugin = function (folderName, thisPlugin, thisPluginConf) {}; // eslint-disable-line
