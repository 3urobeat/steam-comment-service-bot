/*
 * File: dataImport.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 05.09.2023 19:00:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs   = require("fs");
const path = require("path");
const nedb = require("@seald-io/nedb");
const DataManager = require("./dataManager.js");


/**
 * Internal: Loads all config & data files from disk and handles potential errors
 * @returns {Promise.<void>} Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype._importFromDisk = async function () {
    let _this = this; // Make this accessible within the functions below

    /* eslint-disable jsdoc/require-jsdoc */
    function loadCache() {
        return new Promise((resolve) => {
            try {
                delete require.cache[require.resolve(srcdir + "/data/cache.json")]; // Delete cache to enable reloading data

                resolve(require(srcdir + "/data/cache.json"));
            } catch (err) {
                if (err) {
                    logger("", "", true, true);
                    logger("warn", "cache.json seems to have lost it's data/is corrupted. Trying to write/create...", true, true);

                    // Create the underlying folder structure to avoid error when trying to write the downloaded file
                    fs.mkdirSync(path.dirname("./src/data/cache.json"), { recursive: true });

                    fs.writeFile("./src/data/cache.json", "{}", (err) => {
                        // Write empty valid json
                        if (err) {
                            logger("error", "Error writing {} to cache.json.\nPlease do this manually: Go into 'src' folder, open 'cache.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true);
                            return _this.controller.stop(); // Abort since writeFile was unable to write and any further execution would crash
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
                delete require.cache[require.resolve(srcdir + "/data/data.json")]; // Delete cache to enable reloading data

                resolve(require(srcdir + "/data/data.json"));
            } catch (err) {
                if (err) {
                    // Corrupted!
                    logger("", "", true, true);
                    logger("warn", "'data.json' seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                    // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                    if (_this.cachefile.datajson) _this._restoreBackup("data.json", srcdir + "/data/data.json", _this.cachefile.datajson, "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/src/data/data.json", resolve);
                        else _this._pullNewFile("data.json", "./src/data/data.json", resolve);
                }
            }
        });
    }

    function loadConfig() {
        return new Promise((resolve) => {
            try {
                delete require.cache[require.resolve(srcdir + "/../config.json")]; // Delete cache to enable reloading data

                resolve(require(srcdir + "/../config.json"));
            } catch (err) {
                if (err) {
                    // Corrupted!
                    logger("", "", true, true);
                    logger("warn", "'config.json' seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                    let restoreTimeout = 0; // Allow the following firststart check to delay the restore process so the user has time to read the info message

                    // Display an informational message about what happened if datafile firststart is true
                    if (_this.datafile && _this.datafile.firststart) {
                        logger("", logger.colors.fgred + "\n--------------------------------------" + logger.colors.reset, true);
                        logger("", `${logger.colors.fgcyan}Hey!${logger.colors.reset} It seems like this is your first start and you made a formatting mistake in your '${logger.colors.fgcyan}config.json${logger.colors.reset}' file. Because of this I'm sadly ${logger.colors.fgcyan}unable to load${logger.colors.reset} the file.`, true);
                        logger("", `You can stop the bot now by pressing ${logger.colors.fgcyan}CTRL+C${logger.colors.reset} and fix the issue. Please make sure that you exactly follow the format of the provided 'config.json' when filling in your settings.`, true);
                        logger("", `Take a look at the default config here and pay attention to every ${logger.colors.fgcyan}"${logger.colors.reset} and ${logger.colors.fgcyan},${logger.colors.reset} as you most likely forgot one of them: ${logger.colors.fgcyan}${logger.colors.underscore}https://github.com/3urobeat/steam-comment-service-bot/blob/master/config.json${logger.colors.reset}`, true);
                        logger("", `You can also take a look at this blog post to learn more about JSON formatting: ${logger.colors.fgcyan}${logger.colors.underscore}https://stackoverflow.blog/2022/06/02/a-beginners-guide-to-json-the-data-format-for-the-internet/${logger.colors.reset}`, true);
                        logger("", logger.colors.fgred + "--------------------------------------\n" + logger.colors.reset, true);
                        logger("", "Restoring the config to default in 15 seconds...", true, false, logger.animation("waiting"));

                        restoreTimeout = 15000; // Delay restore process by 10 secs
                    }

                    // Wait restoreTimeout ms if set by firststart check from above
                    setTimeout(() => {
                        // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                        if (_this.cachefile.configjson) _this._restoreBackup("config.json", srcdir + "/../config.json", _this.cachefile.configjson, "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/config.json", resolve);
                            else _this._pullNewFile("config.json", "./config.json", resolve);
                    }, restoreTimeout);
                }
            }
        });
    }

    function loadAdvancedConfig() {
        return new Promise((resolve) => {
            try {
                delete require.cache[require.resolve(srcdir + "/../advancedconfig.json")]; // Delete cache to enable reloading data

                resolve(require(srcdir + "/../advancedconfig.json"));
            } catch (err) {
                if (err) {
                    // Corrupted!
                    logger("", "", true, true);
                    logger("warn", "advancedconfig.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                    // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                    if (_this.cachefile.advancedconfigjson) _this._restoreBackup("advancedconfig.json", srcdir + "/../advancedconfig.json", _this.cachefile.advancedconfigjson, "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/advancedconfig.json", resolve);
                        else _this._pullNewFile("advancedconfig.json", "./advancedconfig.json", resolve);
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
                    logininfo = {}; // Set empty object
                    data.forEach((e) => {
                        if (e.length < 2) return; // If the line is empty ignore it to avoid issues like this: https://github.com/3urobeat/steam-comment-service-bot/issues/80
                        e = e.split(":");
                        e[e.length - 1] = e[e.length - 1].replace("\r", ""); // Remove Windows next line character from last index (which has to be the end of the line)

                        // Format logininfo object and use accountName as key to allow the order to change
                        logininfo[e[0]] = {
                            accountName: e[0],
                            password: e[1],
                            sharedSecret: e[2],
                            steamGuardCode: null,
                            machineName: `${_this.datafile.mestr}'s Comment Bot`, // For steam-user
                            deviceFriendlyName: `${_this.datafile.mestr}'s Comment Bot`, // For steam-session
                        };
                    });

                    logger("info", `Found ${Object.keys(logininfo).length} accounts in accounts.txt, not checking for logininfo.json...`, false, true, logger.animation("loading"));

                    return resolve(logininfo);
                }
            }

            // Check logininfo for Syntax errors and display custom error message
            try {
                // Only check if file exists (it is not shipped by default anymore since 2.12.1). If it doesn't an empty obj will be returned, leading to empty logininfo err msg in checkData()
                if (fs.existsSync("./logininfo.json")) {
                    delete require.cache[require.resolve(srcdir + "/../logininfo.json")]; // Delete cache to enable reloading data

                    logininfo = require(srcdir + "/../logininfo.json");

                    // Reformat to use new logininfo object structure and use accountName as key instead of bot0 etc to allow the order to change
                    Object.keys(logininfo).forEach((k) => {
                        logininfo[logininfo[k][0]] = {
                            accountName: logininfo[k][0],
                            password: logininfo[k][1],
                            sharedSecret: logininfo[k][2],
                            steamGuardCode: null,
                            machineName: `${_this.datafile.mestr}'s Comment Bot`, // For steam-user
                            deviceFriendlyName: `${_this.datafile.mestr}'s Comment Bot`, // For steam-session
                        };

                        delete logininfo[k]; // Remove old entry
                    });
                }

                logger("info", `Found ${Object.keys(logininfo).length} accounts in logininfo.json...`, false, true, logger.animation("loading"));

                resolve(logininfo);
            } catch (err) {
                logger("error", "It seems like you made a mistake in your logininfo.json. Please check if your Syntax looks exactly like in the example/template and try again.\n        " + err, true);
                return _this.controller.stop();
            }

            // Create empty accounts.txt file if neither exist
            if (!fs.existsSync("./accounts.txt")) _this._pullNewFile("accounts.txt", "./accounts.txt", () => {}, true); // Ignore resolve() param
        });
    }

    function loadProxies() {
        return new Promise((resolve) => {
            let proxies = []; // When the file is just created there can't be proxies in it (this bot doesn't support magic)

            if (!fs.existsSync("./proxies.txt")) {
                logger("info", "Creating empty proxies.txt file because it doesn't exist...", false, true, logger.animation("loading"));

                _this.proxies = [];
                _this.writeProxiesToDisk();

            } else {

                // File does seem to exist so now we can try and read it
                proxies = fs.readFileSync("./proxies.txt", "utf8").split("\n");
                proxies = proxies.filter((str) => str != ""); // Remove empty lines

                if (proxies.length > 0 && proxies[0].startsWith("//Comment")) proxies = proxies.slice(1); // Remove comment from array

                if (_this.advancedconfig.useLocalIP) proxies.unshift(null); // Add no proxy (local ip) if useLocalIP is true

                // Check if no proxies were found (can only be the case when useLocalIP is false)
                if (proxies.length == 0) {
                    logger("", "", true);
                    logger("error", "useLocalIP is turned off in advancedconfig.json but I couldn't find any proxies in proxies.txt!\n        Aborting as I don't have at least one IP to log in with!", true);
                    return _this.controller.stop();
                }
            }

            resolve(proxies);
        });
    }

    function loadQuotes() {
        return new Promise((resolve) => {
            let quotes = [];

            // Pull new file and call loadQuotes again, wait for it to resolve, and then resolve this promise. This is slightly hacky but relatively clean
            if (!fs.existsSync(srcdir + "/../quotes.txt")) {
                return _this._pullNewFile("quotes.txt", "./quotes.txt", async () => { resolve(await loadQuotes()); }, true);
            }

            quotes = fs.readFileSync(srcdir + "/../quotes.txt", "utf8").split("\n"); // Get all quotes from the quotes.txt file into an array
            quotes = quotes.filter((str) => str != ""); // Remove empty quotes

            quotes.forEach((e, i) => {
                // Multi line strings that contain \n will get split to \\n -> remove second \ so that node-steamcommunity understands the quote when commenting
                if (e.length > 999) {
                    logger("warn", `The quote.txt line ${i} is longer than the limit of 999 characters. This quote will be ignored for now.`, true, false, logger.animation("loading"));
                    quotes.splice(i, 1); // Remove this item from the array
                    return;
                }

                quotes[i] = e.replace(/\\n/g, "\n").replace("\\n", "\n");
            });

            if (quotes.length == 0) {
                // Check if quotes.txt is empty to avoid errors further down when trying to comment
                logger("error", `${logger.colors.fgred}You haven't put any comment quotes into the quotes.txt file! Aborting...`, true);
                return _this.controller.stop();
            } else {
                logger("info", `Successfully loaded ${quotes.length} quotes from quotes.txt...`, false, true, logger.animation("loading"));
            }

            resolve(quotes);
        });
    }

    function loadLanguage() {
        return new Promise((resolve) => {
            try {
                delete require.cache[require.resolve(srcdir + "/data/lang/defaultlang.json")]; // Delete cache to enable reloading data

                resolve(require(srcdir + "/data/lang/defaultlang.json"));
            } catch (err) {
                if (err) {
                    // Corrupted!
                    logger("", "", true, true);

                    // Pull the file directly from GitHub.
                    _this._pullNewFile("defaultlang.json", "./src/data/lang/defaultlang.json", resolve);
                }
            }
        });
    }

    function loadCustomLang() {
        return new Promise((resolve) => {
            // Check before trying to import if the user even created the file
            if (fs.existsSync(srcdir + "/../customlang.json")) {
                let customlang;
                let customlangkeys = 0;

                // Try importing customlang.json
                try {
                    delete require.cache[require.resolve(srcdir + "/../customlang.json")]; // Delete cache to enable reloading data

                    customlang = require(srcdir + "/../customlang.json");
                } catch (err) {
                    logger("error", "It seems like you made a mistake (probably Syntax) in your customlang.json! I will not use any custom message.\nError: " + err);

                    resolve(_this.lang); // Resolve with default lang object
                }

                // Overwrite values in lang object with values from customlang
                Object.keys(customlang).forEach((e, i) => {
                    if (e != "" && e != "note") {
                        _this.lang[e] = customlang[e]; // Overwrite each defaultlang key with a corresponding customlang key if one is set

                        customlangkeys++;
                    }

                    if (i == Object.keys(customlang).length - 1) {
                        // Check for last iteration
                        if (customlangkeys > 0) logger("info", `${customlangkeys} customlang key imported!`, false, true, logger.animation("loading"));
                            else logger("info", "No customlang keys found.", false, true, logger.animation("loading"));

                        resolve(_this.lang); // Resolve lang object with our new keys
                    }
                });
            } else {
                logger("info", "No customlang.json file found...", false, true, logger.animation("loading"));
                resolve(_this.lang); // Resolve with default lang object
            }
        });
    }
    /* eslint-enable jsdoc/require-jsdoc */

    // Call all functions from above after another. This must be done async to avoid a check failing that depends on something from a previous function. We sadly cannot use Promise.all() because of this.
    logger("info", "Importing data files and settings...", false, true, logger.animation("loading"));

    this.cachefile       = await loadCache();
    this.datafile        = await loadData();
    this.config          = await loadConfig();
    this.advancedconfig  = await loadAdvancedConfig();
    this.logininfo       = await loadLoginInfo();
    this.proxies         = await loadProxies();
    this.quotes          = await loadQuotes();
    this.lang            = await loadLanguage();
    this.lang            = await loadCustomLang();

    this.lastCommentDB   = new nedb({ filename: srcdir + "/data/lastcomment.db", autoload: true }); // Autoload
    this.ratingHistoryDB = new nedb({ filename: srcdir + "/data/ratingHistory.db", autoload: true });
    this.tokensDB        = new nedb({ filename: srcdir + "/data/tokens.db", autoload: true });

    // Check tokens.db every 24 hours for expired tokens to allow users to refresh them beforehand
    this._startExpiringTokensCheckInterval();

};
