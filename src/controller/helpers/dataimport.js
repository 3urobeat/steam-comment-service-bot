/*
 * File: dataimport.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 10.10.2022 18:22:51
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const fs   = require("fs");
const path = require("path");


/**
 * Helper function to pull new file from GitHub
 */
async function pullNewFile(name, filepath, requirepath, resolve) {
    logger("warn", "Backup seems to be broken/not available! Pulling file from GitHub...", true)

    let file = await require("../../starter.js").checkAndGetFile(filepath, logger, true, true)
    if (!file) return;
    
    //Only tell user to reconfigure config.json 
    if (name == "config.json") logger("info", `Successfully pulled new ${name} from GitHub. Please configure it again!\n`, true)
        else logger("info", `Successfully pulled new ${name} from GitHub.\n`, true)

    resolve(require(requirepath));
}

/**
 * Helper function to try and restore backup of corrupted file from cache.json
 */
function restoreBackup(name, filepath, requirepath, cacheentry, onlinelink, resolve) {

    //Try to get arrays on one line
    try {
        var stringified = JSON.stringify(cacheentry,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; 
        }, 4)
            .replace(/"\[/g, '[')
            .replace(/\]"/g, ']')
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');
    } catch (err) {
        var stringified = JSON.stringify(cacheentry, null, 4)
    }

    //Create the underlying folder structure to avoid error when trying to write the downloaded file
    fs.mkdirSync(path.dirname(filepath), { recursive: true })

    fs.writeFile(filepath, stringified, (err) => { //write last backup to it from cache.json
        if (err) {
            logger("error", `Error writing data to ${name}.\nPlease do this manually: Visit ${onlinelink}, copy everything, put everything into the local file and save.\nOtherwise the bot will always crash.\nError: ${err}\n\nAborting...`, true); 
            return process.send("stop()") //abort since writeFile was unable to write and any further execution would crash

        } else {
            //Test backup:
            logger("info", `Testing ${name} backup...`, true, true)

            try { //Yes, this is a try catch inside a try catch please forgive me
                logger("info", `Successfully restored backup of ${name}!\n`, true)
                resolve(require(requirepath));

            } catch (err) { //Worst case, even the backup seems to be broken (seems like this can't happen anymore since 2.11 because cache.json will get cleared before we get here if it contains an error)
                pullNewFile(name, filepath, requirepath, resolve)
            }
        } 
    })
}


/**
 * Import, check and repair cache.json
 */
module.exports.cache = () => {
    return new Promise((resolve) => {
        try {
            resolve(require(srcdir + "/data/cache.json"));
        } catch (err) {
            if (err) {
                logger("", "", true, true)
                logger("warn", "cache.json seems to have lost it's data/is corrupted. Trying to write/create...", true, true)

                //Create the underlying folder structure to avoid error when trying to write the downloaded file
                fs.mkdirSync(path.dirname("./src/data/cache.json"), { recursive: true })

                fs.writeFile('./src/data/cache.json', "{}", (err) => { //write empty valid json
                    if (err) {
                        logger("error", "Error writing {} to cache.json.\nPlease do this manually: Go into 'src' folder, open 'cache.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                        return process.send("stop()") //abort since writeFile was unable to write and any further execution would crash
                    } else {
                        logger("info", "Successfully cleared/created cache.json.\n", true, true)
                        resolve(require(srcdir + "/data/cache.json"));
                    }
                })
            }
        }
    })
}


/**
 * Import, check and repair data.json
 * @param {Object} cache The cache.json file
 * @returns {Object} extdata object
 */
module.exports.extdata = (cache) => {
    return new Promise((resolve) => {
        try {
            resolve(require(srcdir + "/data/data.json"));
        } catch (err) {
            if (err) { //Corrupted!
                logger("", "", true, true)
                logger("warn", "data.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)
    
                //Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                if (cache.datajson) restoreBackup("data.json", "./src/data/data.json", srcdir + "/data/data.json", cache.datajson, "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/data/data.json", resolve)
                    else pullNewFile("data.json", "./src/data/data.json", srcdir + "/data/data.json", resolve)
            }
        }
    })
}


/**
 * Import, check and repair config.json
 * @param {Object} cache The cache.json file
 * @returns {Object} config object
 */
module.exports.config = (cache) => {
    return new Promise((resolve) => {
        try {
            resolve(require(srcdir + "/../config.json"));
        } catch (err) {
            if (err) { //Corrupted!
                logger("", "", true, true)
                logger("warn", "config.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)

                //Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                if (cache.configjson) restoreBackup("config.json", "./config.json", srcdir + "/../config.json", cache.configjson, "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json", resolve)
                    else pullNewFile("config.json", "./config.json", srcdir + "/../config.json", resolve)
            }
        }
    })
}


/**
 * Import, check and repair advancedconfig.json
 * @param {Object} cache The cache.json file
 * @returns {Object} advancedconfig object
 */
 module.exports.advancedconfig = (cache) => {
    return new Promise((resolve) => {
        try {
            resolve(require(srcdir + "/../advancedconfig.json"));
        } catch (err) {
            if (err) { //Corrupted!
                logger("", "", true, true)
                logger("warn", "advancedconfig.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)

                //Check if cache.json has a backup of config.json and try to restore it. If not then pull the file directly from GitHub.
                if (cache.advancedconfigjson) restoreBackup("advancedconfig.json", "./advancedconfig.json", srcdir + "/../advancedconfig.json", cache.advancedconfigjson, "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/advancedconfig.json", resolve)
                    else pullNewFile("advancedconfig.json", "./advancedconfig.json", srcdir + "/../advancedconfig.json", resolve)
            }
        }
    })
}


/**
 * Imports login information from accounts.txt & logininfo.json
 * @returns logininfo object
 */
module.exports.logininfo = () => {    
    var logininfo;

    //Check accounts.txt first so we can ignore potential syntax errors in logininfo
    if (fs.existsSync("./accounts.txt")) {
        var data = fs.readFileSync("./accounts.txt", "utf8").split("\n")

        if (data[0].startsWith("//Comment")) data = data.slice(1); //Remove comment from array

        if (data != "") {
            logger("info", "Accounts.txt does exist and is not empty - using it instead of logininfo.json.", false, true)

            logininfo = {} //Set empty object
            data.forEach((e, i) => {
                if (e.length < 2) return; //if the line is empty ignore it to avoid issues like this: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/80
                e = e.split(":")
                e[e.length - 1] = e[e.length - 1].replace("\r", "") //remove Windows next line character from last index (which has to be the end of the line)
                logininfo["bot" + i] = [e[0], e[1], e[2]]
            }) 

            return logininfo;
        }
    }

    //Check logininfo for Syntax errors and display custom error message
    try {
        logger("info", "accounts.txt seems empty/not created, loading logininfo from logininfo.json...", false, true, logger.animation("loading"))
        
        logininfo = require(srcdir + "/../logininfo.json")

        return logininfo;
    } catch (err) {
        logger("error", "It seems like you made a mistake in your logininfo.json. Please check if your Syntax looks exactly like in the example/template and try again.\n        " + err, true)
        return process.send("stop()")
    }
}


/**
 * Imports all proxies provided in proxies.txt file
 * @returns proxies array
 */
module.exports.proxies = () => {
    var proxies = [] //when the file is just created there can't be proxies in it (this bot doesn't support magic)

    if (!fs.existsSync('./proxies.txt')) {
        logger("info", "Creating proxies.txt file as it doesn't exist yet...", false, true, logger.animation("loading"))

        fs.writeFile(srcdir + "/../proxies.txt", "", err => { 
            if (err) logger("error", "error creating proxies.txt file: " + err)
                else logger("info", "Successfully created proxies.txt file.", false, true, logger.animation("loading"))
        })

    } else { //file does seem to exist so now we can try and read it
        var proxies = fs.readFileSync('./proxies.txt', 'utf8').split("\n");
        var proxies = proxies.filter(str => str != "") //remove empty lines

        if (advancedconfig.useLocalIP) proxies.unshift(null) //add no proxy (local ip) if useLocalIP is true

        //check if no proxies were found (can only be the case when useLocalIP is false)
        if (proxies.length == 0) {
            logger("", "", true)
            logger("error", "useLocalIP is turned off in advancedconfig.json but I couldn't find any proxies in proxies.txt!\n        Aborting as I don't have at least one IP to log in with!", true);
            process.send("stop()");
            return null;
        }
    }

    return proxies;
}


/**
 * Loads the lastcomment database
 * @returns database object
 */
module.exports.lastcomment = () => {
    var nedb = require("@seald-io/nedb")

    return new nedb({ filename: srcdir + "/data/lastcomment.db", autoload: true }); //autoload and return instantly
}


/**
 * Imports the quotes from the quotes.txt file
 * @returns The quotes array
 */
module.exports.quotes = () => {
    var quotes = []
    var quotes = fs.readFileSync(srcdir + '/../quotes.txt', 'utf8').split("\n") //get all quotes from the quotes.txt file into an array
    var quotes = quotes.filter(str => str != "") //remove empty quotes as empty comments will not work/make no sense

    quotes.forEach((e, i) => { //multi line strings that contain \n will get splitted to \\n -> remove second \ so that node-steamcommunity understands the quote when commenting
        if (e.length > 999) {
            logger("warn", `The quote.txt line ${i} is longer than the limit of 999 characters. This quote will be ignored for now.`, true, false, logger.animation("loading"))
            quotes.splice(i, 1) //remove this item from the array
            return;
        }

        quotes[i] = e.replace(/\\n/g, "\n").replace("\\n", "\n")
    })

    if (quotes.length == 0) { //check if quotes.txt is empty to avoid errors further down when trying to comment
        logger("error", `${logger.colors.fgred}You haven't put any comment quotes into the quotes.txt file! Aborting...`, true)
        return process.send("stop()")
    } else {
        logger("info", `Successfully loaded ${quotes.length} quotes from quotes.txt...`, false, true, logger.animation("loading"))
    }

    return quotes;
}


/**
 * Imports the default language and overwrites values if some are set in the customlang.json file
 * @param {function} [callback] Called with `lang` (Object) on completion.
 */
module.exports.lang = (callback) => {
    var lang = require(srcdir + "/data/lang/defaultlang.json")

    //Check before trying to import if the user even created the file
    if (fs.existsSync(srcdir + "/../customlang.json")) { 
        var customlangkeys = 0;

        //Try importing customlang.json
        try {
            var customlang = require(srcdir + "/../customlang.json")
        } catch (err) {
            logger("error", "It seems like you made a mistake (probably Syntax) in your customlang.json! I will not use any custom message.\nError: " + err)

            callback(lang)
        }
        
        //Overwrite values in lang object with values from customlang
        Object.keys(customlang).forEach((e, i) => {
            if (e != "" && e != "note") {
                lang[e] = customlang[e] //overwrite each defaultlang key with a corresponding customlang key if one is set

                customlangkeys++
            }

            if (i == Object.keys(customlang).length - 1) { //check for last iteration
                if (customlangkeys > 0) logger("info", `${customlangkeys} customlang key imported!`, false, true, logger.animation("loading"))
                    else logger("info", "No customlang keys found.", false, true, logger.animation("loading"))

                callback(lang)
            }
        })
    } else {
        logger("info", "No customlang.json file found...", false, true, logger.animation("loading"))

        callback(lang)
    }
}