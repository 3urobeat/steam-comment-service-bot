/*
 * File: general.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 31.05.2023 15:15:40
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// General commands


const https   = require("https");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.help = {
    names: ["h", "help", "commands"],
    description: "",
    ownersOnly: false,

    /**
     * The help command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Construct comment text for owner or non owner
        let commentText;

        if (commandHandler.data.cachefile.ownerid.includes(steamID64)) {
            if (commandHandler.controller.getBots().length > 1 || commandHandler.data.config.maxOwnerComments) commentText = `'!comment (amount/"all") [profileid] [custom, quotes]' - ${commandHandler.data.lang.helpcommentowner1.replace("maxOwnerComments", commandHandler.data.config.maxOwnerComments)}`;
                else commentText = `'!comment ("1") [profileid] [custom, quotes]' - ${commandHandler.data.lang.helpcommentowner2}`;
        } else {
            if (commandHandler.controller.getBots().length > 1 || commandHandler.data.config.maxComments) commentText = `'!comment (amount/"all")' - ${commandHandler.data.lang.helpcommentuser1.replace("maxComments", commandHandler.data.config.maxComments)}`;
                else commentText = `'!comment' - ${commandHandler.data.lang.helpcommentuser2}`;
        }

        // Add yourgroup text if one was set
        let yourgroupText;

        if (commandHandler.data.config.yourgroup.length > 1) yourgroupText = commandHandler.data.lang.helpjoingroup;

        // Send message
        respond(`
            ${commandHandler.data.datafile.mestr}'s Comment Bot | ${commandHandler.data.lang.helpcommandlist}\n
            ${commentText}\n
            '!ping' - ${commandHandler.data.lang.helpping}
            '!info' - ${commandHandler.data.lang.helpinfo}
            '!abort' - ${commandHandler.data.lang.helpabort}
            '!about' - ${commandHandler.data.lang.helpabout}
            '!owner' - ${commandHandler.data.lang.helpowner}
            ${yourgroupText}
        
            ${commandHandler.data.lang.helpreadothercmdshere} ' https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Commands-documentation '
        `.replace(/ {4}/gm, "")); // Remove all the whitespaces that are added by the proper code indentation here
    }
};


module.exports.info = {
    names: ["info"],
    description: "",
    ownersOnly: false,

    /**
     * The info command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        commandHandler.data.lastCommentDB.findOne({ id: steamID64 }, async (err, doc) => {
            let lastReq = await commandHandler.data.getLastCommentRequest();

            let userLastReq = "Never";
            if (doc) userLastReq = ((new Date(doc.time)).toISOString().replace(/T/, " ").replace(/\..+/, "")) + " (GMT time)";

            /* eslint-disable no-irregular-whitespace */
            respond(`
                -----------------------------------~~~~~------------------------------------
                >   ${commandHandler.data.datafile.mestr}'s Comment Bot [Version ${commandHandler.data.datafile.versionstr}] (More info: !about)
                >   Uptime: ${Number(Math.round(((new Date() - commandHandler.controller.info.bootStartTimestamp) / 3600000)+"e"+2)+"e-"+2)} hours | Branch: ${commandHandler.data.datafile.branch}
                >   'node.js' Version: ${process.version} | RAM Usage (RSS): ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB
                >   Accounts: ${commandHandler.controller.getBots().length} | maxComments/owner: ${commandHandler.data.config.maxComments}/${commandHandler.data.config.maxOwnerComments} | delay: ${commandHandler.data.config.commentdelay}
                |
                >   Your steam64ID: ${steamID64}
                >   Your last comment request: ${userLastReq}
                >   Last processed comment request: ${(new Date(lastReq)).toISOString().replace(/T/, " ").replace(/\..+/, "")} (GMT time)
                >   I have commented ${commandHandler.controller.info.commentCounter} times since my last restart and completed request!
                -----------------------------------~~~~~------------------------------------
            `.replace(/ {4}/gm, "")); // Remove all the whitespaces that are added by the proper code indentation here
            /* eslint-enable no-irregular-whitespace */
        });
    }
};


module.exports.ping = {
    names: ["ping", "pong"],
    description: "Pings SteamCommunity and measures the time it took.",
    ownersOnly: false,

    /**
     * The ping command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond   = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        let pingStart = Date.now();

        https.get("https://steamcommunity.com/ping", (res) => { // Ping steamcommunity.com/ping and measure time
            res.setEncoding("utf8");
            res.on("data", () => {});
            res.on("end", () => respond(commandHandler.data.lang.pingcmdmessage.replace("pingtime", Date.now() - pingStart)));
        });
    }
};


module.exports.about = {
    names: ["about"],
    description: "",
    ownersOnly: false,

    /**
     * The about command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        respond(commandHandler.data.datafile.aboutstr);
    }
};


module.exports.owner = {
    names: ["owner"],
    description: "",
    ownersOnly: false,

    /**
     * The owner command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Check if no owner link is set
        if (commandHandler.data.config.owner.length < 1) return respond(commandHandler.data.lang.ownercmdnolink);

        respond(commandHandler.data.lang.ownercmdmsg + "\n" + commandHandler.data.config.owner);
    }
};


// Test Command for debugging
module.exports.test = {
    names: ["test"],
    description: "",
    ownersOnly: true,

    /**
     * The test command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {string} steamID64 Steam ID of the user that executed this command
     * @param {function(object, object, string)} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {Object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {Object} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, steamID64, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Do not remove, these are handleSteamIdResolving test cases. Might be useful to include later in steamid-resolving lib test suite
        let handleSteamIdResolving = commandHandler.controller.handleSteamIdResolving;

        // With type param
        handleSteamIdResolving("3urobeat", "profile", console.log);
        handleSteamIdResolving("3urobeatGroup", "group", console.log);
        handleSteamIdResolving("2966606880", "sharedfile", console.log);

        // Link matching
        handleSteamIdResolving("https://steamcommunity.com/id/3urobeat", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/profiles/76561198260031749", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/groups/3urobeatGroup", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/sharedfiles/filedetails/?id=2966606880", null, console.log);

        // We don't know, let helper figure it out
        handleSteamIdResolving("3urobeat", null, console.log);
        handleSteamIdResolving("3urobeatGroup", null, console.log);
        handleSteamIdResolving("2966606880", null, console.log);

        // We already provide the correct id
        handleSteamIdResolving("76561198260031749", null, console.log);
        handleSteamIdResolving("103582791464712227", null, console.log);
    }
};
