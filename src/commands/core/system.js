/*
 * File: system.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 07.07.2023 11:32:54
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.restart = {
    names: ["restart", "rs"],
    description: "Restarts the bot and checks for available updates",
    args: [],
    ownersOnly: true,

    /**
     * The restart command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.restartcmdrestarting); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        commandHandler.controller.restart(JSON.stringify({ skippedaccounts: commandHandler.controller.info.skippedaccounts }));
    }
};


module.exports.stop = {
    names: ["stop"],
    description: "Stops the bot",
    args: [],
    ownersOnly: true,

    /**
     * The stop command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.stopcmdstopping); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        commandHandler.controller.stop();
    }
};


module.exports.reload = {
    names: ["reload", "rl"],
    description: "Reloads all commands and plugins without needing to restart. Please only use it for testing/development",
    args: [],
    ownersOnly: true,

    /**
     * The reload command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {

        // Reload commandHandler
        commandHandler.reloadCommands();

        // Reload pluginSystem
        commandHandler.controller.pluginSystem.reloadPlugins();

        // Send response message
        respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.reloadcmdreloaded); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

    }
};


module.exports.update = {
    names: ["update"],
    description: "Checks for an available update and installs it if automatic updates are enabled and no requests are active. 'true' forces an update. Blocks new requests if it currently waits for one to be completed",
    args: [
        {
            name: '"true"',
            description: "Forces an update",
            type: "string",
            ownersOnly: true
        },
    ],
    ownersOnly: true,

    /**
     * The update command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((modResInfo, txt) => respondModule(context, modResInfo, txt)); // Shorten each call. Updater takes resInfo as param and can modify it, so we need to pass the modified resInfo object here

        // If the first argument is true then we shall force an update
        let force = (args[0] == "true");

        // Use the correct message depending on if force is true or false
        if (force) respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.updatecmdforce.replace("branchname", commandHandler.data.datafile.branch));
            else respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.updatecmdcheck.replace("branchname", commandHandler.data.datafile.branch));

        // Run the updater, pass force and our respond function which will allow the updater to text the user what's going on
        commandHandler.controller.updater.run(force, respond, resInfo);
    }
};


module.exports.output = {
    names: ["output", "log"],
    description: "Shows the last 15 lines of the log",
    args: [],
    ownersOnly: true,

    /**
     * The output command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error", "error getting last 15 lines from output for log cmd: " + err);

            // Manually limit part length to 500 chars as addStr can cause many messages
            respondModule(context, { prefix: "/pre", charLimit: 500, cutChars: ["\n"], ...resInfo }, "These are the last 15 lines:\n\n" + data.toString().split("\n").slice(data.toString().split("\n").length - 15).join("\n"));
        });
    }
};


module.exports.eval = {
    names: ["eval"],
    description: "Disabled by default, needs to be toggled on with `enableevalcmd` in config.json. **Warning!** This will run any javascript code that was provided. It is strongly advised to leave this feature off unless you know exactly what this means! If you have multiple owners configured they can also run code on **your** machine!",
    args: [
        {
            name: "javascript code",
            description: "The code to run",
            type: "string",
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The eval command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        if (!commandHandler.data.advancedconfig.enableevalcmd) return respondModule(context, { prefix: "/me", ...resInfo }, commandHandler.data.lang.evalcmdturnedoff); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

        const clean = text => { // eslint-disable-line no-case-declarations
            if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
                else return text;
        };

        try {
            const code = args.join(" ");
            if (code.includes("logininfo")) return respond(commandHandler.data.lang.evalcmdlogininfoblock); // Not 100% safe but should be at least some protection (only owners can use this cmd)

            // Make using the command a little bit easier
            let controller = commandHandler.controller;      // eslint-disable-line
            let main       = commandHandler.controller.main; // eslint-disable-line
            let data       = commandHandler.data;            // eslint-disable-line

            let evaled = eval(code);
            if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

            // Check for character limit and cut message
            let chatResult = clean(evaled);

            if (chatResult.length >= 500) respond(`Code executed. Result:\n\n${chatResult.slice(0, 500)}.......\n\n\nResult too long for chat.`);
                else respond(`Code executed. Result:\n\n${clean(evaled)}`);

            logger("info", `${logger.colors.fgyellow}Eval result:${logger.colors.reset} \n${clean(evaled)}\n`, true);

        } catch (err) {

            respond(`Error:\n${clean(err)}`);
            logger("error", `${logger.colors.fgyellow}Eval error:${logger.colors.reset} \n${clean(err)}\n`, true);                                                                                                                                                                                                                                                                                                                // Hi I'm a comment that serves no purpose
            return;
        }
    }
};