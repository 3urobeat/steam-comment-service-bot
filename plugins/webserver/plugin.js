/*
 * File: plugin.js
 * Project: steam-comment-service-bot
 * Created Date: 25.02.2022 14:12:17
 * Author: 3urobeat
 *
 * Last Modified: 19.03.2023 14:10:01
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamUser      = require("steam-user"); //eslint-disable-line
const SteamCommunity = require("steamcommunity"); //eslint-disable-line
const SteamID        = require("steamid"); //eslint-disable-line
const fs             = require("fs");
const express        = require("express");

const advancedconfig = require("../../advancedconfig.json");


/**
 * This function will be called by the plugin loader when the bot finished logging in. Initialize your plugin here.
 * @param {SteamUser} mainBot The main bot account (botobject[0]), the account you interact with, the account listening for events etc.
 * @param {Object.<number, SteamUser>} botobject Object of all bot accounts SteamUser instances (used for general steam interactions)
 * @param {Object.<number, SteamCommunity>} communityobject Object of all bot accounts SteamCommunity instances (used for community interactions like commenting etc.)
 */
module.exports.run = (mainBot, botobject, communityobject) => { //eslint-disable-line

    if (advancedconfig.enableurltocomment) {
        const controller = require("../../src/controller/controller.js");
        const ready      = require("../../src/controller/ready.js");
        const mainfile   = require("../../src/bot/main.js");

        const app        = express();


        // Generate urlrequestsecretkey if it is not created already
        if (extdata.urlrequestsecretkey == "") {
            extdata.urlrequestsecretkey = Math.random().toString(36).slice(-10); // Credit: https://stackoverflow.com/a/9719815/12934162
            logger("info", "Generated a secret key for comment requests via url. You can find the key in the 'data.json' file, located in the 'src' folder.", true);

            fs.writeFile(srcdir + "/data/data.json", JSON.stringify(extdata, null, 4), (err) => {
                if (err) logger("error", "error writing created urlrequestsecretkey to data.json: " + err);
            });
        }


        // Listen for visitors
        app.get("/", (req, res) => {
            res.status(200).send(`<title>Comment Bot Web Request</title><b>${extdata.mestr}'s Comment Bot | Comment Web Request</b></br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br></br>Visit /output to see the complete output.txt in your browser!</b></br></br>https://github.com/HerrEurobeat/steam-comment-service-bot`);
        });

        app.get("/comment", (req, res) => {
            // Get IP of visitor
            let ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress).replace("::ffff:", "");

            if (req.query.n == undefined) {
                logger("info", `Web Request by ${ip} denied. Reason: numberofcomments (n) is not specified.`);
                return res.status(400).send("You have to provide an amount of comments.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.");
            }

            if (req.query.id == undefined) {
                logger("info", `Web Request by ${ip} denied. Reason: Steam profileid (id) is not specified.`);
                return res.status(400).send("You have to provide a profile id where I should comment.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.");
            }

            if (req.query.key == undefined || req.query.key != extdata.urlrequestsecretkey) {
                logger("warn", `Web Request by ${ip} denied. Reason: Invalid secret key.`); // I think it is fair to output this message with a warn type
                return res.status(403).send("Your secret key is not defined or invalid. Request denied.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.");
            }

            if (isNaN(cachefile.ownerid[0]) || new SteamID(String(cachefile.ownerid[0])).isValid() == false) {
                logger("warn", `Web Request by ${ip} denied. Reason: Config's first ownerid is invalid.`);
                return res.status(403).send("You can't use the web request feature unless you provided a valid ownerid in your config!");
            }

            logger("info", `Web Comment Request from ${ip} accepted. Amount: ${req.query.n} | Profile: ${req.query.id}`);


            // Run the comment command
            if (!ready.readyafter || controller.relogQueue.length > 0) return res.status(403).send(mainfile.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

            var steamID = new SteamID(String(cachefile.ownerid[0])); // SteamID: Make the bot owner responsible for request
            var steam64id = steamID.getSteamID64();

            controller.lastcomment.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err);

                try { // Catch any unhandled error to be able to remove user from activecommentprocess array
                    require("../../src/bot/commands/commentprofile.js").run(null, steamID, [req.query.n, req.query.id], mainfile.lang, res, lastcommentdoc);
                } catch (err) {
                    res.status(500).send("Error while processing comment request: " + err.stack);
                    logger("error", "Error while processing comment request: " + err.stack);
                    return;
                }
            });
        });

        app.get("/output", (req, res) => { // Show output
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

        app.use((req, res) => { // Show idk page thanks
            res.status(404).send("404: Page not Found.</br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.");
        });

        module.exports.server = app.listen(3034, () => {
            logger("info", "EnableURLToComment is on: Server is listening on port 3034.\n       Visit it on: localhost:3034\n", true);
        });

        module.exports.server.on("error", (err) => {
            logger("error", "An error occurred trying to start the EnableURLToComment server. " + err, true);
        });
    }

};


/**
 * Include some information about your plugin here
 */
module.exports.info = {
    name: "webserver",
    version: "1.0",
    author: "3urobeat"
};



// JSDoc for a few things to make them easier to use for you
/**
 * Log something to the output
 * @param {String} type Type of your log message. Valid types: `info`, `warn`, `error` or `debug`
 * @param {String} message The message to log
 * @param {Boolean} nodate Set to true to hide date and time
 * @param {Boolean} remove Set to true if the next log message should overwrite this one
 * @param {Array} animation Call `logger.animation("animation-name")` in this parameter to get pre-defined animations. Valid animation-name's: loading, waiting, bounce, progress, arrows, bouncearrows
 * @returns {String} The full formatted message which will be logged
 */
var logger = global.logger;