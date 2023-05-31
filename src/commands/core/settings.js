/*
 * File: settings.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 31.05.2023 15:16:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.settings = {
    names: ["set", "settings", "config"],
    description: "",
    ownersOnly: true,

    /**
     * The settings command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        let config  = commandHandler.data.config;

        // Only send current settings if no arguments were provided
        if (!args[0]) {
            fs.readFile("./config.json", function(err, data) { // Use readFile to get an unprocessed object
                if (err) return respond(commandHandler.data.lang.settingscmdfailedread + err);

                // Remove first and last character which are brackets and remove leading and trailing whitespaces from all lines
                let currentsettingsarr = data.toString().slice(1, -1).split("\n").map(s => s.trim());

                // Send message with code prefix and only allow cuts at newlines
                respondModule(context, { prefix: "/code", cutChars: ["\n"], ...resInfo }, commandHandler.data.lang.settingscmdcurrentsettings + "\n" + currentsettingsarr.join("\n")); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            });
            return;
        }


        // Seems like at least one argument was provided so the user probably wants to change a setting
        if (!args[1]) return respond("Please provide a new value for the key you want to change!");

        // Block those 3 values to don't allow another owner to take over ownership
        if (args[0] == "enableevalcmd" || args[0] == "ownerid" || args[0] == "owner") {
            return respond(commandHandler.data.lang.settingscmdblockedvalues);
        }

        let keyvalue = config[args[0]]; // Save old value to be able to reset changes

        // I'm not proud of this code but whatever -> used to convert array into usable array
        if (Array.isArray(keyvalue)) {
            let newarr = [];

            args.forEach((e, i) => {
                if (i == 0) return; // Skip args[0]
                if (i == 1) e = e.slice(1); // Remove first char which is a [
                if (i == args.length - 1) e = e.slice(0, -1); // Remove last char which is a ]

                e = e.replace(/,/g, ""); // Remove ,
                if (e.startsWith('"')) newarr[i - 1] = String(e.replace(/"/g, ""));
                    else newarr[i - 1] = Number(e);
            });

            args[1] = newarr;
        }

        // Convert to number or boolean as input is always a String
        if (typeof(keyvalue) == "number") args[1] = Number(args[1]);
        if (typeof(keyvalue) == "boolean") { // Prepare for stupid code because doing Boolean(value) will always return true
            if (args[1] == "true") args[1] = true;
            if (args[1] == "false") args[1] = false; // Could have been worse tbh
        }

        // Round maxComments value in order to avoid the possibility of weird amounts
        if (args[0] == "maxComments" || args[0] == "maxOwnerComments") args[1] = Math.round(args[1]);

        if (keyvalue == undefined) return respond(commandHandler.data.lang.settingscmdkeynotfound);
        if (keyvalue == args[1]) return respond(commandHandler.data.lang.settingscmdsamevalue.replace("value", args[1]));

        config[args[0]] = args[1]; // Apply changes

        // 32-bit integer limit check from controller.js's startup checks
        if (typeof(keyvalue) == "number" && config.commentdelay * config.maxComments > 2147483647 || typeof(keyvalue) == "number" && config.commentdelay * config.maxOwnerComments > 2147483647) { // Check this here after the key has been set and reset the changes if it should be true
            config[args[0]] = keyvalue;
            return respond(commandHandler.data.lang.settingscmdvaluetoobig); // Just using the check from controller.js
        }

        respond(commandHandler.data.lang.settingscmdvaluechanged.replace("targetkey", args[0]).replace("oldvalue", keyvalue).replace("newvalue", args[1]));
        logger("info", `${args[0]} has been changed from ${keyvalue} to ${args[1]}.`);

        if (args[0] == "playinggames") {
            logger("info", "Refreshing game status of all bot accounts...");
            commandHandler.controller.getBots().forEach((e) => {
                if (e.index == 0) e.user.gamesPlayed(config.playinggames); // Set game only for the main bot
                if (e.index != 0 && config.childaccsplaygames) e.user.gamesPlayed(config.playinggames.slice(1, config.playinggames.length)); // Play game with child bots but remove the custom game
            });
        }

        // Get arrays on one line
        let stringifiedconfig = JSON.stringify(config, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
            if (v instanceof Array) return JSON.stringify(v);
            return v;
        }, 4)
            .replace(/"\[/g, "[")
            .replace(/\]"/g, "]")
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        fs.writeFile("./config.json", stringifiedconfig, (err) => {
            if (err) return logger("error", `Error writing settings cmd changes to config: ${err}`);
        });
    }
};