/*
 * File: 2070.js
 * Project: steam-comment-service-bot
 * Created Date: 10.07.2021 22:30:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 18:08:25
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


module.exports.run = (callback) => { //eslint-disable-line
    if (config.botsgroupid != "") {
        var fs = require("fs")
        var https = require("https")
        var xml2js = require("xml2js")


        logger("info", "Applying 2.7 compatibility changes...")
        Object.keys(config).push("botsgroup") //add new key

        try {
            var output = ""

            https.get(`https://steamcommunity.com/gid/${config.botsgroupid}/memberslistxml/?xml=1`, function(res) { //get group64id from code to simplify config
                res.on('data', function (chunk) {
                    output += chunk });

                res.on('end', () => {
                    new xml2js.Parser().parseString(output, function(err, result) {
                        if (err) logger("error", "error parsing botsgroupid xml: " + err)
                        config.botsgroup = `https://steamcommunity.com/groups/${result.memberList.groupDetails.groupURL}` //assign old value to new key 

                        fs.writeFile("./config.json", JSON.stringify(output, null, 4), (err) => {
                            if (err) logger("error", 'error writing botsgroupid to botsgroup: ' + err, true)
                        })

                        logger("info", "I will now update again. Please wait a moment...") //force update so that config gets cleaned up
                        require("../updater").run(true, null, true, (done) => {
                            if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
                        }) 
                    }) 
                }) 
            })
        } catch (err) {
            if (err) logger("error", "error getting groupurl of botsgroupid or getting new config: " + err) 
        }
    } else {
        logger("info", "I will now update again. Please wait a moment...")

        var controller = require("../../controller/controller.js")

        require("../updater").run(true, null, true, (done) => {
            if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
        })
    }
}

module.exports.info = {
    "master": "2.7",
    "beta-testing": "2.7"
}