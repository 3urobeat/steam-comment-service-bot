/*
 * File: downloadUpdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 29.05.2023 17:22:40
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs       = require("fs");
const download = require("download"); // TODO: Does it make a difference if we require this lib inside the function or at the top score? Asking because of missing module error handling


/**
 * Downloads all files from the repository and installs them
 * @param {Controller} controller Reference to the controller object
 * @returns {Promise.<null|any>} Resolves when we can proceed. Null on success, err on failure.
 */
module.exports.startDownload = (controller) => {
    return new Promise((resolve) => {

        // Start by defining which files we should keep
        const dontDelete = [
            "./src/data/cache.json", "./src/data/lastcomment.db", "./src/data/tokens.db", "./output.txt", // Data stuff
            "./accounts.txt", "./customlang.json", "./logininfo.json", "./proxies.txt", "./quotes.txt"    // User config stuff
        ];

        // Process dontDelete array to include parent folders of each entry
        dontDelete.forEach((e) => {
            let str = e.split("/");
            str.splice(0, 1); // Remove '.'

            str.forEach((k, j) => {
                if (j == 0) return; // The path './' won't deleted either way so we can ignore it

                let pathToPush = "./" + str.slice(0, j).join("/");
                if (!dontDelete.includes(pathToPush)) dontDelete.push(pathToPush); // Construct path from first part of the path until this iteration
            });
        });


        // Save config settings and datafile values by cloning them into a new object
        const oldconfig         = Object.assign(controller.data.config);
        const oldadvancedconfig = Object.assign(controller.data.advancedconfig);
        const olddatafile       = Object.assign(controller.data.datafile);


        // Start downloading new files
        logger("", `${logger.colors.fgyellow}Downloading new files...${logger.colors.reset}`, true, false, logger.animation("loading"));

        download(`https://github.com/HerrEurobeat/steam-comment-service-bot/archive/${controller.data.datafile.branch}.zip`, "./", { extract: true }).then(() => { // The download library makes downloading and extracting much easier
            try {
                // Helper function to scan directory recursively to get an array of all paths in this directory
                let scandir = function(dir) { // Credit for this function before I modified it: https://stackoverflow.com/a/16684530/12934162
                    let results = [];
                    let list = fs.readdirSync(dir);

                    list.forEach(function(file) {
                        file = dir + "/" + file;

                        let stat = fs.statSync(file);

                        results.push(file); // Push the file and folder in order to avoid an ENOTEMPTY error and push it before the recursive part in order to have the folder above its files in the array to avoid ENOENT error

                        if (stat && stat.isDirectory()) results = results.concat(scandir(file)); // Call this function recursively again if it is a directory
                    });
                    return results;
                };

                let files = scandir("."); // Scan the directory of this installation

                // Define core plugins to replace them but not any user plugins
                let corePlugins = ["./plugins/template", "./plugins/webserver"];

                // Delete old files
                logger("", `${logger.colors.fgyellow}Deleting old files...${logger.colors.reset}`, true, false, logger.animation("loading"));

                files.forEach((e, i) => {

                    // Remove old files except dontDelete, the freshly downloaded files, the node_modules, backup & .git folders and any non-core plugins
                    if (fs.existsSync(e) && !dontDelete.includes(e)
                        && !e.includes(`./steam-comment-service-bot-${controller.data.datafile.branch}`)
                        && !e.includes("./node_modules") && !e.includes("./backup") && !e.includes("./.git")
                        && (!e.includes("./plugins") || corePlugins.some(f => e.includes(f)))) {

                        fs.rmSync(e, { recursive: true });
                    }

                    // Continue if finished
                    if (files.length == i + 1) {

                        // Move new files out of directory created by download() into our working directory
                        let newfiles = scandir(`./steam-comment-service-bot-${controller.data.datafile.branch}`);

                        logger("", `${logger.colors.fgyellow}Moving new files...${logger.colors.reset}`, true, false, logger.animation("loading"));

                        newfiles.forEach(async (e, i) => {
                            let eCut = e.replace(`steam-comment-service-bot-${controller.data.datafile.branch}/`, ""); // ECut should resemble the same path but how it would look like in the base directory

                            if (fs.statSync(e).isDirectory() && !fs.existsSync(eCut)) fs.mkdirSync(eCut);                                       // Create directory if it doesn't exist
                            if (!fs.existsSync(eCut) || !fs.statSync(eCut).isDirectory() && !dontDelete.includes(eCut)) fs.renameSync(e, eCut); // Only rename if not directory and not in dontDelete. We need to check first if it exists to avoid a file not found error with isDirectory()

                            // Continue if finished
                            if (newfiles.length == i + 1) {
                                fs.rmSync(`./steam-comment-service-bot-${controller.data.datafile.branch}`, { recursive: true }); // Remove the remains of the download folder

                                // Run custom update rules for a few files. Note: This will load the new file but call with old parameters. Sounds like a recipe for disaster
                                await require("./customUpdateRules.js").customUpdateRules(null, oldconfig, oldadvancedconfig, olddatafile);

                                // Make callback with no error message to let caller carry on
                                resolve(null);
                            }
                        });
                    }
                });
            } catch (err) {
                if (err) resolve(err); // Error during installation
            }
        }).catch((err) => {
            if (err) resolve(err); // Error during download
        });

    });
};