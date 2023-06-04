/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 04.06.2023 15:37:17
 * Author: DerDeathraven
 *
 * Last Modified: 04.06.2023 17:15:20
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
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
};


function loadPlugin(pluginName) {
    try {
        // Load plugin and pluginJson
        const importedPlugin = require(pluginName);
        const pluginJson     = require(`${srcdir}/../node_modules/${pluginName}/package.json`);

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
    }
}


/**
 * Internal: Loads all plugin npm packages and populates pluginList
 */
PluginSystem.prototype._loadPlugins = function () {

    // Get all plugins with the matching regex
    const plugins = Object.entries(packageJson.dependencies).filter(([key, value]) => PLUGIN_REGEX.test(key)); // eslint-disable-line
    const initiatedPlugins = plugins.map(([plugin]) => loadPlugin.bind(this)(plugin)); // Initalize each plugin

    for (const { pluginName, pluginInstance } of initiatedPlugins) {
        this.pluginList[pluginName] = pluginInstance;
        pluginInstance.load();

        // Call the exposed event functions if they exist
        Object.entries(PLUGIN_EVENTS).forEach(([eventName, event]) => { // eslint-disable-line
            this.controller.events.on(event, (...args) => pluginInstance[event]?.call(pluginInstance, ...args));
        });
    }

};
