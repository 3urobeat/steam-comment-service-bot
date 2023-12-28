/*
 * File: 2104.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-10 22:30:00
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:20:27
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.10.4
module.exports.run = (controller, resolve) => {

    controller.data.config.maxComments = Object.keys(controller.data.logininfo).length * controller.data.config.repeatedComments; // Calculate new value which is just amount_of_accounts * repeatedComments
    controller.data.config.maxOwnerComments = controller.data.config.maxComments; // Set max comments allowed for owners to the same value - user can configure it differently later if he/she/it wishes to
    delete controller.data.config.repeatedComments; // Remove value from config as it got removed with 2.10.4

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

    controller.data.datafile.compatibilityfeaturedone = true; // Set compatibilityfeaturedone to true here because we don't need to make another force update through checkforupdate() which would be necessary in order to set it to true from there

    fs.writeFile("./src/data.json", JSON.stringify(controller.data.datafile, null, 4), (err) => {
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true);
    });

    resolve(false);

};

module.exports.info = {
    "master": "2104",
    "beta-testing": "2104"
};
