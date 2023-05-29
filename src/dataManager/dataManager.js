/*
 * File: dataManager.js
 * Project: steam-comment-service-bot
 * Created Date: 21.03.2023 22:34:51
 * Author: 3urobeat
 *
 * Last Modified: 06.05.2023 12:09:01
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const starter = require("../starter.js"); // Load starter to access checkAndGetFile()
const fs = require("fs");

/**
 * Constructor - The dataManager system imports, checks, handles errors and provides a file updating service for all configuration files
 * @param {Object} controller Reference to the controller object
 */
const DataManager = function (controller) {
  this.controller = controller;
  this.checkAndGetFile = starter.checkAndGetFile; // Reference checkAndGetFile() already defined in starter to use it more easily

  // Register dataImport vars to let the IntelliSense know
  this.cachefile = {};
  this.datafile = {};
  this.config = {};
  this.advancedconfig = {};
  this.logininfo = {};
  this.proxies = [];
  this.quotes = [];
  this.lang = {};
  this.lastCommentDB = {};
  this.tokensDB = {};

  const loadHelpersFromFolder = (folder) => {
    fs.readdirSync(folder).forEach((file) => {
      if (!file.endsWith(".js")) return;
      const path = `./src/dataManager/${file}`;
      const getFile = this.checkAndGetFile(path, controller.logger);
      if (!getFile) {
        logger("err", `Error! DataManager: Failed to load '${file}'!`);
      }
    });
  };
  loadHelpersFromFolder("./src/dataManager");
  loadHelpersFromFolder("./src/dataManager/helpers");
};

/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Checks currently loaded data for validity and logs some recommendations for a few settings.
 * @returns {Promise} Resolves promise when all checks have finished. If promise is rejected you should terminate the application or reset the changes. Reject is called with a String specifying the failed check.
 */
DataManager.prototype.checkData = function () {};

/**
 * Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)
 */
DataManager.prototype.processData = async function () {};

/**
 * Internal: Loads all config & data files from disk and handles potential errors
 * @returns {Promise} Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype._importFromDisk = function () {};

/**
 * Gets a random quote
 * @param {Array} quotesArr Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
 * @returns {Promise} Resolves with `quote` (String)
 */
DataManager.prototype.getQuote = function (quotesArr = null) {}; // eslint-disable-line

/**
 * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
 * @param {String} id ID of the user to look up
 * @returns {Promise} Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as String), `untilStr` (Wait until as String). If id wasn't found, `null` will be returned.
 */
DataManager.prototype.getUserCooldown = function (id) {}; // eslint-disable-line

/**
 * Updates or inserts timestamp of a user
 * @param {String} id ID of the user to update
 * @param {Number} timestamp Unix timestamp of the last interaction the user received
 */
DataManager.prototype.setUserCooldown = function (id, timestamp) {}; // eslint-disable-line

/**
 * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
 */
DataManager.prototype._startExpiringTokensCheckInterval = () => {};

/**
 * Internal: Asks user if he/she wants to refresh the tokens of all expiring accounts when no active comment process was found and relogs them
 * @param {Object} expiring Object of botobject entries to ask user for
 */
DataManager.prototype._askForGetNewToken = function (expiring) {}; // eslint-disable-line

/**
 * Retrieves the last processed comment request of anyone or a specific steamID64 from the lastcomment database
 * @param {String} steamID64 Search for a specific user
 * @returns {Promise} Called with the greatest timestamp (Number) found
 */
DataManager.prototype.getLastCommentRequest = function (steamID64 = null) {}; // eslint-disable-line

/**
 * Decodes a JsonWebToken - https://stackoverflow.com/a/38552302
 * @param {String} token The token to decode
 * @returns JWT object on success, `null` on failure
 */
DataManager.prototype.decodeJWT = function (token) {}; // eslint-disable-line

/**
 * Refreshes Backups in cache.json with new data
 */
DataManager.prototype.refreshCache = function () {};

/**
 * Internal: Helper function to try and restore backup of corrupted file from cache.json
 * @param {String} name Name of the file
 * @param {String} filepath Absolute path of the file on the disk
 * @param {Object} cacheentry Backup-Object of the file in cache.json
 * @param {String} onlinelink Link to the raw file in the GitHub repository
 * @param {Function} resolve Function to resolve the caller's promise
 */
DataManager.prototype._restoreBackup = function (
  name,
  filepath,
  cacheentry,
  onlinelink,
  resolve
) {}; // eslint-disable-line

/**
 * Internal: Helper function to pull new file from GitHub
 */
DataManager.prototype._pullNewFile = async function (
  name,
  filepath,
  resolve
) {}; // eslint-disable-line

// Export our freshly baked bread
module.exports = DataManager;
