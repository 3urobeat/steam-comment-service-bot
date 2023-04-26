/*
 * File: restoreBackup.js
 * Project: steam-comment-service-bot
 * Created Date: 26.02.2022 20:16:44
 * Author: 3urobeat
 *
 * Last Modified: 26.04.2023 20:53:59
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs   = require("fs");
const path = require("path");


/**
 * Tries to restore a previously made backup
 */
module.exports.run = (callback) => {

    if (fs.existsSync("./backup")) {
        logger("info", "Found a backup folder, trying to restore your latest backup...", false, false, logger.animation("loading"));

        // Specify which files and folders we can ignore
        const dontCopy = ["backup"];

        // This but slightly modified - thanks: https://stackoverflow.com/a/26038979/12934162
        function copyFolderRecursiveSync(src, dest, firstCall) { // eslint-disable-line no-inner-declarations
            let files = [];

            // Check if folder needs to be created
            let targetFolder = path.join(dest, path.basename(src));

            if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

            // Copy files or call function again if dir
            if (fs.lstatSync(src).isDirectory()) {
                files = fs.readdirSync(src);

                files.forEach((file) => {
                    if (dontCopy.includes(file)) return; // Ignore this file/folder if name is in dontCopy
                    let curSource = path.join(src, file);

                    if (fs.lstatSync(curSource).isDirectory()) {
                        copyFolderRecursiveSync(curSource, targetFolder, false);
                    } else {
                        let tempStr = (targetFolder + "/" + file).replace("backup/", "");
                        logger("debug", `Copying "${curSource}" to "${tempStr}"...`, true);

                        fs.copyFileSync(curSource, (targetFolder + "/" + file).replace("backup/", ""));
                    }
                });
            }

            // Make callback when we are finished and in the top level
            if (firstCall) {
                logger("info", "Successfully restored a backup!");
                callback();
            }
        }

        copyFolderRecursiveSync("./backup", ".", true);
    } else {
        logger("error", "Unfortunately I was unable to find a backup. I don't know how to proceed from here so you sadly have to redownload the bot yourself: https://github.com/HerrEurobeat/steam-comment-service-bot\n        Please report this issue with all errors so that I'm able to fix this: https://github.com/HerrEurobeat/steam-comment-service-bot/issues\n        Exiting...", true);
        process.send("stop()");
    }

};