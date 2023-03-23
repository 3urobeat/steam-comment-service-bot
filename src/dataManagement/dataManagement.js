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

module.exports = DataManager;