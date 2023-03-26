/*
 * File: dataImport.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 26.03.2023 11:00:30
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs          = require("fs");
const path        = require("path");
const nedb        = require("@seald-io/nedb");
const DataManager = require("./dataManager.js");


/**
 * Internal: Loads all config & data files from disk and handles potential errors
 * @returns {Promise} Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype._importFromDisk = function() {
    let _this = this; // Make this accessible within the functions below

    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            function loadCache() {
                return new Promise((resolve) => {
                    try {
                        resolve(require(srcdir + "/data/cache.json"));

                    } catch (err) {

                        if (err) {
                            logger("", "", true, true);
                            logger("warn", "cache.json seems to have lost it's data/is corrupted. Trying to write/create...", true, true);

                            // Create the underlying folder structure to avoid error when trying to write the downloaded file
                            fs.mkdirSync(path.dirname("./src/data/cache.json"), { recursive: true });

                            fs.writeFile("./src/data/cache.json", "{}", (err) => { // Write empty valid json
                                if (err) {
                                    logger("error", "Error writing {} to cache.json.\nPlease do this manually: Go into 'src' folder, open 'cache.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true);
                                    return process.send("stop()"); // Abort since writeFile was unable to write and any further execution would crash
                                } else {
                                    logger("info", "Successfully cleared/created cache.json.\n", true, true);
                                    resolve(require(srcdir + "/data/cache.json"));
                                }
                            });
                        }
                    }
                });
            }

            function loadData() {
                return new Promise((resolve) => {
                    try {
                        resolve(require(srcdir + "/data/data.json"));

                    } catch (err) {

                        if (err) { // Corrupted!
                            logger("", "", true, true);
                            logger("warn", "'data.json' seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                            // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                            if (_this.cache.datajson) _this._restoreBackup("data.json", srcdir + "/data/data.json", _this.cache.datajson, "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/data/data.json", resolve);
                                else _this._pullNewFile("data.json", srcdir + "/data/data.json", resolve);
                        }
                    }
                });
            }

            function loadConfig() {
                return new Promise((resolve) => {
                    try {
                        resolve(require(srcdir + "/../config.json"));

                    } catch (err) {

                        if (err) { // Corrupted!
                            logger("", "", true, true);
                            logger("warn", "'config.json' seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                            let restoreTimeout = 0; // Allow the following firststart check to delay the restore process so the user has time to read the info message

                            // Display an informational message about what happened if extdata.firststart is true
                            if (extdata && extdata.firststart) {
                                logger("", logger.colors.fgred + "\n--------------------------------------" + logger.colors.reset, true);
                                logger("", `${logger.colors.fgcyan}Hey!${logger.colors.reset} It seems like this is your first start and you made a formatting mistake in your '${logger.colors.fgcyan}config.json${logger.colors.reset}' file. Because of this I'm sadly ${logger.colors.fgcyan}unable to load${logger.colors.reset} the file.`, true);
                                logger("", `You can stop the bot now by pressing ${logger.colors.fgcyan}CTRL+C${logger.colors.reset} to fix the issue. Please make sure that you exactly follow the format of the provided 'config.json' when filling in your settings.`, true);
                                logger("", `Take a look at the default config here and pay attention to every ${logger.colors.fgcyan}"${logger.colors.reset} and ${logger.colors.fgcyan},${logger.colors.reset} as you most likely forgot one of them: ${logger.colors.fgcyan}${logger.colors.underscore}https://github.com/HerrEurobeat/steam-comment-service-bot/blob/master/config.json${logger.colors.reset}`, true);
                                logger("", `You can also take a look at this blog post to learn more about JSON formatting: ${logger.colors.fgcyan}${logger.colors.underscore}https://stackoverflow.blog/2022/06/02/a-beginners-guide-to-json-the-data-format-for-the-internet/${logger.colors.reset}`, true);
                                logger("", logger.colors.fgred + "--------------------------------------\n" + logger.colors.reset, true);
                                logger("", "Restoring the config to default in 15 seconds...", true, false, logger.animation("waiting"));

                                restoreTimeout = 15000; // Delay restore process by 10 secs
                            }

                            // Wait restoreTimeout ms if set by firststart check from above
                            setTimeout(() => {
                                // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                                if (_this.cache.configjson) _this._restoreBackup("config.json", srcdir + "/../config.json", _this.cache.configjson, "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json", resolve);
                                    else _this._pullNewFile("config.json", srcdir + "/../config.json", resolve);
                            }, restoreTimeout);
                        }
                    }
                });
            }

            function loadAdvancedConfig() {
                return new Promise((resolve) => {
                    try {
                        resolve(require(srcdir + "/../advancedconfig.json"));
                    } catch (err) {
                        if (err) { // Corrupted!
                            logger("", "", true, true);
                            logger("warn", "advancedconfig.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                            // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                            if (_this.cache.advancedconfigjson) _this._restoreBackup("advancedconfig.json", srcdir + "/../advancedconfig.json", _this.cache.advancedconfigjson, "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/advancedconfig.json", resolve);
                                else _this._pullNewFile("advancedconfig.json", srcdir + "/../advancedconfig.json", resolve);
                        }
                    }
                });
            }

            function loadLoginInfo() {
                return new Promise((resolve) => {
                    let logininfo = {};

                    // Check accounts.txt first so we can ignore potential syntax errors in logininfo
                    if (fs.existsSync("./accounts.txt")) {
                        let data = fs.readFileSync("./accounts.txt", "utf8").split("\n");

                        if (data.length > 0 && data[0].startsWith("//Comment")) data = data.slice(1); // Remove comment from array

                        if (data != "") {
                            logger("info", "Accounts.txt does exist and is not empty - using it instead of logininfo.json.", false, true);

                            logininfo = {}; // Set empty object
                            data.forEach((e, i) => {
                                if (e.length < 2) return; // If the line is empty ignore it to avoid issues like this: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/80
                                e = e.split(":");
                                e[e.length - 1] = e[e.length - 1].replace("\r", ""); // Remove Windows next line character from last index (which has to be the end of the line)
                                logininfo["bot" + i] = [e[0], e[1], e[2]];
                            });

                            resolve(logininfo);
                        }
                    }

                    // Check logininfo for Syntax errors and display custom error message
                    try {
                        logger("info", "accounts.txt seems empty/not created, loading logininfo from logininfo.json...", false, true, logger.animation("loading"));

                        // Only check if file exists (it is not shipped by default anymore since 2.12.1). If it doesn't an empty obj will be returned, leading to empty logininfo err msg in datacheck.js
                        if (fs.existsSync("./logininfo.json")) logininfo = require(srcdir + "/../logininfo.json");

                        resolve(logininfo);
                    } catch (err) {
                        logger("error", "It seems like you made a mistake in your logininfo.json. Please check if your Syntax looks exactly like in the example/template and try again.\n        " + err, true);
                        return process.send("stop()");
                    }
                });
            }

            function loadProxies() {
                return new Promise((resolve) => {
                    let proxies = []; // When the file is just created there can't be proxies in it (this bot doesn't support magic)

                    if (!fs.existsSync("./proxies.txt")) {
                        logger("info", "Creating proxies.txt file as it doesn't exist yet...", false, true, logger.animation("loading"));

                        fs.writeFile(srcdir + "/../proxies.txt", "", err => {
                            if (err) logger("error", "error creating proxies.txt file: " + err);
                                else logger("info", "Successfully created proxies.txt file.", false, true, logger.animation("loading"));
                        });

                    } else { // File does seem to exist so now we can try and read it
                        proxies = fs.readFileSync("./proxies.txt", "utf8").split("\n");
                        proxies = proxies.filter(str => str != ""); // Remove empty lines

                        if (proxies.length > 0 && proxies[0].startsWith("//Comment")) proxies = proxies.slice(1); // Remove comment from array

                        if (_this.advancedconfig.useLocalIP) proxies.unshift(null); // Add no proxy (local ip) if useLocalIP is true

                        // check if no proxies were found (can only be the case when useLocalIP is false)
                        if (proxies.length == 0) {
                            logger("", "", true);
                            logger("error", "useLocalIP is turned off in advancedconfig.json but I couldn't find any proxies in proxies.txt!\n        Aborting as I don't have at least one IP to log in with!", true);
                            return process.send("stop()");
                        }
                    }

                    resolve(proxies);
                });
            }

            function loadQuotes() {
                return new Promise((resolve) => {
                    let quotes = [];

                    quotes = fs.readFileSync(srcdir + "/../quotes.txt", "utf8").split("\n"); // Get all quotes from the quotes.txt file into an array
                    quotes = quotes.filter(str => str != "");                                // Remove empty quotes

                    quotes.forEach((e, i) => { // Multi line strings that contain \n will get split to \\n -> remove second \ so that node-steamcommunity understands the quote when commenting
                        if (e.length > 999) {
                            logger("warn", `The quote.txt line ${i} is longer than the limit of 999 characters. This quote will be ignored for now.`, true, false, logger.animation("loading"));
                            quotes.splice(i, 1); // Remove this item from the array
                            return;
                        }

                        quotes[i] = e.replace(/\\n/g, "\n").replace("\\n", "\n");
                    });

                    if (quotes.length == 0) { // Check if quotes.txt is empty to avoid errors further down when trying to comment
                        logger("error", `${logger.colors.fgred}You haven't put any comment quotes into the quotes.txt file! Aborting...`, true);
                        return process.send("stop()");
                    } else {
                        logger("info", `Successfully loaded ${quotes.length} quotes from quotes.txt...`, false, true, logger.animation("loading"));
                    }

                    resolve(quotes);
                });
            }

            function loadLanguage() {
                return new Promise((resolve) => {
                    let lang = require(srcdir + "/data/lang/defaultlang.json");

                    // Check before trying to import if the user even created the file
                    if (fs.existsSync(srcdir + "/../customlang.json")) {
                        let customlang;
                        let customlangkeys = 0;

                        // Try importing customlang.json
                        try {
                            customlang = require(srcdir + "/../customlang.json");
                        } catch (err) {
                            logger("error", "It seems like you made a mistake (probably Syntax) in your customlang.json! I will not use any custom message.\nError: " + err);

                            resolve(lang);
                        }

                        // Overwrite values in lang object with values from customlang
                        Object.keys(customlang).forEach((e, i) => {
                            if (e != "" && e != "note") {
                                lang[e] = customlang[e]; // Overwrite each defaultlang key with a corresponding customlang key if one is set

                                customlangkeys++;
                            }

                            if (i == Object.keys(customlang).length - 1) { // Check for last iteration
                                if (customlangkeys > 0) logger("info", `${customlangkeys} customlang key imported!`, false, true, logger.animation("loading"));
                                    else logger("info", "No customlang keys found.", false, true, logger.animation("loading"));

                                resolve(lang);
                            }
                        });
                    } else {
                        logger("info", "No customlang.json file found...", false, true, logger.animation("loading"));

                        resolve(lang);
                    }
                });
            }


            // Call all functions from above after another. This must be done async to avoid a check failing that depends on something from a previous function
            logger("info", "Importing data files and settings...", false, true, logger.animation("loading"));

            this.cachefile      = await loadCache();
            this.datafile       = await loadData();
            this.config         = await loadConfig();
            this.advancedconfig = await loadAdvancedConfig();
            this.logininfo      = await loadLoginInfo();
            this.proxies        = await loadProxies();
            this.quotes         = await loadQuotes();
            this.lang           = await loadLanguage();

            this.lastCommentDB  = new nedb({ filename: srcdir + "/data/lastcomment.db", autoload: true }); // Autoload
            this.tokensDB       = new nedb({ filename: srcdir + "/data/tokens.db",      autoload: true });

            // Resolve our promise to let caller know the dataImport is finished
            resolve();

        })();
    });

};