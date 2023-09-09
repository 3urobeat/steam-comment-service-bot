/*
 * File: generateFileStructure.js
 * Project: steam-comment-service-bot
 * Created Date: 02.09.2023 14:41:54
 * Author: 3urobeat
 *
 * Last Modified: 09.09.2023 15:15:20
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    This script generates a JSON file containing a path and corresponding GitHub URL for every file in the project.
    This is used to check and recover missing files on startup.
    The output is copied to "src/data/fileStructure.json".
*/


const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ignore = [
    ".git", "node_modules", "backup", "plugins", // Folders
    "accounts.txt", "config.json", "proxies.txt", "quotes.txt", "advancedconfig.json", "config.json", "customlang.json", // Config files
    "output.txt", "src/data/cache.json", "src/data/data.json", "src/data/fileStructure.json", "src/data/lastcomment.db", "src/data/ratingHistory.db", "src/data/tokens.db", "src/data/userSettings.db", // Files changing at runtime
    "comment-service-bot.code-workspace" // Misc
];

const output = [];


/**
 * Iterates through all files in the project and pushes them to the output
 * @param {string} src Project root path
 * @param {boolean} firstCall Set to `true` on first call, will be set to `false` on recursive call
 */
function searchFolderRecursiveSync(src, firstCall) {
    let files = [];

    // Copy files or call function again if dir
    if (fs.lstatSync(src).isDirectory()) {
        files = fs.readdirSync(src);

        let targetFolder = path.join("./", src);

        files.forEach(async (file) => {
            let filepath = targetFolder + "/" + file;

            // Check if the file resides in the project root and prevent path from resulting in .//start.js
            if (targetFolder == "./") filepath = file;

            // Ignore this file/folder if name is in ignore array
            if (ignore.includes(filepath)) return;

            let curSource = path.join(src, file);

            // Recursively call this function again if this is a dir
            if (fs.lstatSync(curSource).isDirectory()) {
                searchFolderRecursiveSync(curSource, false);

            } else {

                // Construct URL and calculate checksum
                let fileurl  = "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/beta-testing/" + filepath;
                let filesum  = crypto.createHash("md5").update(fs.readFileSync(filepath)).digest("hex");

                // Add file to output array
                output.push({ "path": filepath, "url": fileurl, "checksum": filesum });
            }
        });
    }

    // Write output when we are finished and not in a deeper recursion level
    if (firstCall) {
        fs.writeFileSync("./src/data/fileStructure.json", JSON.stringify({ "files": output }, null, 4));

        console.log(`Done! Found ${output.length} files and wrote them to 'src/data/fileStructure.json'.`);
    }
}

searchFolderRecursiveSync("./", true);