/*
 * File: settings.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 14.10.2023 00:31:09
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.lang = {
    names: ["lang", "setlang"],
    description: "Changes the language the bot will reply to you in. Call without params to see all supported languages.",
    args: [
        {
            name: "language",
            description: "Name of the language",
            type: "string",
            isOptional: true,
            ownersOnly: false
        }
    ],
    ownersOnly: false,

    /**
     * The lang command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // List all supported languages by joining the keys of the data lang object with a line break and -
        if (!args[0]) {
            respond(`${await commandHandler.data.getLang("langcmdsupported", null, resInfo.userID)}\n- ${Object.keys(commandHandler.data.lang).join("\n - ")}`);
            return;
        }

        let suppliedLang = args[0].toLowerCase();

        // Check if the supplied language is supported
        if (!Object.keys(commandHandler.data.lang).includes(suppliedLang)) {
            respond(await commandHandler.data.getLang("langcmdnotsupported", { "supportedlangs": "\n- " + Object.keys(commandHandler.data.lang).join("\n - ") }, resInfo.userID));
            return;
        }

        // Check if command was called without a userid and reject database write
        if (!resInfo.userID) {
            respond(await commandHandler.data.getLang("nouserid")); // Reject usage of command without an userID to avoid cooldown bypass
            return logger("err", "The lang command was called without resInfo.userID! Blocking the command as I'm unable to attribute the lang change to a user, which is required for this database write!");
        }

        // Upsert database record
        commandHandler.data.userSettingsDB.update({ id: resInfo.userID }, { $set: { lang: suppliedLang } }, { upsert: true }, async (err) => {
            if (err) {
                respond("Error: Couldn't write to database! Please check the log for an error stacktrace.");
                logger("error", "Failed to write language change to userSettings database!\nError: " + err);
                return;
            }

            respond(await commandHandler.data.getLang("langcmdsuccess", null, suppliedLang));
        });
    }
};


module.exports.settings = {
    names: ["settings", "set", "config"],
    description: "Change a value in the config",
    args: [
        {
            name: "config key",
            description: "Name of the config key to update",
            type: "string",
            isOptional: false,
            ownersOnly: true
        },
        {
            name: "new value",
            description: "New value of the config key",
            type: "string",
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The settings command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        let config  = commandHandler.data.config;

        // Only send current settings if no arguments were provided
        if (!args[0]) {
            let stringifiedconfig = JSON.stringify(commandHandler.data.config, function(k, v) { // Credit: https://stackoverflow.com/a/46217335/12934162
                if (v instanceof Array) return JSON.stringify(v);
                return v;
            }, 4)
                .replace(/"\[/g, "[")
                .replace(/\]"/g, "]")
                .replace(/\\"/g, '"')
                .replace(/""/g, '""');

            // Remove first and last character which are brackets and remove leading and trailing whitespaces from all lines
            let currentsettingsarr = stringifiedconfig.toString().slice(1, -1).split("\n").map(s => s.trim());

            // Send message with code prefix and only allow cuts at newlines
            respondModule(context, { prefix: "/code", cutChars: ["\n"], ...resInfo }, (await commandHandler.data.getLang("settingscmdcurrentsettings", null, resInfo.userID)) + "\n" + currentsettingsarr.join("\n")); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

            return;
        }


        // Seems like at least one argument was provided so the user probably wants to change a setting
        if (!args[1]) return respond("Please provide a new value for the key you want to change!");

        // Block those 3 values to don't allow another owner to take over ownership
        if (args[0] == "enableevalcmd" || args[0] == "ownerid" || args[0] == "owner") {
            respond(await commandHandler.data.getLang("settingscmdblockedvalues", null, resInfo.userID));
            return;
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

        if (keyvalue == undefined) return respond(await commandHandler.data.getLang("settingscmdkeynotfound", null, resInfo.userID));
        if (keyvalue == args[1]) return respond(await commandHandler.data.getLang("settingscmdsamevalue", { "value": args[1] }, resInfo.userID));

        config[args[0]] = args[1]; // Apply changes

        // Run dataCheck to verify updated settings
        commandHandler.data.checkData()
            .then(async (res) => {
                if (res) {
                    respond(await commandHandler.data.getLang("settingscmdvaluereset", null, resInfo.userID) + "\n" + res);
                    logger("warn", `DataManager rejected change of '${args[0]}' to '${args[1]}' with this reason:\n` + res);
                    return;
                }

                respond(await commandHandler.data.getLang("settingscmdvaluechanged", { "targetkey": args[0], "oldvalue": keyvalue, "newvalue": args[1], "cmdprefix": resInfo.cmdprefix }, resInfo.userID));
                logger("info", `${args[0]} has been changed from ${keyvalue} to ${args[1]}.`);

                if (args[0] == "playinggames") {
                    logger("info", "Refreshing game status of all bot accounts...");

                    commandHandler.controller.getBots().forEach((e) => {
                        if (e.index == 0) e.user.gamesPlayed(config.playinggames); // Set game only for the main bot

                        if (e.index != 0 && config.childaccsplaygames) { // Set game for child accounts

                            // Check if user provided games specifically for this account. We only need to check this for child accounts
                            let configChildGames = config.childaccplayinggames;

                            if (typeof configChildGames[0] == "object") {
                                if (Object.keys(configChildGames[0]).includes(e.loginData.logOnOptions.accountName)) configChildGames = configChildGames[0][e.loginData.logOnOptions.accountName]; // Get the specific settings for this account if included
                                    else configChildGames = configChildGames.slice(1);                                                                                                             // ...otherwise remove object containing acc specific settings to use the generic ones

                                logger("debug", `settings: Setting includes specific games for ${e.logPrefix}, filtered for this account: ${configChildGames.join(", ")}`);
                            }

                            e.user.gamesPlayed(configChildGames);
                        }
                    });
                }

                // Update config.json
                commandHandler.data.writeConfigToDisk();
            })
            .catch(async (err) => {
                respond(await commandHandler.data.getLang("settingscmdvaluereset", null, resInfo.userID) + "\n" + err);
                logger("error", `DataManager rejected change of '${args[0]}' to '${args[1]}' with this reason:\n` + err);
                return;
            });
    }
};