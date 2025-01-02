/*
 * File: system.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-02 13:23:12
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs = require("fs");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.jobs = {
    names: ["jobs"],
    description: "Lists all currently registered jobs",
    args: [],
    ownersOnly: true,

    /**
     * The jobs command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Check if no job is registered and abort
        if (commandHandler.controller.jobManager.jobs.length == 0) {
            respond(await commandHandler.data.getLang("jobscmdregistered", null, resInfo.userID));
            return;
        }

        // Helper function to convert lastExecTimestamp to human readable format
        const convertTimestamp = (timestamp) => ((new Date(timestamp)).toISOString().replace(/T/, " ").replace(/\..+/, "")) + " (GMT time)";

        // Construct str to respond with
        let str = await commandHandler.data.getLang("jobscmdregistered", null, resInfo.userID) + "\n";

        commandHandler.controller.jobManager.jobs.forEach((job) => {
            const desc              = job.description ? "   " + job.description + "\n" : "";                  // Adds job description if one was specified
            const intervalFormatted = commandHandler.controller.misc.timeToString(Date.now() + job.interval); // Hack: Add current time to use timeToString for formatting (it's designed to be used in an "until from now" situation)

            // Only show lastExecFormatted string if lastExecTimestamp isn't the same as registeredAt (tolerance of unnecessary 100ms) or job ran upon registration. The JobManager sets _lastExecTimestamp to Date.now() on registration if runOnRegistration == false
            const lastExecFormatted = job._lastExecTimestamp - job._registeredAt > 100 || job.runOnRegistration ? convertTimestamp(job._lastExecTimestamp) : "/";

            str += `- '${job.name}' runs every ${intervalFormatted}, last at '${lastExecFormatted}'\n${desc}\n`;
        });

        // Send message
        respond(str);
    }
};


module.exports.restart = {
    names: ["restart", "rs"],
    description: "Restarts the bot and checks for available updates",
    args: [],
    ownersOnly: true,

    /**
     * The restart command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("restartcmdrestarting", null, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

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
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("stopcmdstopping", null, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

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
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {

        // Reload commandHandler
        commandHandler.reloadCommands();

        // Reload pluginSystem
        commandHandler.controller.pluginSystem.reloadPlugins();

        // Reload data
        await commandHandler.data._importFromDisk();

        // Send response message
        respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("reloadcmdreloaded", null, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained

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
            isOptional: true,
            ownersOnly: true
        },
    ],
    ownersOnly: true,

    /**
     * The update command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((modResInfo, txt) => respondModule(context, modResInfo, txt)); // Shorten each call. Updater takes resInfo as param and can modify it, so we need to pass the modified resInfo object here

        // If the first argument is "true" or "force" then we shall force an update
        const force = (args[0] == "true" || args[0] == "force");

        // Use the correct message depending on if force is true or false with a ternary operator
        respond({ prefix: "/me", ...resInfo }, await commandHandler.data.getLang(force ? "updatecmdforce" : "updatecmdcheck", { "branchname": commandHandler.data.datafile.branch }, resInfo.userID));

        // Run the updater, pass force and our respond function which will allow the updater to text the user what's going on
        commandHandler.controller.updater.run(force, respond, resInfo);
    }
};


module.exports.output = {
    names: ["log", "output"],
    description: "Shows the last 15 lines of the log",
    args: [],
    ownersOnly: true,

    /**
     * The output command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
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
            isOptional: false,
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The eval command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        if (!commandHandler.data.advancedconfig.enableevalcmd) {
            respondModule(context, { prefix: "/me", ...resInfo }, await commandHandler.data.getLang("evalcmdturnedoff", null, resInfo.userID)); // Pass new resInfo object which contains prefix and everything the original resInfo obj contained
            return;
        }

        const clean = text => {
            if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
                else return text;
        };

        try {
            const code = args.join(" ");
            if (code.includes("logininfo") || code.includes("logOnOptions") || code.includes("tokensDB")) return respond(await commandHandler.data.getLang("evalcmdlogininfoblock", null, resInfo.userID)); // Not 100% safe but should prevent accidental leaks (only owners can use this cmd)

            // Make using the command a little bit easier
            let controller = commandHandler.controller;      // eslint-disable-line
            let main       = commandHandler.controller.main; // eslint-disable-line
            let data       = commandHandler.data;            // eslint-disable-line

            // Run code & convert to string
            let evaled = eval(code);
            if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

            // Sanitize result to filter logindata. This is not 100% safe but should prevent accidental leaks (only owners can use this cmd)
            commandHandler.data.logininfo.forEach((e) => {
                evaled = evaled.replace(new RegExp(e.password, "g"), "\"censored\"");
            });

            // Check for character limit and cut message
            const chatResult = clean(evaled);

            if (chatResult.length >= 500) respond(`Code executed. Result:\n\n${chatResult.slice(0, 500)}.......\n\nResult too long for chat.`);
                else respond(`Code executed. Result:\n\n${chatResult}`);

            logger("info", `${logger.colors.fgyellow}Eval result:${logger.colors.reset} \n${clean(evaled)}`, true);

        } catch (err) {

            respond(`Error:\n${clean(err)}`);
            logger("error", `${logger.colors.fgyellow}Eval error:${logger.colors.reset} \n${clean(err)}`, true);                                                                                                                                                                                                                                                                                                                // Hi I'm a comment that serves no purpose
            return;
        }
    }
};


const availableManageModes = "addAccount, removeAccount, filterAccounts";

module.exports.manage = {
    names: ["manage"],
    description: "Interact with the manage module to administrate the active set of bot accounts",
    args: [
        {
            name: "mode",
            description: `Available modes: '${availableManageModes}'`,
            type: "string",
            isOptional: false,
            ownersOnly: true
        },
        {
            name: "argument",
            description: "Argument(s) the selected mode requires. Run command without this parameter to display help for the selected mode",
            type: "string",
            isOptional: true, // Optional to display help for selected mode if no argument is provided
            ownersOnly: true
        }
    ],
    ownersOnly: true,

    /**
     * The manage command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        const cmdusage = `'${resInfo.cmdprefix}manage mode argument'`; // TODO: Can't we dynamically generate this in the future?

        // Prevent error when calling toLowerCase below when user did not provide any mode
        if (!args[0]) args[0] = "";

        switch (args[0].toLowerCase()) {
            case "addaccount": { // Block "fixes" eslint no-case-declarations warning
                // Check if no or too short (= probably incorrect format) credentials were provided
                if (!args[1] || args[1].split(":").length < 2) {
                    respond(await commandHandler.data.getLang("managecmdaddusage", { "credentialsformat": "username:password:sharedSecret", "optionalparameter": "sharedSecret", "cmdusage": cmdusage }, resInfo.userID));
                }

                // Split credentials into username, password and sharedSecret
                const credentials = args[1].split(":");

                // Run manage function with the provided credentials
                commandHandler.controller.addAccount(credentials[0], credentials[1], credentials[2] || "");

                respond(await commandHandler.data.getLang("managecmdaddsuccess", { "username": credentials[0] }, resInfo.userID));
                break;
            }

            case "removeaccount":
                // Check if no username was provided
                if (!args[1]) return respond(await commandHandler.data.getLang("managecmdremoveusage", { "cmdusage": cmdusage }, resInfo.userID));

                // Run manage function with the provided username
                commandHandler.controller.removeAccount(args[1]);

                respond(await commandHandler.data.getLang("managecmdremovesuccess", { "username": args[1] }, resInfo.userID));
                break;

            case "filteraccounts": { // Block "fixes" eslint no-case-declarations warning
                const availableFilters = Object.keys(commandHandler.controller.filters);
                const filtersLowercase = availableFilters.map((e) => e.toLowerCase());

                // Check if no filter or an invalid filter was provided
                if (!args[1] || !filtersLowercase.includes(args[1].toLowerCase())) {
                    respond(await commandHandler.data.getLang("managecmdfilterusage", { "availablefilters": availableFilters.join(", "), "cmdusage": cmdusage }, resInfo.userID));
                    return;
                }

                // Find the selected filter while ignoring case
                const selectedFilter = availableFilters.find((e) => e.toLowerCase() == args[1].toLowerCase());

                // Run manage function with the selected filter
                const filterResult = commandHandler.controller.filterAccounts(commandHandler.controller.filters[selectedFilter]);

                respond(await commandHandler.data.getLang("managecmdfiltersuccess", { "matchamount": filterResult.length, "selectedfilter": selectedFilter, "usernames": filterResult.map((e) => e.accountName).join(", ") }));
                break;
            }

            default:
                respond(await commandHandler.data.getLang("managecmdusage", { "availablemodes": availableManageModes, "cmdusage": cmdusage }, resInfo.userID));
        }
    }
};
