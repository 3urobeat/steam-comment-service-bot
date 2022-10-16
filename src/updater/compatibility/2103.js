/*
 * File: 2103.js
 * Project: steam-comment-service-bot
 * Created Date: 10.07.2021 22:30:00
 * Author: 3urobeat
 *
 * Last Modified: 29.09.2021 18:08:01
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


module.exports.run = (callback) => {
    var fs = require("fs");


    config.globalcommentcooldown = config.globalcommentcooldown / 60000;

    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
        if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true);
    });

    extdata.compatibilityfeaturedone = true;

    fs.writeFile("./src/data.json", JSON.stringify(extdata, null, 4), (err) => {
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true);
    });

    callback(true);
};

module.exports.info = {
    "master": "2103",
    "beta-testing": "2103"
};