/*
 * File: pluginSystem.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:34:27
 * Author: 3urobeat
 *
 * Last Modified: 27.05.2023 11:45:08
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller     = require("../controller/controller.js"); // eslint-disable-line
const CommandHandler = require("../commands/commandHandler.js"); // eslint-disable-line


/**
 * Constructor - The plugin system loads all plugins and provides functions for plugins to hook into
 * @param {Controller} controller Reference to the controller object
 */
const PluginSystem = function(controller) {
    this.controller = controller;

    // References to all plugin objects
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
PluginSystem.prototype.reloadPlugins = function() {

    // Delete all plugin objects. (I'm not sure if this is necessary or if clearing the pluginList obj will garbage collect them)
    Object.keys(this.pluginList).forEach(e => {
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
        Object.values(this.pluginList).forEach(e => {
            if (e.ready) e.ready();
        });
    }, 3000);
};


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Internal: Loads all plugins in /plugins dir and exports them as PluginSystem.pluginList object
 */
PluginSystem.prototype._loadPlugins = function() {};

/**
 * Internal: Checks a plugin, displays relevant warnings and decides whether the plugin is allowed to be loaded
 * @param {Object} thisPlugin Plugin file object returned by require()
 * @returns {Promise} Resolved with `true` (can be loaded) or `false` (must not be loaded) on completion
 */
PluginSystem.prototype._checkPlugin = function(thisPlugin) {}; // eslint-disable-line