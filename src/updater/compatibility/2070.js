/*
 * File: 2070.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-10 22:30:00
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:20:47
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.7.0
module.exports.run = (controller, resolve) => { //eslint-disable-line
    if (controller.data.config.botsgroupid != "") {
        const https  = require("https");
        const xml2js = require("xml2js");


        logger("info", "Applying 2.7 compatibility changes...");
        Object.keys(controller.data.config).push("botsgroup"); // Add new key

        try {
            let output = "";

            https.get(`https://steamcommunity.com/gid/${controller.data.config.botsgroupid}/memberslistxml/?xml=1`, function(res) { // Get group64id from code to simplify config
                res.on("data", function (chunk) {
                    output += chunk;
                });

                res.on("end", () => {
                    new xml2js.Parser().parseString(output, function(err, result) {
                        if (err) logger("error", "error parsing botsgroupid xml: " + err);
                        controller.data.config.botsgroup = `https://steamcommunity.com/groups/${result.memberList.groupDetails.groupURL}`; // Assign old value to new key

                        fs.writeFile("./config.json", JSON.stringify(output, null, 4), (err) => {
                            if (err) logger("error", "error writing botsgroupid to botsgroup: " + err, true);
                        });

                        logger("info", "I will now update again. Please wait a moment..."); // Force update so that config gets cleaned up
                        resolve(true); // Resolve and force update
                    });
                });
            });
        } catch (err) {
            if (err) logger("error", "error getting groupurl of botsgroupid or getting new config: " + err);
        }
    } else {
        logger("info", "I will now update again. Please wait a moment...");

        resolve(true); // Resolve and force update
    }
};

module.exports.info = {
    "master": "2.7",
    "beta-testing": "2.7"
};
