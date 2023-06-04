/*
 * File: loadPlugins.js
 * Project: steam-comment-service-bot
 * Created Date: 04.06.2023 15:37:17
 * Author: DerDeathraven
 *
 * Last Modified: 04.06.2023 16:00:04
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
    const importedPlugin = require(pluginName);

    if (!(typeof importedPlugin === "function")) {
        logger("error", `Plugin ${pluginName} is not a function`);
    }

    try {
        const pluginInstance = new importedPlugin(this);
        return { pluginName, pluginInstance };
    } catch (e) {
        logger("error", `Plugin ${pluginName} could not be instantiated`);
    }
}

PluginSystem.prototype._loadPlugins = async function () {

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
