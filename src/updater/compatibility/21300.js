/*
 * File: 21300.js
 * Project: steam-comment-service-bot
 * Created Date: 02.06.2023 12:20:00
 * Author: 3urobeat
 *
 * Last Modified: 02.06.2023 15:54:19
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.13.0
module.exports.run = (controller, resolve) => {

    // Delete old core plugin files if they exist
    if (fs.existsSync("./plugins/template.js")) fs.unlinkSync("./plugins/template.js");
    if (fs.existsSync("./plugins/webserver.js")) fs.unlinkSync("./plugins/webserver.js");


    // Enable new webserver plugin if old one was enabled
    if (controller.data.advancedconfig.enableurltocomment) {
        try {
            let plugin = require(srcdir + "/../plugins/webserver/package.json");
            plugin.pluginConfig.enabled = true;

            fs.writeFileSync(srcdir + "/../plugins/webserver/package.json", JSON.stringify(plugin, null, 4));
        } catch (err) {
            logger("warn", "Compatibility feature 2.13: Failed to enable new webserver plugin. Error: " + err);
        }
    }


    // Add all commands that were previously affected by maintenance mode to restrictAdditionalCommandsToOwners if user had it enabled
    if (controller.data.advancedconfig.disableCommentCmd) {
        controller.data.advancedconfig.restrictAdditionalCommandsToOwners.push("comment", "resetcooldown", "upvote", "downvote");
    }


    // Remove removed disableCommentCmd & enableurltocomment settings and write changes to file
    delete controller.data.advancedconfig.enableurltocomment;
    delete controller.data.advancedconfig.disableCommentCmd;

    let stringifiedAdvancedconfig = JSON.stringify(controller.data.advancedconfig, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
        if (v instanceof Array) return JSON.stringify(v);
        return v;
    }, 4)
        .replace(/"\[/g, "[")
        .replace(/\]"/g, "]")
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    fs.writeFile("./advancedconfig.json", stringifiedAdvancedconfig, (err) => {
        if (err) logger("error", "Error in compatibilityfeature writing 'restrictAdditionalCommandsToOwners' change to advancedconfig.json! Error: " + err, true);
    });


    controller.data.datafile.compatibilityfeaturedone = true; // Set compatibilityfeaturedone to true here because we don't need to make another force update through checkforupdate() which would be necessary in order to set it to true from there

    fs.writeFile(srcdir + "/data/data.json", JSON.stringify(controller.data.datafile, null, 4), (err) => {
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true);
    });

    resolve(false);

};

module.exports.info = {
    "master": "21300",
    "beta-testing": "21300b07"
};