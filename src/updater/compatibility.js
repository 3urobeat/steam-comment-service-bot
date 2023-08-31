/*
 * File: compatibility.js
 * Project: steam-comment-service-bot
 * Created Date: 04.05.2023 20:26:42
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const Controller = require("../controller/controller.js"); // eslint-disable-line


/**
 * Compatibility feature function to ensure automatic updating works. It gets the corresponding compatibility feature to this version and runs it if compatibilityfeaturedone in data.json is false.
 * @param {Controller} controller Reference to the controller object
 * @returns {Promise.<void|null>} Resolves with `forceUpdate` (Boolean) when done. 'forceUpdate` must be passed to updater in controller.js!
 */
module.exports.runCompatibility = async (controller) => {
    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            // Check if compatibilityfeature was already run
            if (controller.data.datafile.compatibilityfeaturedone) {
                logger("debug", "Updater runCompatibility(): Skipping compatibility check as it already ran previously...");
                resolve();
                return;
            }


            // Initialize list with an empty array so the check below won't fail if the folder does not exist
            let list = [];

            // List all files in compatibility directory if it exists
            if (fs.existsSync("./src/updater/compatbility")) list = fs.readdirSync("./src/updater/compatibility");

            // Try to find this version in list
            let match = list.find(e => e == controller.data.datafile.version.replace(/b[0-9]+/g, "") + ".js"); // Remove beta build from version so it still matches on every beta build | Old check used this regex pattern: str.match(/21200b[0-9]+/g)


            // If we found a match test its integrity and execute it
            if (match) {
                let file = await require("../starter.js").checkAndGetFile(`./src/updater/compatibility/${match}`, logger, false, false); // Check integrity
                if (!file) return resolve();

                logger("info", `Running compatibility feature ${match}...`, true);
                file.run(controller, resolve); // Call compatibilityfeature and pass callback so the caller of this function gets a response

            } else { // Continue startup like normal if no file was found for this version

                logger("debug", `Updater runCompatibility(): No compatibility feature was found for ${controller.data.datafile.version} in a list of ${list.length} files...`);
                resolve(false);
            }

        })();
    });
};