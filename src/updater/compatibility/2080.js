/*
 * File: 2080.js
 * Project: steam-comment-service-bot
 * Created Date: 10.07.2021 22:30:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 18:08:13
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


module.exports.run = (callback) => { //eslint-disable-line
    var fs = require("fs")

    var controller = require("../../controller/controller.js")

    if (fs.existsSync('./updater.js')) {
        logger("info", "Applying 2.8 compatibility changes...")

        fs.unlink("./updater.js", (err) => { //delete old updater.js
            if (err) logger("error", "error deleting old updater.js: " + err, true) 
            
            logger("info", "I will now update again. Please wait a moment...")
            require("../updater").run(true, null, true, (done) => {
                if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
            })
        }) 
    } else {
        logger("info", "I will now update again. Please wait a moment...")
        require("../updater").run(true, null, true, (done) => {
            if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
        })
    }
}

module.exports.info = {
    "master": "2.8",
    "beta-testing": "BETA 2.8 b3"
}