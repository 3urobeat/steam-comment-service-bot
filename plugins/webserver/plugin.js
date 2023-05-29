/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 14:12:17
 * Author: 3urobeat
 *
 * Last Modified: 29.05.2023 16:23:37
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const PluginSystem = require("../../src/pluginSystem/pluginSystem.js"); // eslint-disable-line

const fs      = require("fs");
const express = require("express");
const logger  = require("output-logger");


/**
 * Constructor - Creates a new object for this plugin
 * @class
 * @param {PluginSystem} sys Your connector to the application
 */
const Plugin = function(sys) {
    this.info = Plugin.info;

    // Store references to commonly used properties
    this.sys            = sys;
    this.controller     = sys.controller;
    this.data           = sys.controller.data;
    this.commandHandler = sys.commandHandler;

    this.app;
    this.server;
};

// Export everything in this file to make it accessible to the plugin loader
module.exports = Plugin;


/**
 * This function will be called by the plugin loader after updating but before logging in. Initialize your plugin here.
 */
Plugin.prototype.load = function() {
    this.app = express();

    // Generate urlrequestsecretkey if it is not created already
    if (this.data.datafile.urlrequestsecretkey == "") {
        this.data.datafile.urlrequestsecretkey = Math.random().toString(36).slice(-10); // Credit: https://stackoverflow.com/a/9719815/12934162
        logger("info", "Generated a secret key for comment requests via url. You can find the key in the 'data.json' file, located in the 'src' folder.", true);

        fs.writeFile(srcdir + "/data/data.json", JSON.stringify(this.data.datafile, null, 4), (err) => { // TODO: Replace with writeToFs function when supported by DataManger
            if (err) logger("error", "error writing created urlrequestsecretkey to data.json: " + err);
        });
    }

};


/**
 * This function will be called when the plugin gets reloaded (not on bot stop). It allows you to destroy any objects so the next load won't throw any errors.
 */
Plugin.prototype.unload = function() {
    logger("info", "Webserver plugin: Closing running webserver...");

    this.server.close();
};


/**
 * This function will be called when the bot is ready (aka all accounts were logged in).
 */
Plugin.prototype.ready = function() {

    /**
     * Our commandHandler respondModule implementation - Sends a response to the webpage visitor.
     * This is limited to one response, so we won't be able to send the finished message for example but this is not really needed I guess.
     * @param {Object} _this The Plugin object context
     * @param {Object} resInfo Object containing information passed to the command. Supported by this handler: res
     * @param {String} txt The text to send
     */
    function respondModule(_this, resInfo, txt) {
        if (resInfo.res.headersSent) return; // If we already sent a response with this header then ignore request to avoid an error

        resInfo.res.status(200).send(txt);
    }


    // Listen for visitors
    this.app.get("/", (req, res) => {
        res.status(200).send(`<title>Comment Bot Web Request</title><b>${this.data.datafile.mestr}'s Comment Bot | Comment Web Request</b></br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br></br>Visit /output to see the complete output.txt in your browser!</b></br></br>https://github.com/HerrEurobeat/steam-comment-service-bot`);
    });

    this.app.get("/comment", (req, res) => {
        let ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress).replace("::ffff:", ""); // Get IP of visitor

        // Get provided parameters
        let amount       = req.query.n;
        let receivingID  = req.query.id;
        let requestingID = this.data.cachefile.ownerid[0]; // SteamID: Make the bot owner responsible for request


        // Check provided parameters
        if (!amount) {
            logger("info", `Web Request by ${ip} denied. Reason: numberofcomments (n) is not specified.`);
            return res.status(400).send("You have to provide an amount of comments.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.");
        }

        if (!receivingID) {
            logger("info", `Web Request by ${ip} denied. Reason: Steam profileid (id) is not specified.`);
            return res.status(400).send("You have to provide a profile id where I should comment.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.");
        }

        if (!req.query.key || req.query.key != this.data.datafile.urlrequestsecretkey) {
            logger("warn", `Web Request by ${ip} denied. Reason: Invalid secret key.`); // I think it is fair to output this message with a warn type
            return res.status(403).send("Your secret key is not defined or invalid. Request denied.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.");
        }

        logger("info", `Web Comment Request from ${ip} accepted. Amount: ${amount} | Profile: ${receivingID}`);


        // Run the comment command
        this.commandHandler.runCommand("comment", [ amount, receivingID ], requestingID, respondModule, this, { res: res });
    });

    this.app.get("/output", (req, res) => { // Show output
        // Get IP of visitor
        let ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress).replace("::ffff:", "");

        logger("info", `[Web Request] ${ip} requested to see the output!`);

        fs.readFile(srcdir + "/../output.txt", (err, data) => {
            if(err) logger("error", "urltocomment: error reading output.txt: " + err);

            res.write(String(data));
            res.status(200);
            res.end();
        });
    });

    this.app.use((req, res) => { // Show idk page thanks
        res.status(404).send("404: Page not Found.</br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.");
    });


    // Start webserver and handle error
    this.server = this.app.listen(3034, () => {
        logger("info", "Webserver is enabled: Server is listening on port 3034.\n       Visit it in your browser: http://localhost:3034\n", true);
    });

    this.server.on("error", (err) => {
        logger("error", "Webserver plugin: An error occurred trying to start the webserver! " + err, true);
    });

};