/*
 * File: 2103.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-10 22:30:00
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:20:36
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.10.3
module.exports.run = (controller, resolve) => {
    controller.data.config.globalcommentcooldown = controller.data.config.globalcommentcooldown / 60000;

    fs.writeFile("./config.json", JSON.stringify(controller.data.config, null, 4), (err) => {
        if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true);
    });

    controller.data.datafile.compatibilityfeaturedone = true;

    fs.writeFile("./src/data.json", JSON.stringify(controller.data.datafile, null, 4), (err) => {
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true);
    });

    resolve(false);
};

module.exports.info = {
    "master": "2103",
    "beta-testing": "2103"
};
