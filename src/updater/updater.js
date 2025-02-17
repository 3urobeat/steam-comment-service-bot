/*
 * File: updater.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 18:24:39
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Controller = require("../controller/controller.js"); // eslint-disable-line


/**
 * Constructor - Initializes the updater which periodically checks for new versions available on GitHub, downloads them and handles backups.
 * @class
 * @param {Controller} controller Reference to the controller object
 */
const Updater = function(controller) {

    this.controller = controller;
    this.data       = controller.data;

};

// Let our updater see the world
module.exports = Updater;


/**
 * Checks for any available update and installs it.
 * @param {boolean} forceUpdate If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
 * @param {function(object, string): void} respondModule If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters.
 * @param {import("../commands/commandHandler.js").resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @returns {Promise.<boolean>} Promise that will be resolved with false when no update was found or with true when the update check or download was completed. Expect a restart when true was returned.
 */
Updater.prototype.run = function(forceUpdate, respondModule, resInfo) {
    const _this = this;

    /**
     * Shorthander to abort when a part of the updater is missing and couldn't be repaired
     */
    function stopOnFatalError() {
        logger("error", "Fatal Error: Failed to load updater! Please reinstall the bot manually. Aborting...");
        _this.stop();
    }


    // Return a new promise so the caller can wait for our result and start checking for an available update
    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            const { checkAndGetFile } = require("../starter.js");

            // Get our update check helper function
            const checkForUpdate = await checkAndGetFile("./src/updater/helpers/checkForUpdate.js", logger, false, false);
            if (!checkForUpdate) return resolve(false);

            checkForUpdate.check(this.data.datafile, null, forceUpdate, async (updateFound, onlineData) => {

                // Check if no update was found and abort
                if (!updateFound) {
                    if (parseInt(process.argv[3]) + 10000 > Date.now()) logger("info", `No available update found. (online: ${onlineData.versionstr} | local: ${this.data.datafile.versionstr})`, false, true, logger.animation("loading")); // Only print message with animation if the start is more recent than 10 seconds
                        else logger("info", `No available update found. (online: ${onlineData.versionstr} | local: ${this.data.datafile.versionstr})`, false, true);

                    if (respondModule) respondModule(resInfo, `No available update found. (online: ${onlineData.versionstr} | local: ${this.data.datafile.versionstr})`);

                    resolve(false); // Let the caller know about the result
                    return;
                }


                // Carry on if an update is available, first log our result
                logger("", "", true);
                logger("", `${logger.colors.fggreen}Update available!${logger.colors.reset} Your version: ${logger.colors.fgred}${this.data.datafile.versionstr}${logger.colors.reset} | New version: ${logger.colors.fggreen}${onlineData.versionstr}`, true);
                logger("", "", true);
                logger("", `${logger.colors.underscore}What's new:${logger.colors.reset} ${onlineData.whatsnew}\n`, true);


                // Call respondModule function if one was passed
                if (respondModule) {
                    respondModule(resInfo, `Update available! Your version: ${this.data.datafile.versionstr} | New version: ${onlineData.versionstr}`);
                    respondModule(resInfo, `What's new: ${onlineData.whatsnew}`);

                    // Instruct user to force update if disableAutoUpdate is true and stop here
                    if (this.data.advancedconfig.disableAutoUpdate && !forceUpdate) return respondModule(resInfo, await this.data.getLang("updaterautoupdatedisabled", { "cmdprefix": resInfo.cmdprefix }, resInfo.userID));
                }


                /**
                 * Make initiating the update a function to simplify the permission check below
                 * @private
                 */
                async function initiateUpdate() {
                    _this.controller.info.activeLogin = true; // Block new requests by setting active login to true

                    // Get our prepareUpdate helper and run it. It makes sure we wait for active requests to finish and logs off all accounts
                    const prepareUpdate = await checkAndGetFile("./src/updater/helpers/prepareUpdate.js", logger, false, false);
                    if (!prepareUpdate) return stopOnFatalError();

                    await prepareUpdate.run(_this.controller, respondModule, resInfo);


                    // Get our createBackup helper and run it. It creates a backup of our src folder so we can recover should the update fail
                    const createBackup = await checkAndGetFile("./src/updater/helpers/createBackup.js", logger, false, false);
                    if (!createBackup) return stopOnFatalError();

                    logger("", "", true); // Add separator to log as the actual updating process starts now
                    await createBackup.run();


                    // Get our downloadUpdate helper but don't run it yet. It does what it says on the tin.
                    const downloadUpdate = await checkAndGetFile("./src/updater/helpers/downloadUpdate.js", logger, false, false);
                    if (!downloadUpdate) return stopOnFatalError();

                    // Get our restoreBackup helper and load it into memory. This ensures we can restore a backup, even if the restoreBackup file got corrupted by the update
                    const restoreBackup = await checkAndGetFile("./src/updater/helpers/restoreBackup.js", logger, false, false);
                    if (!restoreBackup) return stopOnFatalError();


                    // Start downloading & installing the update
                    const err = await downloadUpdate.startDownload(_this.controller);

                    // Check if an error occurred and restore the backup
                    if (err) {
                        logger("error", "I failed trying to download & install the update! Please contact the bot developer with the following error here: https://github.com/3urobeat/steam-comment-service-bot/issues/new/choose", true);
                        logger("error", err.stack, true);

                        // Try to restore backup
                        logger("info", "Since I probably won't be able to continue from here, I'll try to restore from a backup if one exists.\n       I'll try to update again the next time you start the bot or in 6 hours should the auto updater be enabled.\n       If this issue keeps happening please think about setting disableAutoUpdate in advancedconfig.json to true.", true);

                        await restoreBackup.run();

                        // Restart and indicate that the update failed
                        resolve(true);
                        _this.controller.restart(JSON.stringify({ skippedaccounts: _this.controller.info.skippedaccounts, updateFailed: true }));

                    } else { // Update succeeded, update npm dependencies and restart

                        logger("", `${logger.colors.fgyellow}Updating packages with npm...${logger.colors.reset}`, true, false, logger.animation("loading"));

                        const npminteraction = await checkAndGetFile("./src/controller/helpers/npminteraction.js", logger, false, false);

                        // Continue and pray nothing bad happens if the npminteraction helper got lost in the sauce somehow
                        if (!npminteraction) {
                            logger("error", "I failed trying to update the dependencies. Please check the log after other errors for more information.\nTrying to continue anyway...");
                            _this.controller.restart(JSON.stringify({ skippedaccounts: _this.controller.info.skippedaccounts, updateFailed: false }));
                            resolve(true); // Finished updating!
                            return;
                        }

                        // Update the dependencies if the helper was loaded successfully but don't freak out about any errors
                        npminteraction.update((err) => {
                            if (err) logger("error", "I failed trying to update the dependencies. Please check the log after other errors for more information.\nTrying to continue anyway...");

                            // If everything went to plan, resolve our promise and restart the bot!
                            logger("", `${logger.colors.fgyellow}Done! Restarting...\n${logger.colors.reset}`, true);
                            resolve(true);
                            _this.controller.restart(JSON.stringify({ skippedaccounts: _this.controller.info.skippedaccounts, updateFailed: false }));
                        });
                    }
                }


                // Check if we should ask the user before starting to update
                if (this.data.advancedconfig.disableAutoUpdate && !forceUpdate) {
                    if (botisloggedin) return resolve(false); // Only ask on start, otherwise this will annoy the user

                    // Get user choice from terminal input
                    logger.readInput(`You have disabled the automatic updater.\n${logger.colors.brfgyellow}Would you like to update now?${logger.colors.reset} [y/n] `, 7500, (text) => {
                        if (!text) { // User didn't respond in 7.5 seconds
                            process.stdout.write(`${logger.colors.fgred}X${logger.colors.reset}\n`); // Write a X behind the y/n question

                            logger("info", `${logger.colors.brfgyellow}Stopping updater since you didn't reply in 7.5 seconds...\n\n`, true, false);
                            resolve(false);

                        } else { // User did respond, check content of response

                            if (text.toString().trim() != "y") return resolve(false); // Abort on any answer that isn't yes

                            initiateUpdate(); // No need to wait 2.5 seconds here as the user 100% took longer to input 'y'
                        }
                    });
                } else {
                    // Delay calling initiateUpdate() by 2.5 sec if respondModule is defined to give it some time to deliver the messages sent above
                    setTimeout(() => initiateUpdate(), respondModule != null ? 2500 : 0);
                }
            });

        })();
    });
};


/**
 * Registers an update check job. This is called by Controller after the data integrity and startup update check
 * @private
 */
Updater.prototype._registerUpdateChecker = function() {

    this.controller.jobManager.registerJob({
        name: "updateCheck",
        description: "Checks for new updates from the GitHub repository every 6 hours",
        func: () => { this.run(); },
        interval: 21600000, // 6 hours in ms
        runOnRegistration: false
    });

};
