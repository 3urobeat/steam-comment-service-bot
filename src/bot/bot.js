/*
 * File: bot.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 04.07.2023 17:58:09
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser      = require("steam-user");
const SteamCommunity = require("steamcommunity");
const request        = require("request"); // Yes I know, the library is deprecated but steamcommunity uses it as well so it is being used anyway

const EStatus        = require("./EStatus.js");
const Controller     = require("../controller/controller.js"); // eslint-disable-line
const SessionHandler = require("../sessions/sessionHandler.js");


/**
 * Constructor - Initializes an object which represents a user steam account
 * @class
 * @param {Controller} controller Reference to the controller object
 * @param {number} index The index of this account in the logininfo object
 */
const Bot = function(controller, index) {

    /**
     * Reference to the controller object
     * @type {Controller}
     */
    this.controller = controller;

    /**
     * Reference to the controller object
     * @type {DataManager}
     */
    this.data = controller.data;

    /**
     * Login index of this bot account
     * @type {number}
     */
    this.index = index;

    /**
     * Status of this bot account
     * @type {EStatus}
     */
    this.status = EStatus.OFFLINE;

    /**
     * SteamID64's to ignore in the friendMessage event handler. This is used by readChatMessage() to prevent duplicate responses.
     * @type {array.<string>}
     */
    this.friendMessageBlock = [];

    let proxyIndex = this.index % controller.data.proxies.length; // Spread all accounts equally with a simple modulo calculation

    /**
     * Additional login related information for this bot account
     */
    this.loginData = {
        logOnOptions:  Object.values(controller.data.logininfo)[index], // TODO: This could be an issue later when the index could change at runtime
        logOnTries:    0,
        waitingFor2FA: false, // Set by sessionHandler's handle2FA helper to prevent handleLoginTimeout from triggering
        proxyIndex:    proxyIndex,
        proxy:         controller.data.proxies[proxyIndex]
    };

    // Define the log message prefix of this account in order to
    if (index == 0) this.logPrefix = "Main";
        else this.logPrefix = `Bot ${index}`;


    // Load helper files
    require("./events/debug.js");
    require("./events/disconnected.js");
    require("./events/error.js");
    require("./events/friendMessage.js");
    require("./events/loggedOn.js");
    require("./events/relationship.js");
    require("./events/webSession.js");
    require("./helpers/checkMsgBlock.js");
    require("./helpers/handleLoginTimeout.js");
    require("./helpers/handleMissingGameLicenses.js");
    require("./helpers/steamChatInteraction.js");

    // Create sessionHandler object for this account
    this.sessionHandler = new SessionHandler(this);

    // Create user & community instance
    logger("debug", `[${this.logPrefix}] Using proxy ${this.loginData.proxyIndex} "${this.loginData.proxy}" to log in to Steam and SteamCommunity...`);

    // Force protocol for now: https://dev.doctormckay.com/topic/4187-disconnect-due-to-encryption-error-causes-relog-to-break-error-already-logged-on/?do=findComment&comment=10917
    this.user      = new SteamUser({ autoRelogin: false, httpProxy: this.loginData.proxy, protocol: SteamUser.EConnectionProtocol.WebSocket });
    this.community = new SteamCommunity({ request: request.defaults({ "proxy": this.loginData.proxy }) }); // Pass proxy to community library as well

    // Load my library patches
    require("../libraryPatches/CSteamSharedFile.js");
    require("../libraryPatches/profile.js");
    require("../libraryPatches/sharedfiles.js");
    require("../libraryPatches/helpers.js");

    if (global.checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<") this.controller.stop(); // eslint-disable-line


    // Attach all SteamUser event listeners we need
    this._attachSteamDebugEvent();
    this._attachSteamDisconnectedEvent();
    this._attachSteamErrorEvent();
    this._attachSteamFriendMessageEvent();
    this._attachSteamLoggedOnEvent();
    this._attachSteamFriendRelationshipEvent();
    this._attachSteamGroupRelationshipEvent();
    this._attachSteamWebSessionEvent();


    // Get new websession as sometimes the this.user would relog after a lost connection but wouldn't get a websession. Read more about cookies & expiration: https://dev.doctormckay.com/topic/365-cookies/
    let lastWebSessionRefresh = Date.now(); // Track when the last refresh was to avoid spamming webLogOn() on sessionExpired

    this.community.on("sessionExpired", () => {
        if (Date.now() - lastWebSessionRefresh < 15000) return; // Last refresh was 15 seconds ago so ignore this call

        logger("info", `[${this.logPrefix}] Session seems to be expired. Trying to get new websession...`);
        lastWebSessionRefresh = Date.now(); // Update time
        this.user.webLogOn();
    });
};


/**
 * Status which a bot object can have
 * @enum {EStatus}
 */
Bot.EStatus = EStatus;


/**
 * Calls SteamUser logOn() for this account. This will either trigger the SteamUser loggedOn or error event.
 */
Bot.prototype._loginToSteam = async function() {

    // Count this attempt
    this.loginData.logOnTries++;

    // Log login message for this account, with mentioning proxies or without
    if (!this.loginData.proxy) logger("info", `[${this.logPrefix}] Trying to log in without proxy... (Attempt ${this.loginData.logOnTries}/${this.controller.data.advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));
        else logger("info", `[${this.logPrefix}] Trying to log in with proxy ${this.loginData.proxyIndex}... (Attempt ${this.loginData.logOnTries}/${this.controller.data.advancedconfig.maxLogOnRetries + 1})`, false, true, logger.animation("loading"));

    // Attach loginTimeout handler
    this.handleLoginTimeout();

    // Call our steam-session helper to get a valid refresh token for us
    let refreshToken = await this.sessionHandler.getToken();
    if (!refreshToken) return; // Stop execution if getRefreshToken aborted login attempt, it either skipped this account or stopped the bot itself

    // Login with this account using the refreshToken we just obtained using steam-session
    this.user.logOn({ "refreshToken": refreshToken });

};


// Make bot accessible from outside
module.exports = Bot;


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
 * @param {object} steamID64 The steamID64 of the message sender
 * @param {string} message The message string provided by steam-user friendMessage event
 * @returns {boolean} `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
 */
Bot.prototype.checkMsgBlock = function(steamID64, message) {}; // eslint-disable-line

/**
 * Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)
 */
Bot.prototype.handleLoginTimeout = function() {};

/**
 * Handles checking for missing game licenses, requests them and then starts playing
 */
Bot.prototype.handleMissingGameLicenses = function() {};

/**
 * Our commandHandler respondModule implementation - Sends a message to a Steam user
 * @param {object} _this The Bot object context
 * @param {object} resInfo Object containing information passed to command by friendMessage event
 * @param {string} txt The text to send
 * @param {boolean} retry Internal: true if this message called itself again to send failure message
 * @param {number} part Internal: Index of which part to send for messages larger than 750 chars
 */
Bot.prototype.sendChatMessage = function(_this, resInfo, txt, retry, part = 0) {}; // eslint-disable-line

/**
 * Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.
 * @param {string} steamID64 The steamID64 of the user to read a message from
 * @param {number} timeout Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended)
 * @returns {Promise.<string|null>} Resolved with `String` on response or `null` on timeout.
 */
Bot.prototype.readChatMessage = function(steamID64, timeout) {}; // eslint-disable-line