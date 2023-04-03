/*
 * File: commandHandler.js
 * Project: steam-comment-service-bot
 * Created Date: 01.04.2023 21:54:21
 * Author: 3urobeat
 *
 * Last Modified: 03.04.2023 13:28:24
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const https = require("https");

const Controller = require("../controller/controller.js"); // eslint-disable-line


/**
 * Constructor - Initializes the commandHandler which allows you to integrate bot commands into your plugin
 * @param {Object} context The context (this.) of the object implementing this commandHandler. Will be passed to respondModule() as first parameter.
 * @param {function(Object, Object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
 * @param {Controller} controller Reference to the current controller object
 */
const CommandHandler = function(context, respondModule, controller) {

    this.context    = context;
    this.respond    = respondModule;
    this.controller = controller;

};


/**
 * The ping command
 * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command)
 */
CommandHandler.prototype.ping = function(resInfo) {
    let respond = ((txt) => this.respond(this.context, resInfo, txt)); // Shorten each call

    let pingStart = Date.now();

    https.get("https://steamcommunity.com/ping", (res) => { // Ping steamcommunity.com/ping and measure time
        res.setEncoding("utf8");
        res.on("data", () => {});
        res.on("end", () => respond(this.controller.data.lang.pingcmdmessage.replace("pingtime", Date.now() - pingStart)));
    });
};


module.exports = CommandHandler;