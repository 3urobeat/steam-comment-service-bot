/*
 * File: 2060.js
 * Project: steam-comment-service-bot
 * Created Date: 10.07.2021 22:30:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 18:08:29
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


module.exports.run = (callback) => { //eslint-disable-line
    try {
        var fs = require("fs")


        logger("info", "Applying 2.6 compatibility changes...", false, true)
        fs.mkdirSync('./src') 

        fs.writeFile('./src/data.json', '{ "version": 0 }', (err) => { //create data.json to avoid errors
            if (err) logger("error", "error creating data.json: " + err, true) 
        })
        fs.unlink("./bot.js", (err) => { //delete bot.js
            if (err) logger("error", "error deleting bot.js: " + err, true) 
        }) 
        fs.rename("./lastcomment.json", "./src/lastcomment.json", (err) => { //move lastcomment.json
            if (err) logger("error", "error moving lastcomment.json: " + err, true) 
        })

        var logininfo = require('../logininfo.json')

        if (Object.keys(logininfo)[0] == "bot1") { //check if first bot is 1 (old) and not 0
            Object.keys(logininfo).forEach((e, i) => {      
                Object.defineProperty(logininfo, `bot${i}`, //Credit: https://stackoverflow.com/a/14592469 
                    Object.getOwnPropertyDescriptor(logininfo, e));
                delete logininfo[e]; 
            })
            
            fs.writeFile("./logininfo.json", JSON.stringify(logininfo, null, 4), (err) => {
                if (err) logger("error", "error writing changes to logininfo.json: " + err, true) 
            }) 
        }

        if (config.globalcommentcooldown == 5000) { //check if the user uses default settings and raise 5 to 10 sec
            config.globalcommentcooldown = 10000
            fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                if (err) logger("error", 'error changing default globalcommentcooldown value: ' + err, true) 
            }) 
        }

        setTimeout(() => {
            logger("info", "I will now update again. Please wait a moment...")

            var controller = require("../../controller/controller.js")

            require("../updater").run(true, null, true, (done) => {
                if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
            }) //force to update again to get files from new structure
        }, 1000);
    } catch(err) {
        logger("", `\n\n\x1b[31m*------------------------------------------*\x1b[0m\nI have problems updating your bot to the new filesystem.\nPlease restart the bot. If you still encounter issues:\n\nPlease either download and setup the bot manually again (https://github.com/HerrEurobeat/steam-comment-service-bot/)\nor open an issue (https://github.com/HerrEurobeat/steam-comment-service-bot/issues) and include the errors\n(*only* if you have no GitHub account message ${extdata.mestr}#0975 on Discord).\n\x1b[31m*------------------------------------------*\x1b[0m\n\nError: \n${err}\n`, true) 
    }
}

module.exports.info = {
    "master": "2.6",
    "beta-testing": "2.6"
}