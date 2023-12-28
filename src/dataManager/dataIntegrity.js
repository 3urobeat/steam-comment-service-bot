/*
 * File: dataIntegrity.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-09-03 09:52:15
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:12:39
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const DataManager = require("./dataManager.js");


/**
 * Verifies the data integrity of every source code file in the project by comparing its checksum.
 * This function is used to verify the integrity of every module loaded AFTER the controller & DataManager. Both of those need manual checkAndGetFile() calls to import, which is handled by the Controller.
 * If an already loaded file needed to be recovered then the bot will restart to load these changes.
 * @returns {Promise.<void>} Resolves when all files have been checked and, if necessary, restored. Does not resolve if the bot needs to be restarted.
 */
DataManager.prototype.verifyIntegrity = function() {
    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            // Store all files which needed to be recovered to determine if we need to restart the bot
            let invalidFiles = [];

            // Get fileStructure.json
            const fileStructure = await this.checkAndGetFile("./src/data/fileStructure.json", logger, false, false); // Always forcing the latest version will lead to false-positives when user uses an older version

            // Generate a checksum for every file in fileStructure and compare them
            let startDate = Date.now();

            this.controller.misc.syncLoop(fileStructure.files.length, async (loop, i) => {
                let e = fileStructure.files[i];

                // Generate checksum for file if it exists, otherwise default to null
                let filesum = fs.existsSync(e.path) ? crypto.createHash("md5").update(fs.readFileSync(e.path)).digest("hex") : null;

                if (filesum != e.checksum) {
                    logger("warn", `Checksum of file '${e.path}' does not match expectations! Restoring file...`, false, false, null, true); // Force print now
                    invalidFiles.push(e.path);
                    await this.checkAndGetFile("./" + e.path, logger, true, true);
                } else {
                    // Logger("debug", `DataManager verifyIntegrity(): Successfully verified checksum of '${e.path}'`);
                }

                loop.next();

            }, () => { // Exit

                logger("debug", `DataManager verifyIntegrity(): Validating ${fileStructure.files.length} files took ${Date.now() - startDate}ms`);

                // Check if a file which has already been loaded was restored and restart the bot
                if (invalidFiles.some((e) => Object.keys(require.cache).includes(path.resolve(e)))) { // If any file path, converted to absolute, is included in cache
                    logger("warn", "The application needs to restart as one of the restored files was already loaded. Restarting...", false, false, null, true); // Force print now
                    return this.controller.restart();
                }

                resolve();
            });

        })();
    });
};
