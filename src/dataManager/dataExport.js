/*
 * File: dataExport.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-07-04 21:29:42
 * Author: 3urobeat
 *
 * Last Modified: 2024-08-10 19:13:29
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const DataManager = require("./dataManager.js");


/**
 * Writes (all) files imported by DataManager back to the disk
 */
DataManager.prototype.writeAllFilesToDisk = function() {
    this.writeCachefileToDisk();
    this.writeDatafileToDisk();
    this.writeConfigToDisk();
    this.writeAdvancedconfigToDisk();
    this.writeLogininfoToDisk();
    this.writeProxiesToDisk();
    this.writeQuotesToDisk();
};


/**
 * Writes cachefile to cache.json on disk
 */
DataManager.prototype.writeCachefileToDisk = function() {
    logger("debug", "DataManager dataExport: Writing to cache.json...");

    fs.writeFile("./src/data/cache.json", JSON.stringify(this.cachefile, null, 4), (err) => {
        if (err) logger("error", "DataManager: Error writing cachefile to cache.json: " + err);
    });
};


/**
 * Writes datafile to data.json on disk
 */
DataManager.prototype.writeDatafileToDisk = function() {
    logger("debug", "DataManager dataExport: Writing to data.json...");

    fs.writeFile("./src/data/data.json", JSON.stringify(this.datafile, null, 4), (err) => {
        if (err) logger("error", "DataManager: Error writing datafile to data.json: " + err);
    });
};


/**
 * Writes config to config.json on disk
 */
DataManager.prototype.writeConfigToDisk = function() {
    logger("debug", "DataManager dataExport: Writing to config.json...");

    // Get arrays on one line
    const stringifiedconfig = JSON.stringify(this.config, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
        if (v instanceof Array) return JSON.stringify(v);
        return v;
    }, 4)
        .replace(/"\[/g, "[")
        .replace(/\]"/g, "]")
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    fs.writeFile(srcdir + "/../config.json", stringifiedconfig, (err) => {
        if (err) logger("error", "DataManager: Error writing config to config.json: " + err);
    });
};


/**
 * Writes advancedconfig to advancedconfig.json on disk
 */
DataManager.prototype.writeAdvancedconfigToDisk = function() {
    logger("debug", "DataManager dataExport: Writing to advancedconfig.json...");

    // Get arrays on one line
    const stringifiedadvancedconfig = JSON.stringify(this.advancedconfig, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
        if (v instanceof Array) return JSON.stringify(v);
        return v;
    }, 4)
        .replace(/"\[/g, "[")
        .replace(/\]"/g, "]")
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    fs.writeFile(srcdir + "/../advancedconfig.json", stringifiedadvancedconfig, (err) => {
        if (err) logger("error", "DataManager: Error writing advancedconfig to advancedconfig.json: " + err);
    });
};


/**
 * Writes logininfo to logininfo.json and accounts.txt on disk, depending on which of the files exist
 */
DataManager.prototype.writeLogininfoToDisk = function() {

    if (fs.existsSync(srcdir + "/../logininfo.json")) {
        logger("debug", "DataManager dataExport: Writing to logininfo.json...");

        const logininfojson = {};

        // Re-Construct logininfo object. Iterate over bots instead of logininfo to retain a changed bots hierarchy
        for (const e of this.controller.getBots("*")) {
            logininfojson[`bot${e.index}`] = [ e.accountName, e.loginData.logOnOptions.password, e.loginData.logOnOptions.sharedSecret ];
        }

        // Get arrays on one line
        const stringifiedlogininfo = JSON.stringify(logininfojson, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
            if (v instanceof Array) return JSON.stringify(v);
            return v;
        }, 4)
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        fs.writeFile(srcdir + "/../logininfo.json", stringifiedlogininfo, (err) => {
            if (err) logger("error", "DataManager: Error writing logininfo to logininfo.json: " + err);
        });
    }

    if (fs.existsSync(srcdir + "/../accounts.txt")) {
        logger("debug", "DataManager dataExport: Writing to accounts.txt...");

        const accountstxt = [ "//Comment: This file is used to provide your bot accounts in the form of username:password. Read the instructions here: https://github.com/3urobeat/steam-comment-service-bot#accounts" ]; // Re-add comment

        // Re-construct accounts.txt string. Iterate over bots instead of logininfo to retain a changed bots hierarchy
        for (const e of this.controller.getBots("*")) {
            if (e.loginData.logOnOptions.sharedSecret) accountstxt.push(`${e.accountName}:${e.loginData.logOnOptions.password}:${e.loginData.logOnOptions.sharedSecret}`);
                else accountstxt.push(`${e.accountName}:${e.loginData.logOnOptions.password}`);
        }

        fs.writeFile(srcdir + "/../accounts.txt", accountstxt.join("\n"), (err) => {
            if (err) logger("error", "DataManager: Error writing accounts to accounts.txt: " + err);
        });
    }

};


/**
 * Writes proxies to proxies.txt on disk
 */
DataManager.prototype.writeProxiesToDisk = function() {
    logger("debug", "DataManager dataExport: Writing to proxies.txt...");

    const comment = "//Comment: This file is used to provide proxies to spread your accounts over multiple IPs. Read the instructions here: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/adding_proxies.md";

    fs.writeFile(srcdir + "/../proxies.txt", comment + this.proxies.join("\n"), (err) => {
        if (err) logger("error", "DataManager: Error writing proxies to proxies.txt: " + err);
    });
};


/**
 * Writes quotes to quotes.txt on disk
 */
DataManager.prototype.writeQuotesToDisk = function() {
    logger("debug", "DataManager dataExport: Writing to quotes.txt...");
    const quotesArr = [];

    // Replace every \n with \\n so that writeFile won't parse them to actual newlines
    this.quotes.forEach(e => quotesArr.push(e.replace(/\n/g, "\\n")));

    fs.writeFile(srcdir + "/../quotes.txt", quotesArr.join("\n"), (err) => {
        if (err) logger("error", "DataManager: Error writing quotes to quotes.txt: " + err);
    });
};


// No function to write language
