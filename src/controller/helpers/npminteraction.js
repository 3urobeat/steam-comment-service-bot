/*
 * File: npminteraction.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs       = require("fs");
const { exec } = require("child_process"); // Wanted to do it with the npm package but that didn't work out (BETA 2.8 b2)


/**
 * Attempts to reinstall all modules
 * @param {function} logger The currently used logger function (real or fake, the caller decides)
 * @param {function} [callback] Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.reinstallAll = (logger, callback) => {
    if (!fs.existsSync(srcdir + "/../node_modules")) {
        logger("info", "Creating node_modules folder...");

        fs.mkdirSync(srcdir + "/../node_modules");
    } else {
        logger("info", "Deleting node_modules folder content...");
    }

    fs.rm(srcdir + "/../node_modules", { recursive: true }, (err) => {
        if (err) return callback(err, null);

        logger("info", "Running 'npm install'...");

        exec("npm install --production", { cwd: srcdir + "/.." }, (err, stdout) => {
            if (err) return callback(err, null);

            logger("info", "Successfully ran 'npm install'");

            callback(null, stdout);
        });
    });
};


/**
 * Updates all installed packages to versions listed in package.json from the project root directory.
 * @param {function} [callback] Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.update = (callback) => {
    module.exports.updateFromPath(srcdir + "/..", callback);
};


/**
 * Updates all installed packages to versions listed in package.json
 * @param {String} path Custom path to read package.json from and install packages to
 * @param {function} [callback] Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.updateFromPath = (path, callback) => {
    logger("debug", `npminteraction update(): Running 'npm install' in '${path}'...`);

    exec("npm install --production", { cwd: path }, (err, stdout) => {
        if (err) return callback(err, null);

        // Logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)

        callback(null, stdout);
    });
};