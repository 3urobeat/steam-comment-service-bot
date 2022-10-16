/*
 * File: updater.js
 * Project: steam-comment-service-bot
 * Created Date: 21.07.2020 20:51:00
 * Author: 3urobeat
 *
 * Last Modified: 29.09.2021 17:43:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// This file only exists to ensure compatibility with older start.js when updating automatically
module.exports.restartdata = () => { }; // Empty restartdata function to suppress error on 2.10.x -> 2.11 automatic update

var fs = require("fs");

if (!fs.existsSync("./src/starter.js")) { // Get filetostart if it doesn't exist
    var output = "";

    try {
        var https = require("https");

        console.log("Pulling starter.js...");

        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/beta-testing/src/starter.js", function (res) {
            res.setEncoding("utf8");

            res.on("data", function (chunk) {
                output += chunk;
            });

            res.on("end", () => {
                fs.writeFile("./src/starter.js", output, (err) => {
                    if (err) return console.log(err);

                    require("./starter.js").run(); // Just start the bot
                });
            });
        });
    } catch (err) {
        console.log("start.js get starter.js function Error: " + err);
        process.exit(1);
    }
} else {
    require("./starter.js").run(); // Just start the bot
}