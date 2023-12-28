/*
 * File: 21400.js
 * Project: steam-comment-service-bot
 * Created Date: 2023-09-28 17:27:08
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-27 14:19:56
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");


// Compatibility feature for upgrading to 2.14.0
module.exports.run = (controller, resolve) => {

    // Convert customlang to new format
    if (fs.existsSync(srcdir + "/../customlang.json")) {
        try {
            let customlang = require(srcdir + "/../customlang.json");

            // Nest existing params into the default language if not done already
            if (!customlang["english"]) {
                customlang = { "english": customlang };

                fs.writeFileSync(srcdir + "/../customlang.json", JSON.stringify(customlang, null, 4));
            }
        } catch (err) {
            logger("warn", "Compatibility feature 2.14: Failed to convert 'customlang.json'. Error: " + err);
        }
    }


    let { config, advancedconfig } = controller.data;


    // Config commentdelay, commentcooldown, maxComments & maxOwnerComments -> requestDelay, requestCooldown, maxRequests & maxOwnerRequests
    if (config.commentdelay)     config.requestDelay     = config.commentdelay;
    if (config.commentcooldown)  config.requestCooldown  = config.commentcooldown;
    if (config.maxComments)      config.maxRequests      = config.maxComments;
    if (config.maxOwnerComments) config.maxOwnerRequests = config.maxOwnerComments;

    delete config.commentdelay;
    delete config.commentcooldown;
    delete config.maxComments;
    delete config.maxOwnerComments;

    controller.data.writeConfigToDisk();


    // Advancedconfig relogTimeout -> loginRetryTimeout
    if (advancedconfig.relogTimeout != 900000) advancedconfig.loginRetryTimeout = advancedconfig.relogTimeout; // Only update loginRetryTimeout on update by checking if the old setting got transferred

    advancedconfig.relogTimeout = 900000;

    controller.data.writeAdvancedconfigToDisk();


    controller.data.datafile.compatibilityfeaturedone = true; // Set compatibilityfeaturedone to true, the bot would otherwise force another update

    controller.data.writeDatafileToDisk();

    resolve(false);

};

module.exports.info = {
    "master": "21400",
    "beta-testing": "21400b03"
};
