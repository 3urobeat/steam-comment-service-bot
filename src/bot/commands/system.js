/*
 * File: system.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 16.10.2022 11:52:40
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



/**
 * Runs the restart command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 */
module.exports.restart = (chatmsg, steamID, lang) => {
    var controller = require("../../controller/controller.js");

    chatmsg(steamID, lang.restartcmdrestarting);

    process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`); // Send request to parent process
};


/**
 * Runs the stop command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 */
module.exports.stop = (chatmsg, steamID, lang) => {

    chatmsg(steamID, lang.stopcmdstopping);

    process.send("stop()"); // Send request to parent process
};


/**
 * Runs the update command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 */
module.exports.update = (chatmsg, steamID, lang, args) => {
    var controller = require("../../controller/controller.js");


    if (args[0] == "true") {
        require("../../updater/updater.js").run(true, steamID, false, (foundanddone) => { // We can ignore callback as the updater already responds to the user if a steamID is provided
            if (foundanddone) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`); // Send request to parent process
        });

        chatmsg(steamID, lang.updatecmdforce.replace("branchname", extdata.branch));
    } else {
        require("../../updater/updater.js").run(false, steamID, false, (foundanddone) => { // We can ignore callback as the updater already responds to the user if a steamID is provided
            if (foundanddone) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`); // Send request to parent process
        });

        chatmsg(steamID, lang.updatecmdcheck.replace("branchname", extdata.branch));
    }
};


/**
 * Runs the output command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 */
module.exports.output = (chatmsg, steamID) => {
    var fs = require("fs");


    fs.readFile("./output.txt", function (err, data) {
        if (err) logger("error", "error getting last 15 lines from output for log cmd: " + err);

        chatmsg(steamID, "/pre These are the last 15 lines:\n\n" + data.toString().split("\n").slice(data.toString().split("\n").length - 15).join("\n"));
    });
};


/**
 * Runs the update command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 * @param {SteamUser} bot The bot instance
 * @param {SteamCommunity} community The community instance
 */
module.exports.eval = (chatmsg, steamID, lang, args, bot, community) => { // eslint-disable-line no-unused-vars

    const clean = text => { // eslint-disable-line no-case-declarations
        if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else return text;
    };

    try {
        const code = args.join(" ");
        if (code.includes("logininfo")) return chatmsg(steamID, lang.evalcmdlogininfoblock); // Not 100% safe but should be at least some protection (only owners can use this cmd)

        // Make using the command a little bit easier
        var starter    = require("../../starter.js");               // eslint-disable-line no-unused-vars
        var controller = require("../../controller/controller.js"); // eslint-disable-line no-unused-vars
        var readyfile  = require("../../controller/ready.js");      // eslint-disable-line no-unused-vars
        var botfile    = require("../../bot/bot.js");               // eslint-disable-line no-unused-vars
        var mainfile   = require("../../bot/main.js");              // eslint-disable-line no-unused-vars

        let evaled = eval(code);
        if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

        // Check for character limit and cut message (seems to be 5000)
        let chatResult = clean(evaled);

        if (chatResult.length >= 4950) chatmsg(steamID, `Code executed. Result:\n\n${chatResult.slice(0, 4950)}.......\n\n\nResult too long for chat.`);
            else chatmsg(steamID, `Code executed. Result:\n\n${clean(evaled)}`);

        logger("info", `${logger.colors.fgyellow}Eval result:${logger.colors.reset} \n${clean(evaled)}\n`, true);
    } catch (err) {
        chatmsg(steamID, `Error:\n${clean(err)}`);
        logger("error", `${logger.colors.fgyellow}Eval error:${logger.colors.reset} \n${clean(err)}\n`, true);                                                                                                                                                                                                                                                                                                                // Hi I'm a comment that serves no purpose
        return;
    }
};