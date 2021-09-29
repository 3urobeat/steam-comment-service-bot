/*
 * File: dataimport.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 18:02:15
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



//TODO: run integritychecks from here


/**
 * Import, check and repair data.json
 * @param {function} [callback] Called with `extdata` (Object) on completion.
 */
module.exports.extdata = (callback) => {
    logger("info", "Importing data.json...", false, true, logger.animation("loading"))

    require("../../starter.js").checkAndGetFile("./src/data/data.json", false, (file) => {
        callback(file)
    })
}


/**
 * Import, check and repair config.json
 * @returns config object
 */
module.exports.config = () => {
    logger("info", "Importing config.json...", false, true, logger.animation("loading"))

    return require(srcdir + "/../config.json")
}


/**
 * Imports login information from accounts.txt & logininfo.json
 * @returns logininfo object
 */
module.exports.logininfo = () => {
    var fs = require("fs")

    logger("info", "Loading logininfo from logininfo.json or accounts.txt...", false, true, logger.animation("loading"))

    //Check logininfo for Syntax errors and display custom error message
    try {
        var logininfo = require(srcdir + "/../logininfo.json")
    } catch (err) {
        logger("error", "Error: It seems like you made a mistake in your logininfo.json. Please check if your Syntax looks exactly like in the example/template and try again.\nError: " + err, true)
        process.exit(1)
    }

    //Either use logininfo.json or accounts.txt:
    if (fs.existsSync("./accounts.txt")) {
        var data = fs.readFileSync("./accounts.txt", "utf8").split("\n")

        if (data[0].startsWith("//Comment")) data = data.slice(1); //Remove comment from array

        if (data != "") {
            logger("info", "Accounts.txt does exist and is not empty - using it instead of logininfo.json.", false, true)

            logininfo = {} //Empty other object
            data.forEach((e, i) => {
                if (e.length < 2) return; //if the line is empty ignore it to avoid issues like this: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/80
                e = e.split(":")
                e[e.length - 1] = e[e.length - 1].replace("\r", "") //remove Windows next line character from last index (which has to be the end of the line)
                logininfo["bot" + i] = [e[0], e[1], e[2]]
            }) 
        }
    }

    return logininfo;
}


/**
 * Imports all proxies provided in proxies.txt file
 * @returns proxies array
 */
module.exports.proxies = () => {
    var fs = require("fs")

    logger("info", "Loading proxies in proxies.txt or creating file if it doesn't exist...", false, true, logger.animation("loading"))

    var proxies = [] //when the file is just created there can't be proxies in it (this bot doesn't support magic)

    if (!fs.existsSync('./proxies.txt')) {
        logger("info", "Creating proxies.txt file...", false, true, logger.animation("loading"))

        fs.writeFile(srcdir + "/../proxies.txt", "", err => { 
            if (err) logger("error", "error creating proxies.txt file: " + err)
                else logger("info", "Successfully created proxies.txt file.", false, true, logger.animation("loading"))
        })

    } else { //file does seem to exist so now we can try and read it
        var proxies = fs.readFileSync('./proxies.txt', 'utf8').split("\n");
        var proxies = proxies.filter(str => str != "") //remove empty lines

        proxies.unshift(null) //add no proxy (default)
    }

    return proxies;
}


/**
 * Loads the lastcomment database
 * @returns database object
 */
module.exports.lastcomment = () => {
    var nedb = require("@seald-io/nedb")

    logger("info", "Loading lastcomment.db database...", false, true, logger.animation("loading"))

    return new nedb({ filename: srcdir + "/data/lastcomment.db", autoload: true }); //autoload and return instantly
}


/**
 * Imports the quotes from the quotes.txt file
 * @returns The quotes array
 */
module.exports.quotes = () => {
    var fs = require("fs")

    logger("info", "Loading quotes from quotes.txt...", false, true, logger.animation("loading"))

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

    logger("info", `${quotes.length} quotes found.`, false, true, logger.animation("loading"))

    if (quotes.length == 0) { //check if quotes.txt is empty to avoid errors further down when trying to comment
        logger("error", "\x1b[31mYou haven't put any comment quote into the quotes.txt file! Aborting...\x1b[0m", true)
        process.exit(0);
    }

    return quotes;
}


/**
 * Imports the default language and overwrites values if some are set in the customlang.json file
 * @param {function} [callback] Called with `lang` (Object) on completion.
 */
module.exports.lang = (callback) => {
    var fs = require("fs")

    logger("info", "Loading defaultlang.json and customlang.json...", false, true, logger.animation("loading"))

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
                    else logger("info", "No customlang keys found...", false, true, logger.animation("loading"))

                callback(lang)
            }
        })
    } else {
        logger("info", "No customlang.json file found...", false, true, logger.animation("loading"))

        callback(lang)
    }
}