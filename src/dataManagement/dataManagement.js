/*
 * File: dataManagement.js
 * Project: steam-comment-service-bot
 * Created Date: 21.03.2023 22:34:51
 * Author: 3urobeat
 *
 * Last Modified: 23.03.2023 13:45:45
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const starter = require("../starter.js"); // Load starter to access checkAndGetFile()


/**
 * Constructor - The dataManagement system imports, checks, handles errors and provides a file updating service for all configuration files
 * @param {Object} controller Reference to the controller object
 */
const DataManager = function(controller) {
    this.controller      = controller;
    this.checkAndGetFile = starter.checkAndGetFile; // Reference checkAndGetFile() already defined in starter to use it more easily

    // Register dataImport vars to let the IntelliSense know
    this.cachefile      = {};
    this.datafile       = {};
    this.config         = {};
    this.advancedconfig = {};
    this.logininfo      = {};
    this.proxies        = [];
    this.quotes         = [];
    this.lang           = {};
    this.lastCommentDB  = {};

    // Load helpers
    if (!this.checkAndGetFile("./src/dataManagement/dataImport.js",         controller.logger, false, false)) logger("err", "Error! DataManager: Failed to load 'dataImport.js'!");
    if (!this.checkAndGetFile("./src/dataManagement/helpers/getQuote.js",   controller.logger, false, false)) logger("err", "Error! DataManager: Failed to load 'getQuote.js'!");
    if (!this.checkAndGetFile("./src/dataManagement/helpers/repairFile.js", controller.logger, false, false)) logger("err", "Error! DataManager: Failed to load 'repairFile.js'!");

};


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Internal: Loads all config & data files from disk and handles potential errors
 * @returns {Promise} Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype._importFromDisk = async function() {};

/**
 * Gets a random quote
 * @param {Array} quotesArr Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
 * @returns {Promise} Resolves with `quote` (String)
 */
DataManager.prototype.getQuote = function(quotesArr = null) {}; // eslint-disable-line

/**
 * Internal: Helper function to try and restore backup of corrupted file from cache.json
 * @param {String} name Name of the file
 * @param {String} filepath Absolute path of the file on the disk
 * @param {Object} cacheentry Backup-Object of the file in cache.json
 * @param {String} onlinelink Link to the raw file in the GitHub repository
 * @param {Function} resolve Function to resolve the caller's promise
 */
DataManager.prototype._restoreBackup = function(name, filepath, cacheentry, onlinelink, resolve) {}; // eslint-disable-line

/**
 * Internal: Helper function to pull new file from GitHub
 */
DataManager.prototype._pullNewFile = function(name, filepath, resolve) {}; // eslint-disable-line


// Export our freshly baked bread
module.exports = DataManager;