/*
 * File: 2080.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-10 22:30:00
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:20:43
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.8.0
module.exports.run = (controller, resolve) => { //eslint-disable-line

    if (fs.existsSync("./updater.js")) {
        logger("info", "Applying 2.8 compatibility changes...");

        fs.unlink("./updater.js", (err) => { // Delete old updater.js
            if (err) logger("error", "error deleting old updater.js: " + err, true);

            logger("info", "I will now update again. Please wait a moment...");
            resolve(true); // Resolve and force update
        });
    } else {
        logger("info", "I will now update again. Please wait a moment...");
        resolve(true); // Resolve and force update
    }
};

module.exports.info = {
    "master": "2.8",
    "beta-testing": "BETA 2.8 b3"
};
