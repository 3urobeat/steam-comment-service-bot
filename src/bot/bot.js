/*
 * File: bot.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 26.03.2023 10:51:34
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser      = require("steam-user");
const SteamCommunity = require("steamcommunity");
const request        = require("request"); // Yes I know, the library is deprecated but steamcommunity uses it as well so it is being used anyway

const Controller     = require("../controller/controller.js"); // eslint-disable-line
const SessionHandler = require("../sessions/SessionHandler.js");
const login          = require("../controller/login.js");
const mainfile       = require("./main.js");


/**
 * Constructor - Initializes an object which represents a user steam account
 * @param {Controller} controller Reference to the controller object
 * @param {Number} index The index of this account in the logininfo object
 */
const Bot = function(controller, index) {
    this.controller = controller;
    this.index      = index;
    this.loginData  = {}; // Provide array for additional login related information

    // Define the log message prefix of this account in order to
    if (index == 0) this.logPrefix = "Main";
        else this.logPrefix = `Bot ${index}`;


    // Load helper files
    require("./helpers/attachSteamEvents.js");


    // Get proxy for this user account
    this.loginData.proxyIndex = this.index % controller.data.proxies.length; // Spread all accounts equally with a simple modulo calculation
    this.loginData.proxy      = controller.data.proxies[this.loginData.proxyIndex];


    // Create user & community instance
    logger("debug", `[${this.logPrefix}] Using proxy ${this.loginData.proxyIndex} "${this.loginData.proxy}" to log in to Steam and SteamCommunity...`);

    this.user      = new SteamUser({ autoRelogin: false, httpProxy: this.loginData.proxy, protocol: SteamUser.EConnectionProtocol.WebSocket }); // Forcing protocol for now: https://dev.doctormckay.com/topic/4187-disconnect-due-to-encryption-error-causes-relog-to-break-error-already-logged-on/?do=findComment&comment=10917
    this.community = new SteamCommunity({ request: request.defaults({ "proxy": this.loginData.proxy }) });                                      // Pass proxy to community library as well


    // Run main.js if this is the main bot account
    if (index == 0) mainfile.run();

    if (global.checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<") process.send("stop()"); // eslint-disable-line


    // Reset logOnTries and login!
    this.loginData.logOnTries = 0;

    this._loginToSteam();


    // Attach all SteamUser event listeners we need
    this._attachSteamEvents();
};


/**
 * Logs this account into Steam
 */
Bot.prototype._loginToSteam = function() {
    let loginInterval = setInterval(async () => { // Set an interval to check if previous acc is logged on

        if (login.accisloggedin || this.loginData.logOnTries > 0) { // Start attempt if previous account is logged on or if this call is a retry
            clearInterval(loginInterval); // Stop interval

            login.accisloggedin = false; // Set to false again so the next account waits for us to log in

            // Count this attempt
            this.loginData.logOnTries++;

            // Log login message for this account, with mentioning proxies or without
            if (!this.loginData.proxy) logger("info", `[${this.logPrefix}] Trying to log in without proxy... (Attempt ${this.loginData.logOnTries}/${this.controller.data.advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));
                else logger("info", `[${this.logPrefix}] Trying to log in with proxy ${this.loginData.proxyIndex}... (Attempt ${this.loginData.logOnTries}/${this.controller.data.advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));


            // Call our steam-session helper to get a valid refresh token for us
            this.sessionHandler = new SessionHandler(this);

            let refreshToken = await sessionHandler.getToken();
            if (!refreshToken) return; // Stop execution if getRefreshToken aborted login attempt, it either skipped this account or stopped the user itself

            // Login with this account using the refreshToken we just obtained using steam-session
            this.user.logOn({ "refreshToken": refreshToken });
        }

    }, 250);
};


// Make bot accessible from outside
module.exports = Bot;