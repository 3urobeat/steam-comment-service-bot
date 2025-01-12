/*
 * File: restoreBackup.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-02-26 20:16:44
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 18:27:54
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs   = require("fs");
const path = require("path");


/**
 * Tries to restore a previously made backup
 * @returns {Promise.<void>} Resolves when we can proceed
 */
module.exports.run = () => {
    return new Promise((resolve) => {

        if (fs.existsSync("./backup")) {
            logger("info", "Found a backup folder, trying to restore your latest backup...", false, false, logger.animation("loading"));

            // Specify which files and folders we can ignore
            const dontCopy = ["backup"];

            /**
             * Copy everything in a folder including its subpaths - Thanks (modified): https://stackoverflow.com/a/26038979/12934162
             * @private
             * @param {string} src From path
             * @param {string} dest To path
             * @param {boolean} firstCall Set to `true` on first call, will be set to `false` on recursive call
             */
            function copyFolderRecursiveSync(src, dest, firstCall) {
                let files = [];

                // Check if folder needs to be created
                const targetFolder = path.join(dest, path.basename(src));

                if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

                // Copy files or call function again if dir
                if (fs.lstatSync(src).isDirectory()) {
                    files = fs.readdirSync(src);

                    files.forEach((file) => {
                        if (dontCopy.includes(file)) return; // Ignore this file/folder if name is in dontCopy
                        const curSource = path.join(src, file);

                        if (fs.lstatSync(curSource).isDirectory()) {
                            copyFolderRecursiveSync(curSource, targetFolder, false);
                        } else {
                            const tempStr = (targetFolder + "/" + file).replace("backup/", "");
                            logger("debug", `Copying "${curSource}" to "${tempStr}"...`, true);

                            fs.copyFileSync(curSource, (targetFolder + "/" + file).replace("backup/", ""));
                        }
                    });
                }

                // Make callback when we are finished and in the top level
                if (firstCall) {
                    logger("info", "Successfully restored a backup!");
                    resolve();
                }
            }

            copyFolderRecursiveSync("./backup", ".", true);

        } else {

            logger("error", "Unfortunately I was unable to find a backup. I don't know how to proceed from here so you sadly have to redownload the bot yourself: https://github.com/3urobeat/steam-comment-service-bot\n        Please report this issue with all errors so that I'm able to fix this: https://github.com/3urobeat/steam-comment-service-bot/issues\n        Exiting...", true);
            process.send("stop()");
        }

    });
};
