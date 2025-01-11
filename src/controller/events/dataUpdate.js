/*
 * File: dataUpdate.js
 * Project: steam-comment-service-bot
 * Created Date: 2025-01-07 17:18:36
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-11 18:27:38
 * Modified By: 3urobeat
 *
 * Copyright (c) 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const util = require("util");

const Controller = require("../controller");


/**
 * Runs internal dataUpdate event code and emits dataUpdate event for plugins. The event is emitted whenever DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.
 * @param {string} key Which DataManager key got updated
 * @param {any} oldData Old content of the updated key
 * @param {any} newData New content of the updated key
 */
Controller.prototype._dataUpdateEvent = function(key, oldData, newData) {

    // Calculate changes. If !oldData (e.g. on dataExport) count it as a change
    const changes = Object.keys(newData).filter((e) => {
        // Use JSON.stringify to deep compare objects, as obj == obj will nearly always be false because thats how programming languages work
        const isDifferent = !oldData || JSON.stringify(oldData[e]) != JSON.stringify(newData[e]);

        // Log debug message
        if (isDifferent && oldData) {
            logger("debug", `Event dataUpdate: DataManager key '${key}' got updated. Difference - old '${util.inspect(oldData[e], false, 2, true)}' | new '${util.inspect(newData[e], false, 2, true)}'`);
        }

        return isDifferent;
    });

    if (changes.length == 0) return logger("debug", `Event dataUpdate: DataManager key '${key}' did not change`);

    // Log debug message
    if (!oldData) {
        logger("debug", `Event dataUpdate: DataManager key '${key}' got exported. All values are included in newData.`);
    }

    // Emit event
    this.events.emit("dataUpdate", key, oldData, newData);

};
