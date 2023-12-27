/*
 * File: handlePluginData.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-06-04 17:52:51
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:15:13
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const PluginSystem = require("./pluginSystem.js");


/**
 * Gets the path holding all data of a plugin. If no folder exists yet, one will be created
 * @param {string} pluginName Name of your plugin
 * @returns {string} Path to the folder containing your plugin data
 */
PluginSystem.prototype.getPluginDataPath = function (pluginName) {
    if (!pluginName) throw new Error("Plugin name parameter is missing!");

    let path = `${srcdir}/../plugins/${pluginName}/`;

    if (!fs.existsSync(path)) fs.mkdirSync(path);

    return path;
};


/**
 * Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.
 * @param {string} pluginName Name of your plugin
 * @param {string} filename Name of the file to load
 * @returns {Promise.<*>} Resolves with data on success, rejects otherwise with an error
 */
PluginSystem.prototype.loadPluginData = function (pluginName, filename) {
    return new Promise((resolve, reject) => {
        // Check for missing parameters
        if (!pluginName || !filename) return reject(new Error("Plugin name or file name parameter is missing!"));

        // Get path
        let path = this.getPluginDataPath(pluginName);

        fs.readFile(path + filename, (err, data) => {
            if (err) {
                logger("error", `PluginSystem: Failed to load file '${filename}' for plugin '${pluginName}': ${err.stack}`);
                return reject(err);
            }

            resolve(data);
        });
    });
};


/**
 * Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.
 * @param {string} pluginName Name of your plugin
 * @param {string} filename Name of the file to load
 * @param {string} data The data to write
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.writePluginData = function (pluginName, filename, data) {
    return new Promise((resolve, reject) => {
        // Check for missing parameters
        if (!pluginName || !filename || !data) return reject(new Error("Plugin name, file name or data parameter is missing!"));

        // Get path
        let path = this.getPluginDataPath(pluginName);

        fs.writeFile(path + filename, data, null, (err) => {
            if (err) {
                logger("error", `PluginSystem: Failed to write data to file '${filename}' for plugin '${pluginName}': ${err.stack}`);
                return reject(err);
            }

            resolve();
        });
    });
};


/**
 * Deletes a file in your plugin data folder if it exists.
 * @param {string} pluginName Name of your plugin
 * @param {string} filename Name of the file to load
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.deletePluginData = function (pluginName, filename) {
    return new Promise((resolve, reject) => {
        // Check for missing parameters
        if (!pluginName || !filename) return reject(new Error("Plugin name or file name parameter is missing!"));

        // Get path
        let path = this.getPluginDataPath(pluginName);

        // Check if file exists
        if (!fs.existsSync(path + filename)) return reject(new Error("File does not exist"));

        // Delete file
        fs.unlink(path + filename, (err) => {
            if (err) {
                logger("error", `PluginSystem: Failed to delete file '${filename}' for plugin '${pluginName}': ${err.stack}`);
                return reject(err);
            }

            resolve();
        });
    });
};


/**
 * Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.
 * @param {string} pluginName Name of your plugin
 * @returns {Promise.<object>} Resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.
 */
PluginSystem.prototype.loadPluginConfig = function (pluginName) {
    return new Promise((resolve, reject) => {
        // Check for missing parameters
        if (!pluginName) return reject(new Error("Plugin name parameter is missing!"));

        // Get path
        let path = this.getPluginDataPath(pluginName);

        // Check if no config exists yet
        if (!fs.existsSync(path + "config.json")) {
            logger("info", `PluginSystem: Plugin '${pluginName}' had no config stored yet, copying default config provided by plugin...`, false, true, logger.animation("loading"));

            try {
                fs.copyFileSync(`${srcdir}/../node_modules/${pluginName}/config.json`, path + "config.json");
            } catch (err) {
                logger("error", `Error copying default config provided by plugin '${pluginName}': ` + err);
                return reject(err);
            }
        }

        try {
            let config = require(path + "config.json");
            resolve(config);
        } catch (err) {
            logger("error", `PluginSystem: Failed to load config for plugin '${pluginName}': ${err.stack}`);
            return reject(err);
        }
    });
};


/**
 * Internal: Integrates changes made to a plugin's default config into the user's config
 * @author JLCD <https://github.com/DerDeathraven/>
 * @param {string} pluginName Name of your plugin
 * @param {object} currentConfig Config file currently loaded for this plugin
 * @returns {Record<string,any>} the config
 */
PluginSystem.prototype._aggregatePluginConfig = function (pluginName, currentConfig) {
    if (!pluginName || !currentConfig) return;
    if (!fs.existsSync(`${srcdir}/../node_modules/${pluginName}/config.json`)) return;

    const standardConfig   = require(`${srcdir}/../node_modules/${pluginName}/config.json`);
    const aggregatedConfig = Object.assign(standardConfig, currentConfig);

    this.writePluginConfig(pluginName, aggregatedConfig);

    return aggregatedConfig;
};


/**
 * Writes your plugin config changes to the filesystem. The object data will be processed to JSON.
 * @param {string} pluginName Name of your plugin
 * @param {object} pluginConfig Config object of your plugin
 * @returns {Promise.<void>} Resolves on success, rejects otherwise with an error
 */
PluginSystem.prototype.writePluginConfig = function (pluginName, pluginConfig) {
    return new Promise((resolve, reject) => {
        // Check for missing parameters
        if (!pluginName || !pluginConfig) return reject(new Error("Plugin name or plugin config parameter is missing!"));

        // Get path
        let path = this.getPluginDataPath(pluginName);

        try {
            let stringified = JSON.stringify(pluginConfig, null, 4);

            fs.writeFileSync(path + "config.json", stringified);
            resolve();
        } catch (err) {
            logger("error", `PluginSystem: Failed to write config for plugin '${pluginName}': ${err.stack}`);
            return reject(err);
        }
    });
};
