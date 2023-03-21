/*
 * File: pluginSystem.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:34:27
 * Author: 3urobeat
 *
 * Last Modified: 21.03.2023 00:55:44
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * Constructor - The plugin system loads all plugins and provides functions for plugins to hook into
 * @param {Object.<String, SteamUser>} botobject Object containing references to the SteamUser instance of every bot account which is used for interacting with Steam
 * @param {Object.<String, SteamCommunity>} communityobject Object containing references to the SteamCommunity instance of every bot account which is used for interacting with the SteamCommunity
 */
const PluginSystem = function(botobject, communityobject) {

    this.botobject       = botobject;
    this.communityobject = communityobject;

    // Load helper files
    require("./loadPlugins.js");

    // Load all plugins now
    this._loadPlugins();

};


// The plugin system loads all plugins and provides functions for plugins to hook into
module.exports = PluginSystem;