/*
 * File: createBackup.js
 * Project: steam-comment-service-bot
 * Created Date: 26.02.2022 16:54:03
 * Author: 3urobeat
 * 
 * Last Modified: 26.02.2022 21:31:57
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
 * Makes a copy of the current bot installation before updating, to be able to restore in case the updater fails
 */
module.exports.run = (callback) => {
    logger("info", "Creating a backup of your current installation...", false, false, logger.animation("loading"));

    //Specify which files and folders we can ignore
    const dontCopy = [".git", ".github", "node_modules", "backup"];

    //This but slightly modified - thanks: https://stackoverflow.com/a/26038979/12934162
    function copyFolderRecursiveSync(src, dest, firstCall) {
        var files = [];
    
        //Check if folder needs to be created
        var targetFolder = path.join(dest, path.basename(src));
        
        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);
    
        //Copy files or call function again if dir
        if (fs.lstatSync(src).isDirectory()) {
            files = fs.readdirSync(src);

            files.forEach((file) => {
                if (dontCopy.includes(file)) return; //ignore this file/folder if name is in dontCopy
                var curSource = path.join(src, file);

                if (fs.lstatSync(curSource).isDirectory()) {
                    copyFolderRecursiveSync(curSource, targetFolder, false);
                } else {
                    logger("debug", `Copying "${curSource}" to "${targetFolder}/${file}"...`, true)
                    
                    fs.copyFileSync(curSource, targetFolder + "/" + file)
                }
            });
        }

        //Make callback when we are finished and in the top level
        if (firstCall) {
            logger("info", "Successfully created a backup!")
            callback();
        }
    }

    copyFolderRecursiveSync(".", "./backup", true);
}