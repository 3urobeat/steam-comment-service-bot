/*
 * File: 21100.js
 * Project: steam-comment-service-bot
 * Created Date: 10.07.2021 22:30:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 18:07:45
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


var i = 0;

module.exports.run = (callback) => { //eslint-disable-line
    var fs = require("fs")

    if (i == 1) return; //when automatically updating from 2.10.x to 2.11 the bot will be executed two times. In order to prevent this I added this really shitty check.
    i++

    //data.json
    try {
        if (fs.existsSync(srcdir + "/data.json")) {
            var oldextdata = require("../../data.json")

            //Check if this file still contains the 3 values to transfer in order to ensure ./src/data/data.json doesn't loose this data
            if (Object.keys(oldextdata).includes("urlrequestsecretkey") && Object.keys(oldextdata).includes("timesloggedin") && Object.keys(oldextdata).includes("totallogintime")) {
                extdata.urlrequestsecretkey = oldextdata.urlrequestsecretkey
                extdata.timesloggedin = oldextdata.timesloggedin
                extdata.totallogintime = oldextdata.totallogintime
        
                fs.writeFile(srcdir + "/data/data.json", JSON.stringify(extdata, null, 4), err => { //write the changed file
                    if (err) {
                        logger("error", `error writing to data.json: ${err}`, true)            
                    }
                })
            }
        }
    } catch (err) {
        logger("error", "Failed to transfer urlrequestsecretkey, timesloggedin and totallogintime to new data.json: " + err)
    }


    //Move both data files to their new home
    if (fs.existsSync(srcdir + "/cache.json")) fs.renameSync(srcdir + "/cache.json", srcdir + "/data/cache.json")
    if (fs.existsSync(srcdir + "/lastcomment.db")) fs.renameSync(srcdir + "/lastcomment.db", srcdir + "/data/lastcomment.db")


    //Run updater again
    logger("info", "I will now update again. Please wait a moment...")

    var controller = require("../../controller/controller.js")

    require("../updater").run(true, null, true, (done) => {
        if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
    })
}

module.exports.info = {
    "master": "21100",
    "beta-testing": "2110b4"
}