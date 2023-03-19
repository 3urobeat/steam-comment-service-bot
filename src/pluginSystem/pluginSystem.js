/*
 * File: pluginSystem.js
 * Project: steam-comment-service-bot
 * Created Date: 19.03.2023 13:34:27
 * Author: 3urobeat
 *
 * Last Modified: 19.03.2023 15:03:01
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// This file provides an interface of functions called by the controller which plugins can hook into


const loadPlugins = require("./loadPlugins.js").loadPlugins;


/**
 * The plugin system loads all plugins and provides functions for plugins to hook into
 */
class PluginSystem {

    // Constructor
    constructor(botobject, communityobject) {
        this.botobject       = botobject;
        this.communityobject = communityobject;

        this._loadPlugins();
    }


    /* -------- Internal functions -------- */

    /**
     * Internal: Loads all plugins from /plugins dir
     */
    async _loadPlugins() {
        this.pluginList = await loadPlugins();
    }


    /* -------- External functions for hooking -------- */

    /**
     * Executed when the bot is done logging in all accounts
     */
    botIsReady() {}

}


// The plugin system loads all plugins and provides functions for plugins to hook into
module.exports = PluginSystem;