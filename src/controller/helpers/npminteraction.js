/*
 * File: npminteraction.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-05-24 23:26:52
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// **IMPORTANT NOTE**: This file cannot be moved because it is being accessed by the old updater during an update!


const fs       = require("fs");
const { exec } = require("child_process"); // Wanted to do it with the npm package but that didn't work out (BETA 2.8 b2)


// Helper function to set terminal title again after npm might have changed it
function setTerminalTitle() {
    // Ignore call if Controller hasn't arrived at data import yet. This is the case when the parent process initially installs packages, which will trigger a restart.
    if (!global.extdata) return;

    if (process.platform == "win32") { // Set node process name to find it in task manager etc.
        process.title = `${extdata.mestr}'s Steam Comment Service Bot v${global.extdata.versionstr} | ${process.platform}`; // Windows allows long terminal/process names
    } else {
        process.stdout.write(`${String.fromCharCode(27)}]0;${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}${String.fromCharCode(7)}`); // Sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)
        process.title = "CommentBot"; // Sets process title in task manager etc.
    }
}


/**
 * Attempts to reinstall all modules
 * @param {function(string, string): void} logger The currently used logger function (real or fake, the caller decides)
 * @param {function((string|null), (string|null)): void} callback Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.reinstallAll = async (logger, callback) => {
    logger("info", "I'm installing packages, which the bot depends on to function, inside this folder. Please wait a moment, this can take a minute.");

    if (!fs.existsSync(srcdir + "/../node_modules")) {
        logger("info", "Creating node_modules folder...");

        fs.mkdirSync(srcdir + "/../node_modules");
    } else {
        logger("info", "Deleting node_modules folder content...");
    }

    // Check if package.json is missing
    await require(srcdir + "/starter.js").checkAndGetFile("./package.json", logger, false, false);

    // Delete node_modules folder content
    fs.rm(srcdir + "/../node_modules", { recursive: true }, (err) => {
        if (err) return callback(err, null);

        logger("info", "Running 'npm install --omit=dev'. This can take a moment, please wait...");

        exec("npm install --omit=dev", { cwd: srcdir + "/.." }, (err, stdout) => {
            if (err) return callback(err, null);

            logger("info", "Successfully ran 'npm install --omit=dev'");

            // Set terminal title again as npm may have changed it
            setTerminalTitle();

            callback(null, stdout);
        });
    });
};


/**
 * Updates all installed packages to versions listed in package.json from the project root directory.
 * @param {function((string|null), (string|null)): void} callback Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.update = (callback) => {
    module.exports.updateFromPath(srcdir + "/..", callback);
};


/**
 * Updates all installed packages to versions listed in package.json
 * @param {string} path Custom path to read package.json from and install packages to
 * @param {function((string|null), (string|null)): void} callback Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
module.exports.updateFromPath = (path, callback) => {
    logger("debug", `npminteraction update(): Running 'npm install --omit=dev' in '${path}'. This can take a moment, please wait...`);

    exec("npm install --omit=dev", { cwd: path }, (err, stdout) => {
        if (err) return callback(err, null);

        // Logger("info", `NPM Log:\n${stdout}`, false, false, null, true) // Entire log, disabled to reduce log spam

        // Set terminal title again as npm may have changed it
        setTerminalTitle();

        callback(null, stdout);
    });
};


/**
 * Installs the latest version available on NPM for an array of packages. Updating core dependencies might cause untested behavior, be careful.
 * @param {string[]} packages Array of package names to install the latest version of
 * @returns {Promise.<void>} Resolves when done or rejects on failure
 */
module.exports.installLatest = (packages) => {
    return new Promise((resolve, reject) => {

        logger("debug", `npminteraction installLatest(): Running 'npm install package@latest' for ${packages.length} package(s): ${packages.join(", ")}`);

        // Join array by adding @latest version tag and a space
        exec(`npm install ${packages.join("@latest ")}`, (err, stdout) => {
            if (err) {
                logger("debug", `npminteraction installLatest(): Failed to install the latest version(s) of ${packages.length} package(s)! NPM output:\n${stdout}`);
                reject(err);
            } else {
                logger("debug", "npminteraction installLatest(): Finished checking and installing updates...");
                resolve();
            }

            // Set terminal title again as npm may have changed it
            setTerminalTitle();

            // Logger("info", `NPM Log:\n${stdout}`, false, false, null, true); // Entire log, disabled to reduce log spam
        });

    });
};
