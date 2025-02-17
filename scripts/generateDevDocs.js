/*
 * File: generateDevDocs.js
 * Project: steam-comment-service-bot
 * Created Date: 2025-01-17 21:45:27
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-18 11:30:49
 * Modified By: 3urobeat
 *
 * Copyright (c) 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    This script generates the markdown file for all dev doc directories from all subfiles
    This code feels poorly written, I was tired when I made this
*/


const fs = require("fs");


// Get all folders in dev docs
const path = "./docs/dev/";
const dirs = fs.readdirSync(path);

dirs.forEach((dirName) => {
    const thisPath = path + dirName;

    // Ignore non-dirs
    if (!fs.lstatSync(thisPath).isDirectory()) return;

    // Get all files in this dir which are not the generated one
    const files = fs.readdirSync(thisPath).filter((e) => e != "index.md");

    // Make sure introduction is in the first and jsDocs in the last position to produce a more relevant order of topics
    files.unshift(files.splice(files.indexOf("introduction.md"), 1)[0]);
    files.push(files.splice(files.indexOf("jsDocs.md"), 1)[0]);

    if (!files.includes("jsDocs.md")) console.log(`Warning: File jsDocs.md missing in module '${dirName}'! Did you forget to generate jsdocs?`);

    // Create fresh generated index.md
    const thisOut = thisPath + "/index.md";
    fs.writeFileSync(thisOut, "");


    // Read introduction.md, which every module always contains
    const introduction = fs.readFileSync(thisPath + "/introduction.md");

    // Remove title & link from introduction, which is always the first & second line and write it to output
    const introSplit = String(introduction).split("\n");
    fs.appendFileSync(thisOut, introSplit.splice(0, 3).join("\n"));


    // Generate table of contents
    let toc = "";

    files.forEach((fileName) => {
        const fileNameRaw = fileName.replace(".md", "");
        toc += `- [${fileNameRaw[0].toUpperCase() + fileNameRaw.slice(1)}](#${fileNameRaw})\n`;
    });

    fs.appendFileSync(thisOut, "\n&nbsp;\n\n## Table Of Contents\n\n" + toc.trim() + "\n");


    // Append rest of introduction
    fs.appendFileSync(thisOut, "\n&nbsp;\n\n<a id=\"introduction\"></a>\n\n# Introduction\n" + introSplit.join("\n"));


    // Append everything else
    files.forEach((fileName) => {
        // Ignore generated and already processed files
        if (["index.md", "introduction.md"].includes(fileName)) return;

        const thisFilePath = thisPath + "/" + fileName;

        // Get content
        const fileContent = fs.readFileSync(thisFilePath);

        // Append tag and content
        const fileNameRaw = fileName.replace(".md", "");
        fs.appendFileSync(thisOut, `\n&nbsp;\n\n<a id="${fileNameRaw}"></a>\n\n# ${fileNameRaw[0].toUpperCase() + fileNameRaw.slice(1)}\n${fileContent}`);
    });

    console.log(`Successfully generated module '${dirName}'`);

});
