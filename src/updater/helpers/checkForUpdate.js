/*
 * File: checkForUpdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 08.07.2023 00:36:54
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const https = require("https");


/**
 * Checks for an available update from the GitHub repo
 * @param {object} datafile The current `data.json` file from the DataManager
 * @param {string} branch Which branch you want to check. Defaults to the current branch set in `data.json`
 * @param {boolean} forceUpdate If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
 * @param {function(boolean, object): void} callback Called with `updateFound` (Boolean) and `data` (Object) on completion. `updatefound` will be false if the check should fail. `data` includes the full data.json file found online.
 */
module.exports.check = (datafile, branch, forceUpdate, callback) => {
    if (!branch) branch = datafile.branch; // Set current branch as default value

    if (forceUpdate) logger("info", `Forcing update from ${branch} branch...`, false, true, logger.animation("loading"));
        else logger("info", `Checking for update in ${branch} branch...`, false, true, logger.animation("loading"));

    let output = "";

    try {
        let req = https.get(`https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/${branch}/src/data/data.json`, function(res) {
            res.setEncoding("utf8");

            res.on("data", (chunk) => {
                output += chunk;
            });

            res.on("end", () => {
                output = JSON.parse(output);
                let onlineversion    = output.version;
                let onlineversionstr = output.versionstr;

                if(output.mestr!==datafile.mestr||output.aboutstr!==datafile.aboutstr){datafile.mestr=output.mestr;datafile.aboutstr=output.aboutstr;global.checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<";require("fs").writeFile(srcdir + "/data/data.json",JSON.stringify(datafile,null,4),()=>{process.send("restart({})");});}else{global.checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"} // eslint-disable-line

                // Return true if an update should be forced, if a greater version was found, if online versioning entered beta or if online versioning left beta
                let updateFound = forceUpdate || onlineversion > datafile.version || !onlineversionstr.includes("BETA") && datafile.versionstr.includes("BETA") || onlineversionstr.includes("BETA") && !datafile.versionstr.includes("BETA");

                callback(updateFound, output); // Make our callback!
            });
        });

        req.on("error", function(err) {
            logger("warn", `${logger.colors.reset}[${logger.colors.fgred}Notice${logger.colors.reset}]: Couldn't check for an available update because either GitHub is down or your internet isn't working.\n          Error: ${err}`, true);
            callback(false, {});
        });

    } catch (err) {

        logger("error", "Updater checkForUpdate function Error: " + err, true);
        callback(false, {});
    }
};