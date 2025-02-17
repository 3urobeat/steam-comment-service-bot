/*
 * File: generateDevDocsJsDocs.js
 * Project: steam-comment-service-bot
 * Created Date: 2025-01-17 20:58:34
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-17 21:52:23
 * Modified By: 3urobeat
 *
 * Copyright (c) 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/*
    This script generates all markdown files containing all JsDocs using jsdoc2md for the dev docs
    (too many docs in that "sentence", I'm sorry)
    Example used: https://github.com/jsdoc2md/jsdoc-to-markdown/wiki/How-to-create-one-output-file-per-class
*/


const jsdoc2md = require("jsdoc-to-markdown");
const fs       = require("fs");
const path     = require("path");

(async () => {
    /* Get template data */
    const templateData = await jsdoc2md.getTemplateData({ configure: "./jsdoc.config.json" });

    /* Reduce templateData to an array of class names */
    const classes = templateData.filter(i => i.kind === "class").map(i => {
        return { "className": i.name, "filePath": i.meta.path };
    });

    /* Create a documentation file for each class */
    for (const { className, filePath } of classes) {
        const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;

        const output = await jsdoc2md.render({ data: templateData, template: template, configure: "./jsdoc.config.json" });

        const folder    = filePath.split("/")[filePath.split("/").length - 1];
        const writePath = path.resolve(`./docs/dev/${folder}/jsDocs.md`);

        console.log(`Rendered class '${className}', writing to '${writePath}'`);

        fs.writeFileSync(writePath, output);
    }
})();
