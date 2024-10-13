/*
 * File: 21504.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-10-10 18:38:50
 * Author: 3urobeat
 *
 * Last Modified: 2024-10-10 18:41:54
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// Compatibility feature for upgrading to 2.15.4
module.exports.run = (controller, resolve) => {

    const { advancedconfig } = controller.data;

    // Advancedconfig commentsIpCooldownPenalty -> requestsIpCooldownPenalty
    if (advancedconfig.commentsIpCooldownPenalty) {
        advancedconfig.requestsIpCooldownPenalty = advancedconfig.commentsIpCooldownPenalty;
        delete advancedconfig.commentsIpCooldownPenalty;

        controller.data.writeAdvancedconfigToDisk();
    }


    controller.data.datafile.compatibilityfeaturedone = true; // Set compatibilityfeaturedone to true, the bot would otherwise force another update

    controller.data.writeDatafileToDisk();

    resolve(false);

};

module.exports.info = {
    "master": "21504",
    "beta-testing": "21504"
};
