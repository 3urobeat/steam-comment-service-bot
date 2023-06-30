/*
 * File: EStatus.js
 * Project: steam-comment-service-bot
 * Created Date: 29.05.2023 16:55:46
 * Author: 3urobeat
 *
 * Last Modified: 29.06.2023 22:35:03
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * Status which a bot object can have
 * @enum EStatus
 */
module.exports = {
    "OFFLINE": 0,
    "ONLINE": 1,
    "ERROR": 2,
    "SKIPPED": 3,

    // Value-to-name mapping for convenience
    "0": "OFFLINE",
    "1": "ONLINE",
    "2": "ERROR",
    "3": "SKIPPED"
};