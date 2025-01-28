/*
 * File: dataImport.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-28 17:47:43
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
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
 * Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors
 * @returns {Promise.<object>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importCacheFromDisk = function() {
    return new Promise((resolve) => {
        try {
            delete require.cache[require.resolve(srcdir + "/data/cache.json")]; // Delete cache to enable reloading data

            const cacheJson = require(srcdir + "/data/cache.json");

            this.controller._dataUpdateEvent("cachefile", this.cachefile, cacheJson);
            this.cachefile = cacheJson;
            resolve(cacheJson);
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
                        return this.controller.stop(); // Abort since writeFile was unable to write and any further execution would crash
                    } else {
                        logger("info", "Successfully cleared/created cache.json.\n", true, true);

                        const cacheJson = require(srcdir + "/data/cache.json");

                        this.controller._dataUpdateEvent("cachefile", this.cachefile, cacheJson);
                        this.cachefile = cacheJson;
                        resolve(cacheJson);
                    }
                });
            }
        }
    });
};


/**
 * Loads data.json from disk, updates datafile property in DataManager and handles potential errors
 * @returns {Promise.<object>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importDataFromDisk = function() {
    return new Promise((resolve) => {
        try {
            delete require.cache[require.resolve(srcdir + "/data/data.json")]; // Delete cache to enable reloading data

            const dataJson = require(srcdir + "/data/data.json");

            this.controller._dataUpdateEvent("datafile", this.datafile, dataJson);
            this.datafile = dataJson;
            resolve(dataJson);
        } catch (err) {
            if (err) {
                // Corrupted!
                logger("", "", true, true);
                logger("warn", "'data.json' seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                if (this.cachefile.datajson) {
                    this._restoreBackup("data.json", srcdir + "/data/data.json", this.cachefile.datajson, "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/src/data/data.json", (data) => {
                        this.controller._dataUpdateEvent("datafile", this.datafile, data);
                        this.datafile = data;
                        resolve(data);
                    });
                } else {
                    this._pullNewFile("data.json", "./src/data/data.json", (data) => {
                        this.controller._dataUpdateEvent("datafile", this.datafile, data);
                        this.datafile = data;
                        resolve(data);
                    });
                }
            }
        }
    });
};


/**
 * Loads config.json from disk, updates config property in DataManager and handles potential errors
 * @returns {Promise.<object>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importConfigFromDisk = function() {
    return new Promise((resolve) => {
        try {
            delete require.cache[require.resolve(srcdir + "/../config.json")]; // Delete cache to enable reloading data

            const configJson = require(srcdir + "/../config.json");

            this.controller._dataUpdateEvent("config", this.config, configJson);
            this.config = configJson;
            resolve(configJson);
        } catch (err) {
            if (err) {
                // Corrupted!
                logger("", "", true, true);
                logger("warn", "'config.json' seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                let restoreTimeout = 0; // Allow the following firststart check to delay the restore process so the user has time to read the info message

                // Display an informational message about what happened if datafile firststart is true
                if (this.datafile && this.datafile.firststart) {
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
                    if (this.cachefile.configjson) {
                        this._restoreBackup("config.json", srcdir + "/../config.json", this.cachefile.configjson, "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/config.json", (data) => {
                            this.controller._dataUpdateEvent("config", this.config, data);
                            this.config = data;
                            resolve(data);
                        });
                    } else {
                        this._pullNewFile("config.json", "./config.json", (data) => {
                            this.controller._dataUpdateEvent("config", this.config, data);
                            this.config = data;
                            resolve(data);
                        });
                    }
                }, restoreTimeout);
            }
        }
    });
};


/**
 * Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors
 * @returns {Promise.<object>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importAdvancedConfigFromDisk = function() {
    return new Promise((resolve) => {
        try {
            delete require.cache[require.resolve(srcdir + "/../advancedconfig.json")]; // Delete cache to enable reloading data

            const advancedconfigJson = require(srcdir + "/../advancedconfig.json");

            this.controller._dataUpdateEvent("advancedconfig", this.advancedconfig, advancedconfigJson);
            this.advancedconfig = advancedconfigJson;
            resolve(advancedconfigJson);
        } catch (err) {
            if (err) {
                // Corrupted!
                logger("", "", true, true);
                logger("warn", "advancedconfig.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true);

                // Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                if (this.cachefile.advancedconfigjson) {
                    this._restoreBackup("advancedconfig.json", srcdir + "/../advancedconfig.json", this.cachefile.advancedconfigjson, "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/advancedconfig.json", (data) => {
                        this.controller._dataUpdateEvent("advancedconfig", this.advancedconfig, data);
                        this.advancedconfig = data;
                        resolve(data);
                    });
                } else {
                    this._pullNewFile("advancedconfig.json", "./advancedconfig.json", (data) => {
                        this.controller._dataUpdateEvent("advancedconfig", this.advancedconfig, data);
                        this.advancedconfig = data;
                        resolve(data);
                    });
                }
            }
        }
    });
};


/**
 * Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors
 * @returns {Promise.<object[]>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importLogininfoFromDisk = function() {
    return new Promise((resolve) => {
        (async () => {                  // We need await support in this Promise, sorry for the convoluted pattern :/
            const logininfo = [];

            // Check accounts.txt first so we can ignore potential syntax errors in logininfo
            if (fs.existsSync("./accounts.txt")) {
                let data = fs.readFileSync("./accounts.txt", "utf8").split("\n");

                if (data != "") {
                    // Remove comment from array
                    if (data.length > 0 && data[0].startsWith("//Comment")) {
                        data = data.slice(1);
                    }

                    // Check for special syntax that includes all cached accounts in tokens.db
                    if (data.includes("*:cookie")) {
                        const dbRes = await this.tokensDB.findAsync({}); // Get all

                        dbRes.forEach((e) => {
                            // Push this account to data if it wasn't already configured manually
                            if (!data.includes(`${e.accountName}:`)) {
                                logger("debug", `DataManager importLogininfoFromDisk(): Special syntax "*:cookie" found, pushing accountName '${e.accountName}' to data...`);

                                // Use "usecachedcookie" for sharedsecret to let dataExport know that *:cookie was used. Keep password null to prevent sessionHandler from attempting to use it
                                data.push(`${e.accountName}::usecachedcookie`);
                            }
                        });
                    }

                    // Filter empty or special syntax lines to avoid issues
                    data = data.filter((e) => e.length > 1 && e != "*:cookie");

                    data.forEach((e, i) => {
                        e = e.split(":");
                        e[e.length - 1] = e[e.length - 1].replace("\r", ""); // Remove Windows next line character from last index (which has to be the end of the line)

                        logininfo.push({
                            index: i,
                            accountName: e[0],
                            password: e[1],
                            sharedSecret: e[2],
                            steamGuardCode: null
                        });
                    });

                    logger("debug", `DataManager importLogininfoFromDisk(): Found ${logininfo.length} accounts in accounts.txt, not checking for logininfo.json...`);

                    this.controller._dataUpdateEvent("logininfo", this.logininfo, logininfo);
                    this.logininfo = logininfo;
                    return resolve(logininfo);
                }
            }

            // Check logininfo for Syntax errors and display custom error message
            try {
                // Only check if file exists (it is not shipped by default anymore since 2.12.1). If it doesn't an empty obj will be returned, leading to empty logininfo err msg in checkData()
                if (fs.existsSync("./logininfo.json")) {
                    delete require.cache[require.resolve(srcdir + "/../logininfo.json")]; // Delete cache to enable reloading data

                    // Print deprecation warning once directly at boot and another time on ready
                    logger("warn", "The usage of 'logininfo.json' is deprecated, please consider moving your accounts to 'accounts.txt' instead!", true);
                    logger("warn", "The usage of 'logininfo.json' is deprecated, please consider moving your accounts to 'accounts.txt' instead!");

                    const logininfoFile = require(srcdir + "/../logininfo.json");

                    // Check for special syntax that includes all cached accounts in tokens.db
                    const values = Object.values(logininfoFile);

                    if (values.find((e) => e[0] == "*" && e[1] == "cookie")) {
                        const dbRes = await this.tokensDB.findAsync({}); // Get all

                        dbRes.forEach((e, i) => {
                            // Push this account to data if it wasn't already configured manually
                            if (!values.find((f) => f[0] == e.accountName)) {
                                logger("debug", `DataManager importLogininfoFromDisk(): Special syntax "*:cookie" found, pushing accountName '${e.accountName}' to data...`);

                                // Use "usecachedcookie" for sharedsecret to let dataExport know that *:cookie was used. Keep password null to prevent sessionHandler from attempting to use it
                                logininfoFile["bot" + (Object.keys(logininfoFile).length + i)] = [ e.accountName, null, "usecachedcookie" ];
                            }
                        });
                    }

                    // Reformat to use new logininfo object structure
                    const valuesToProcess = Object.values(logininfoFile).filter((e) => e[0] != "*" && e[1] != "cookie");

                    valuesToProcess.forEach((k, i) => {
                        if (k[0] == "*" && k[1] == "cookie") return; // Ignore special syntax

                        logininfo.push({
                            index: i,
                            accountName: k[0],
                            password: k[1],
                            sharedSecret: k[2],
                            steamGuardCode: null
                        });
                    });
                }

                logger("debug", `Found ${logininfo.length} accounts in logininfo.json...`);

                this.controller._dataUpdateEvent("logininfo", this.logininfo, logininfo);
                this.logininfo = logininfo;
                resolve(logininfo);
            } catch (err) {
                logger("error", "It seems like you made a mistake in your logininfo.json. Please check if your Syntax looks exactly like in the example/template and try again.\n        " + err, true);
                return this.controller.stop();
            }

            // Create empty accounts.txt file if neither exist
            if (!fs.existsSync("./accounts.txt") && !fs.existsSync("./logininfo.json")) this._pullNewFile("accounts.txt", "./accounts.txt", () => {}, true); // Ignore resolve() param
        })();
    });
};


/**
 * Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors
 * @returns {Promise.<object[]>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importProxiesFromDisk = function() {
    return new Promise((resolve) => {
        let proxies = []; // When the file is just created there can't be proxies in it (this bot doesn't support magic)

        if (!fs.existsSync("./proxies.txt")) {
            logger("info", "Creating empty proxies.txt file because it doesn't exist...", false, true, logger.animation("loading"));

            this.proxies = [];
            this.writeProxiesToDisk();

        } else {

            // File does seem to exist so now we can try and read it
            proxies = fs.readFileSync("./proxies.txt", "utf8").split("\n");
            proxies = proxies.filter((str) => str != ""); // Remove empty lines

            if (proxies.length > 0 && proxies[0].startsWith("//Comment")) proxies = proxies.slice(1); // Remove comment from array


            // Split proxy format set in advancedconfig to prepare for conversion below
            const formatSplitRegex = /(\$\{[^}]+\})|([^$\s]+)/g; // Splits String at in-string-variables "${var}" with arbitrary delimiter
            let   formatSplit      = null;
            let   proxySplitRegex;

            if (this.advancedconfig.proxyFormat != "") {
                formatSplit = this.advancedconfig.proxyFormat.replace("http://", "").split(formatSplitRegex).filter((e) => e); // Split into components and filter empty/undefined elements

                // Collect all delimiters found in the user provided proxyFormat
                const proxySplitDelimiters = formatSplit.filter((e) => !e.startsWith("${"));

                // Escape each delimiter if necessary and construct regex to split proxy below once with 1. delimiter, then once with 2. delimiter on the remaining string, and so on...
                proxySplitRegex = new RegExp(proxySplitDelimiters.map((e) => `(${e.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")})(.*)`).join(""), "g");
            } else {
                logger("debug", "DataManager importProxiesFromDisk(): No proxyFormat provided in advancedconfig, skipping proxy format conversion...");
            }


            // Add no proxy (local ip) if useLocalIP is true
            if (this.advancedconfig.useLocalIP) {
                proxies.unshift({ proxyIndex: 0, proxy: null, isOnline: true, lastOnlineCheck: 0 });
            }


            // Restructure array into array of objects
            proxies.forEach((e, i) => {
                if (typeof e !== "string") return; // Ignore elements which are not a string anymore

                // Apply formatting from advancedconfig if a custom format was specified
                if (formatSplit) { // Needs conversion

                    const proxySplit = e.replace("http://", "").split(proxySplitRegex).filter((e) => e); // Split into components and filter empty/undefined elements

                    /* if (formatSplit.length != proxySplit.length) {
                        logger("error", `The proxy '${e}' at index ${i} does not seem to match the proxyFormat set in advancedconfig.json!`, true);
                        proxies[i] = { proxyIndex: i, proxy: null, isOnline: false, lastOnlineCheck: Date.now() }; // TODO: I hope this does not cause issues later?
                        return;
                    } */

                    const proxyUsername = proxySplit[formatSplit.indexOf("${username}")];
                    const proxyPassword = proxySplit[formatSplit.indexOf("${password}")];
                    const proxyIp       = proxySplit[formatSplit.indexOf("${ip}")];
                    const proxyPort     = proxySplit[formatSplit.indexOf("${port}")];

                    // Overwrite unformatted proxy string with expected object
                    proxies[i] = {
                        proxyIndex: i,
                        proxy: (proxyUsername && proxyPassword) ? `http://${proxyUsername}:${proxyPassword}@${proxyIp}:${proxyPort}` : `http://${proxyIp}:${proxyPort}`, // Reconstruct proxy string in the expected format
                        isOnline: true,
                        lastOnlineCheck: 0
                    };

                    logger("debug", `DataManager importProxiesFromDisk(): Converted proxy '${e}' using format '${this.advancedconfig.proxyFormat}' to '${proxies[i].proxy}'`);

                } else { // Can be used as is

                    if (typeof e == "string" && !e.includes("://")) e = "http://" + e; // Precede proxy with http if user did not to prevent SteamCommunity requests from failing

                    proxies[i] = { proxyIndex: i, proxy: e, isOnline: true, lastOnlineCheck: 0 };
                }
            });

            // Check if no proxies were found (can only be the case when useLocalIP is false)
            if (proxies.length == 0) {
                logger("", "", true);
                logger("error", "useLocalIP is turned off in advancedconfig.json but I couldn't find any proxies in proxies.txt!\n        Aborting as I don't have at least one IP to log in with!", true);
                return this.controller.stop();
            }
        }

        this.controller._dataUpdateEvent("proxies", this.proxies, proxies);
        this.proxies = proxies;
        resolve(proxies);
    });
};


/**
 * Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors
 * @returns {Promise.<string[]>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importQuotesFromDisk = function() {
    return new Promise((resolve) => {
        let quotes = [];

        // Pull new file and call loadQuotes again, wait for it to resolve, and then resolve this promise. This is slightly hacky but relatively clean
        if (!fs.existsSync(srcdir + "/../quotes.txt")) {
            return this._pullNewFile("quotes.txt", "./quotes.txt", async () => { resolve(await this._importQuotes()); }, true);
        }

        quotes = fs.readFileSync(srcdir + "/../quotes.txt", "utf8").split(/\r?\n/); // Get all quotes from the quotes.txt file into an array
        quotes = quotes.filter((str) => str != ""); // Remove empty quotes

        quotes.forEach((e, i) => {
            // Remove quotes that are too long for a SteamCommunity comment
            if (e.length > 999) {
                logger("warn", `The quote.txt line ${i + 1} is longer than the limit of 999 characters. This quote will be ignored for now.`, true, false, logger.animation("loading"));
                quotes.splice(i, 1); // Remove this item from the array
                return;
            }

            // Reverse added backslashes by readFileSync that break newline characters, but make sure an original "\\n" stays "\\n"
            quotes[i] = e.replace(/\\n/g, "\n").replace(/\\\n/g, "\\n");
        });

        if (quotes.length == 0) {
            // Check if quotes.txt is empty to avoid errors further down when trying to comment
            logger("error", `${logger.colors.fgred}You haven't put any comment quotes into the quotes.txt file! Aborting...`, true);
            return this.controller.stop();
        }

        this.controller._dataUpdateEvent("quotes", this.quotes, quotes);
        this.quotes = quotes;
        resolve(quotes);
    });
};


/**
 * Loads languages from disk, updates languages property in DataManager and handles potential errors
 * @returns {Promise.<object>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importLanguagesFromDisk = function() {
    return new Promise((resolve) => {
        try {
            const obj = {};

            if (!fs.existsSync("./src/data/lang")) fs.mkdirSync("./src/data/lang");

            // Delete cache so requiring languages again will load new changes
            Object.keys(require.cache).forEach((key) => {
                if (key.includes("src/data/lang")) delete require.cache[key];
            });

            // Iterate through all files in lang dir and load them
            fs.readdir("./src/data/lang", (err, files) => {
                logger("debug", `DataManager importLanguagesFromDisk(): Found these languages in the lang folder: '${files.join(", ")}'`);

                files.forEach((e) => {
                    let thisFile;

                    // Try to load plugin
                    try {
                        // Load the plugin file
                        thisFile = require(`../data/lang/${e}`);

                        // Add language to obj
                        obj[e.replace(".json", "")] = thisFile;
                    } catch (err) {
                        logger("error", `Failed to load language '${e}': ${err}! Ignoring it...`);
                    }
                });

                // Resolve with success message or force restore default language
                if (Object.keys(obj).length > 0 && obj["english"]) {
                    this.controller._dataUpdateEvent("lang", this.lang, obj);
                    this.lang = obj;
                    resolve(obj);
                } else {
                    this._pullNewFile("english.json", "./src/data/lang/english.json", (e) => {
                        this.controller._dataUpdateEvent("lang", this.lang, { "english": e });
                        this.lang = { "english": e };
                        resolve({ "english": e });  // Only resolve for the default language
                    });
                }
            });
        } catch (err) {
            if (err) {
                // Corrupted!
                logger("", "", true, true);

                // Pull the default lang file directly from GitHub, the other ones should be handled by the dataIntegrity check
                this._pullNewFile("english.json", "./src/data/lang/english.json", (e) => {
                    this.controller._dataUpdateEvent("lang", this.lang, { "english": e });
                    this.lang = { "english": e };
                    resolve({ "english": e });
                }); // Only resolve for the default language
            }
        }
    });
};


/**
 * Loads customlang.json from disk, updates languages property in DataManager and handles potential errors
 * @returns {Promise.<object>} Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importCustomLangFromDisk = function() {
    return new Promise((resolve) => {
        // Check before trying to import if the user even created the file
        if (fs.existsSync(srcdir + "/../customlang.json")) {
            let customlang;
            let customlangkeys;

            // Try importing customlang.json
            try {
                delete require.cache[require.resolve(srcdir + "/../customlang.json")]; // Delete cache to enable reloading data

                customlang = require(srcdir + "/../customlang.json");
            } catch (err) {
                logger("error", "It seems like you made a mistake (probably Syntax) in your customlang.json! I will not use any custom message.\nError: " + err);

                resolve(this.lang); // Resolve with default lang object
            }

            // Instantly resolve if nothing was found
            if (Object.keys(customlang).length == 0) resolve(this.lang);

            // Create deep copy to be able to call _dataUpdateEvent in a sec
            const originalLang = JSON.parse(JSON.stringify(this.lang));

            // Overwrite values in each lang object with values from customlang
            Object.keys(customlang).forEach((lang, langIteration) => {
                customlangkeys = 0; // Reset for this language

                // Check if valid language was provided
                if (this.lang[lang]) {

                    Object.keys(customlang[lang]).forEach((e) => { // Note: No need to check for last iteration here as the loop does nothing asynchronous
                        if (e != "" && e != "note") { // Ignore empty strings and note
                            if (this.lang[lang][e]) {
                                this.lang[lang][e] = customlang[lang][e]; // Overwrite each english key with a corresponding customlang key if one is set

                                customlangkeys++;
                            } else {
                                logger("warn", `Customlang key '${e}' does not exist in language '${lang}'! You must update your customlang.json file. Ignoring this key...`, false, false, null, true);
                            }
                        }
                    });

                    if (customlangkeys > 0) logger("info", `${customlangkeys} customlang keys for language '${lang}' imported!`, false, true, logger.animation("loading"));

                } else {
                    logger("warn", `Language '${lang}' in customlang.json is not supported by the bot! You must update your customlang.json file. Ignoring this language...`, false, false, null, true);
                }

                // Resolve lang object with our new keys on the very last iteration
                if (langIteration == Object.keys(customlang).length - 1) {
                    this.controller._dataUpdateEvent("lang", originalLang, this.lang);
                    resolve(this.lang);
                }
            });
        } else {
            logger("debug", "DataManager importCustomLangFromDisk(): No customlang.json file found");
            resolve(this.lang); // Resolve with default lang object
        }
    });
};


/**
 * Loads all config & data files from disk and handles potential errors
 * @returns {Promise.<void>} Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
 */
DataManager.prototype.importFromDisk = async function () {

    // Call all functions from above after another. This must be done async to avoid a check failing that depends on something from a previous function. We sadly cannot use Promise.all() because of this.
    logger("info", "Importing data files and settings...", false, true, logger.animation("loading"));

    await this.importCacheFromDisk();
    await this.importDataFromDisk();
    await this.importConfigFromDisk();
    await this.importAdvancedConfigFromDisk();

    this.controller._loggerOptionsUpdateAfterConfigLoad(this.advancedconfig); // Call optionsUpdateAfterConfigLoad() to set previously inaccessible options

    this.tokensDB = new nedb({ filename: srcdir + "/data/tokens.db", autoload: true }); // We need to access tokensDB in logininfo import

    await this.importLogininfoFromDisk();
    await this.importProxiesFromDisk();
    await this.importQuotesFromDisk();
    await this.importLanguagesFromDisk();
    await this.importCustomLangFromDisk();

    this.lastCommentDB   = new nedb({ filename: srcdir + "/data/lastcomment.db", autoload: true }); // Autoload
    this.ratingHistoryDB = new nedb({ filename: srcdir + "/data/ratingHistory.db", autoload: true });
    this.userSettingsDB  = new nedb({ filename: srcdir + "/data/userSettings.db", autoload: true });

    logger("info", `Successfully loaded ${this.logininfo.length} accounts, ${this.proxies.length} proxies, ${this.quotes.length} quotes, ${Object.keys(this.lang).length} languages and 4 databases!`, false, true, logger.animation("loading"));

};
