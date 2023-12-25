/*
 * File: start.js
 * Project: steam-comment-service-bot
 * Created Date: 15.01.2020 10:38:00
 * Author: 3urobeat
 *
 * Last Modified: 25.12.2023 20:38:51
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// If you are here, you are wrong. Open config.json and configure everything there!

// This file can't get refreshed automatically after an update.
// It is designed to be modular and to start and restart the whole application.
// To be able to change the file it is supposed to start on the fly it pulls the necessary file path from the data.json file


/**
 * Attempts to load the data.json file.
 * @returns {object|{ filetostart: string, filetostarturl: string }} Returns an data.json object on success or an object with default values for `filetostart` and `filetostarturl` on failure.
 */
function getExtdata() {
    try { // Just try to require, if it should fail then the actual restoring process will be handled later
        return require("./src/data/data.json");
    } catch (err) {
        return { filetostart: "./src/starter.js", filetostarturl: "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/beta-testing/src/starter.js" };
    }
}


/* ------------------ Restart function ------------------ */
module.exports.restart = (args) => {
    try {
        Object.keys(require.cache).forEach(function(key) {
            delete require.cache[key]; // Clear cache to include file changes
        });
    } catch (err) {
        console.log("start.js: Failed to delete cache of all imported files. If the files contain changes then they are not loaded.\nI will try to start anyway but please restart the bot manually if you see this message.\nError: " + err);
    }

    require(getExtdata().filetostart).restart(args);
};


/* ------------------ Entry point ------------------ */

// Force working directory to fix relative path issues when starting bot using absolute path. Fixes: https://github.com/3urobeat/steam-comment-service-bot/issues/217
process.chdir(__dirname);

// Get filetostart if it doesn't exist
let fs = require("fs");
let extdata = getExtdata();

if (!fs.existsSync(extdata.filetostart)) { // Function that downloads filetostart if it doesn't exist (file location change etc.)
    let output = "";

    try {
        let https = require("https");

        if (!fs.existsSync("./src")) fs.mkdirSync("./src"); // Create src dir if it doesn't exist

        https.get(extdata.filetostarturl, function (res) {
            res.setEncoding("utf8");

            res.on("data", function (chunk) {
                output += chunk;
            });

            res.on("end", () => {
                fs.writeFile(extdata.filetostart, output, (err) => {
                    if (err) return console.log(err);

                    require(extdata.filetostart).run(); // Start
                });
            });
        });
    } catch (err) {
        console.log("start.js get starter.js function Error: " + err);
    }
} else {
    require(extdata.filetostart).run(); // Start application
}

// Code by: https://github.com/3urobeat/
