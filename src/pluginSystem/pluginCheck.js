/*
 * File: pluginCheck.js
 * Project: steam-comment-service-bot
 * Created Date: 27.05.2023 00:31:57
 * Author: 3urobeat
 *
 * Last Modified: 29.05.2023 17:14:36
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const PluginSystem = require("./pluginSystem");


/**
 * Internal: Checks a plugin, displays relevant warnings and decides whether the plugin is allowed to be loaded
 * @param {String} folderName Name of the plugin folder. This is used to reference the plugin when thisPluginConf is undefined
 * @param {Object} thisPlugin Plugin file object returned by require()
 * @param {Object} thisPluginConf package.json object of this plugin
 * @returns {Promise.<boolean>} Resolved with `true` (can be loaded) or `false` (must not be loaded) on completion
 */
PluginSystem.prototype._checkPlugin = function(folderName, thisPlugin, thisPluginConf) {
    return new Promise((resolve) => {
        logger("info", `PluginSystem: Running checks for plugin folder '${folderName}'...`, false, true, logger.animation("loading"));

        // Check if plugin with same name was already found and print error msg
        if (Object.keys(this.pluginList).includes(thisPluginConf.name)) {
            logger("error", `Duplicate plugin with the name ${thisPluginConf.name} found!`);
            return resolve(false);
        }

        // Check if plugin is missing a constructor or load function
        if (!thisPlugin || !thisPlugin.prototype || !thisPlugin.prototype.load) {
            logger("error", `Plugin ${thisPluginConf.name} is missing a constructor, load function or the object isn't being exported!`);
            return resolve(false);
        }

        // Display warning if plugin has no unload function
        if (!thisPlugin.prototype.unload) logger("warn", `Plugin ${thisPluginConf.name} v${thisPluginConf.version} does not have an unload function! This may prevent the reloading function from working properly.`);


        // Resolve true if no check above aborted
        resolve(true);
    });
};