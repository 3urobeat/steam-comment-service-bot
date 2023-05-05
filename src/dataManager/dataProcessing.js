/*
 * File: dataProcessing.js
 * Project: steam-comment-service-bot
 * Created Date: 27.03.2023 21:34:45
 * Author: 3urobeat
 *
 * Last Modified: 06.05.2023 00:20:32
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs              = require("fs");
const SteamID         = require("steamid");
const steamIdResolver = require("steamid-resolver"); // My own library, cool right?

const DataManager = require("./dataManager");


/**
 * Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)
 */
DataManager.prototype.processData = function() {
    let _this = this;

    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            function yourgroup() {
                return new Promise((resolve) => {

                    if (_this.config.yourgroup.length == 0) { // Check if yourgroup is empty
                        logger("debug", "DataManager processData(): yourgroup is not set, clearing cachefile entry"); // Log to output for debugging

                        // Reset cachefile values
                        _this.cachefile.configgroup = "";
                        _this.cachefile.configgroup64id = "";

                        return resolve();
                    }

                    // Check if URL was processed previously and skip conversion
                    if (_this.cachefile.configgroup == _this.config.yourgroup) {
                        logger("debug", "DataManager processData(): ID of yourgroup is stored in cache.json, skipping...");
                        return resolve();
                    }

                    logger("info", "groupID64 of yourgroup is not in cache.json. Requesting information from Steam...", false, true, logger.animation("loading"));

                    steamIdResolver.groupUrlToGroupID64(_this.config.yourgroup, (err, res) => {
                        if (err == "The specified group could not be found.") { // If the group couldn't be found display specific message
                            logger("error", "Your yourgroup in config doesn't seem to be valid!\n        Error: " + _this.config.yourgroup + " contains no xml or groupID64 data", true);
                            return resolve();
                        } else {
                            if (err) {
                                logger("error", "Error getting yourgroup information from Steam: " + err); // If a different error then display a generic message with the error
                                return resolve();
                            }
                        }

                        logger("info", `Successfully retrieved yourgroup information. groupID64: ${res}`, false, true, logger.animation("loading"));

                        _this.cachefile.configgroup     = _this.config.yourgroup;
                        _this.cachefile.configgroup64id = res;
                        resolve();
                    });

                });
            }

            function botsgroup() {
                return new Promise((resolve) => {

                    if (_this.config.botsgroup.length == 0) { // Check if botsgroup is empty
                        logger("debug", "DataManager processData(): botsgroup is not set, clearing cachefile entry"); // Log to output for debugging

                        // Reset cachefile values
                        _this.cachefile.botsgroup = "";
                        _this.cachefile.botsgroupid = "";

                        return resolve();
                    }

                    // Check if URL was processed previously and skip conversion
                    if (_this.cachefile.botsgroup == _this.config.botsgroup) {
                        logger("debug", "DataManager processData(): ID of botsgroup is stored in cache.json, skipping...");
                        return resolve();
                    }

                    logger("info", "groupID64 of botsgroup is not in cache.json. Requesting information from Steam...", false, true, logger.animation("loading"));

                    steamIdResolver.groupUrlToGroupID64(_this.config.botsgroup, (err, res) => {
                        if (err == "The specified group could not be found.") { // If the group couldn't be found display specific message
                            logger("warn", "Your botsgroup in config doesn't seem to be valid!\n                             " + _this.config.botsgroup + " contains no xml or groupID64 data");
                            return resolve();
                        } else {
                            if (err) {
                                logger("error", "Error getting botsgroup information from Steam: " + err); // If a different error then display a generic message with the error
                                return resolve();
                            }
                        }

                        logger("info", `Successfully retrieved botsgroup information. groupID64: ${res}`, false, true, logger.animation("loading"));

                        _this.cachefile.botsgroup   = _this.config.botsgroup;
                        _this.cachefile.botsgroupid = res;
                        resolve();
                    });

                });
            }

            function owners() {
                return new Promise((resolve) => {

                    let tempArr = [];
                    logger("debug", `DataManager processData(): Converting ${_this.config.ownerid.length} owner(s)...`);

                    // Check for last iteration, update cache and resolve Promise
                    function finishedResponse(i) {
                        if (i + 1 == _this.config.ownerid.length) {
                            logger("debug", "DataManager processData(): Finished converting all ownerids. Array:");
                            logger("debug", tempArr);

                            _this.cachefile["ownerid"] = tempArr; // Refresh cache
                            resolve();
                        }
                    }

                    // Instantly bail out if the array is empty. DataCheck will abort the bot later on
                    if (_this.config.ownerid.length == 0) finishedResponse(-1);

                    // Either convert to steamID64 or directly push e
                    _this.config.ownerid.forEach((e, i) => {
                        if (isNaN(e) || !new SteamID(String(e)).isValid()) {
                            steamIdResolver.customUrlTosteamID64(String(e), (err, id) => {
                                if (err) {
                                    logger("warn", `ownerid ${e} in your config does not seem to be valid! Error: ${err}`);
                                    tempArr[i] = null;
                                } else {
                                    logger("debug", `DataManager processData(): Converted ${e} to ${id}`);
                                    tempArr[i] = id;
                                }

                                finishedResponse(i);
                            });
                        } else {
                            tempArr[i] = e;
                            finishedResponse(i);
                        }
                    });

                });
            }


            // Process all three, then update cache.json
            await Promise.all([yourgroup(), botsgroup(), owners()]);

            fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(this.cachefile, null, 4), err => {
                if (err) logger("error", `DataManager processData(): Error updating cache.json: ${err}`);

                resolve();
            });

        })();
    });
};