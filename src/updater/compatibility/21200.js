/*
 * File: 21200.js
 * Project: steam-comment-service-bot
 * Created Date: 23.02.2022 10:39:41
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.12.0
module.exports.run = (controller, resolve) => {
    let cache = controller.data.cachefile;

    // Only do something if at least one of the two values exists
    if (cache.configjson && (cache.configjson.globalcommentcooldown || cache.configjson.allowcommentcmdusage != undefined)) { // Intentionally checking specifically for undefined

        if (cache.configjson.globalcommentcooldown) controller.data.config.botaccountcooldown = cache.configjson.globalcommentcooldown; // Write value previously assigned to globalcommentcooldown to botaccountcooldown
        if (cache.configjson.allowcommentcmdusage != undefined && !cache.configjson.allowcommentcmdusage) controller.data.config.maxComments = 0; // Since maxComments now handles disabling the comment cmd we need to set it to 0 if user previously turned the comment cmd off

        delete controller.data.config.allowcommentcmdusage; // Remove allowcommentcmdusage and globalcommentcooldown that will be removed with this update
        delete controller.data.config.globalcommentcooldown;

        // Format and write new config
        let stringifiedconfig = JSON.stringify(controller.data.config, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
            if (v instanceof Array) return JSON.stringify(v);
            return v;
        }, 4)
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        fs.writeFile("./config.json", stringifiedconfig, (err) => {
            if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true);
        });
    }


    controller.data.datafile.compatibilityfeaturedone = true; // Set compatibilityfeaturedone to true here because we don't need to make another force update through checkforupdate() which would be necessary in order to set it to true from there

    fs.writeFile(srcdir + "/data/data.json", JSON.stringify(controller.data.datafile, null, 4), (err) => {
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true);
    });

    resolve(false);
};

module.exports.info = {
    "master": "21200",
    "beta-testing": "21200b02"
};