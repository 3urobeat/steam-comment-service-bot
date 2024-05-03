/*
 * File: repairFile.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-03-22 12:35:01
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-03 12:59:23
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs          = require("fs");
const path        = require("path");
const DataManager = require("../dataManager.js");


/**
 * Internal: Helper function to try and restore backup of corrupted file from cache.json
 * @param {string} name Name of the file
 * @param {string} filepath Absolute path of the file on the disk
 * @param {object} cacheentry Backup-Object of the file in cache.json
 * @param {string} onlinelink Link to the raw file in the GitHub repository
 * @param {function(any): void} resolve Function to resolve the caller's promise
 */
DataManager.prototype._restoreBackup = function(name, filepath, cacheentry, onlinelink, resolve) {

    // Try to get arrays on one line
    let stringified;

    try {
        stringified = JSON.stringify(cacheentry, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
            if (v instanceof Array) return JSON.stringify(v);

            return v;
        }, 4)
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');
    } catch {
        stringified = JSON.stringify(cacheentry, null, 4);
    }

    // Create the underlying folder structure to avoid error when trying to write the downloaded file
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    fs.writeFile(filepath, stringified, (err) => { // Write last backup to it from cache.json
        if (err) {
            logger("error", `Error writing data to '${name}'! I'm therefore sadly unable to repair this issue automatically.\nPlease do this manually: Visit ${onlinelink}, copy everything and replace everything in the local file with it.\nYou can optionally redownload and reconfigure the whole bot.\nError: ${err}\n\nAborting...`, true);
            return this.controller.stop(); // Abort since writeFile was unable to write and any further execution would crash
        }

        // Test backup:
        logger("info", `Testing '${name}' backup...`, true, true);

        try { // Yes, this is a try catch inside a try catch please forgive me
            logger("info", `Successfully restored backup of '${name}'!\n`, true);
            resolve(require(filepath));

        } catch { // Worst case, even the backup seems to be broken (seems like this can't happen anymore since 2.11 because cache.json will get cleared before we get here if it contains an error)

            this._pullNewFile(name, filepath, resolve);
        }
    });

};


/**
 * Internal: Helper function to pull new file from GitHub
 * @param {string} name Name of the file
 * @param {string} filepath Full path, starting from project root with './'
 * @param {function(any): void} resolve Your promise to resolve when file was pulled
 * @param {boolean} noRequire Optional: Set to true if resolve() should not be called with require(file) as param
 */
DataManager.prototype._pullNewFile = async function(name, filepath, resolve, noRequire) {
    logger("warn", "Backup seems to be broken/not available! Pulling file from GitHub...", true);

    let file = await this.checkAndGetFile(filepath, logger, true, true);
    if (!file) return this.controller.stop(); // Stop bot if file can't be restored

    // Only tell user to reconfigure config.json
    if (name == "config.json") logger("info", `Successfully pulled new ${name} from GitHub. Please configure it again!\n`, true);
        else logger("info", `Successfully pulled new ${name} from GitHub.\n`, true);

    // Hack the path together: Take the srcdir path as we otherwise would start here, go back a level and append the filepath. filepath needs to start at project root level so that checkAndGetFile() works so we need to work around it here.
    if (noRequire) resolve();
        else resolve(require(`${srcdir}/../${filepath}`));
};
