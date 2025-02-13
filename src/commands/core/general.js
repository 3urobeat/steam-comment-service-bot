/*
 * File: general.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-13 21:52:15
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// General commands

const https = require("https");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


module.exports.help = {
    names: ["help", "h", "commands"],
    description: "Returns a list of commands available to you and a link to the commands documentation wiki page",
    args: [],
    ownersOnly: false,

    /**
     * The help command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        const requesterID = resInfo.userID;

        // Get the correct ownerid array for this request
        let owners = commandHandler.data.cachefile.ownerid;
        if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

        // Construct comment text for owner and user
        let commentText;

        if (owners.includes(resInfo.userID)) {
            commentText = `'${resInfo.cmdprefix}comment (amount/"all") [id/url] [custom, quotes]' - ${await commandHandler.data.getLang("helpcommentowner", { "maxOwnerRequests": commandHandler.data.config.maxOwnerRequests }, requesterID)}`;
        } else {
            commentText = `'${resInfo.cmdprefix}comment (amount/"all")' - ${await commandHandler.data.getLang("helpcommentuser", { "maxRequests": commandHandler.data.config.maxRequests }, requesterID)}`;
        }

        // Construct follow text for owner and user
        let followText;

        if (owners.includes(resInfo.userID)) {
            followText = `'${resInfo.cmdprefix}follow (amount/"all") [id/url]'`;
        } else {
            followText = `'${resInfo.cmdprefix}follow (amount/"all")'`;
        }

        // Get amount user is allowed to request
        let maxTotalComments = commandHandler.data.config.maxRequests;
        if (owners.includes(resInfo.userID)) maxTotalComments = commandHandler.data.config.maxOwnerRequests;

        // Send message
        respond(`
            ${commandHandler.data.datafile.mestr}'s Comment Bot | ${await commandHandler.data.getLang("helpcommandlist", null, requesterID)}\n
            ${commentText}
            '${resInfo.cmdprefix}upvote (amount/"all") (id/url)' - ${await commandHandler.data.getLang("helpvote", { "maxRequests": maxTotalComments }, requesterID)}
            '${resInfo.cmdprefix}favorite (amount/"all") (id/url)' - ${await commandHandler.data.getLang("helpfavorite", { "maxRequests": maxTotalComments }, requesterID)}
            ${followText} - ${await commandHandler.data.getLang("helpfollow", { "maxRequests": commandHandler.data.config.maxRequests }, requesterID)}\n
            '${resInfo.cmdprefix}info' - ${await commandHandler.data.getLang("helpinfo", null, requesterID)}
            '${resInfo.cmdprefix}abort' - ${await commandHandler.data.getLang("helpabort", null, requesterID)}
            '${resInfo.cmdprefix}about' - ${await commandHandler.data.getLang("helpabout", null, requesterID)}
            '${resInfo.cmdprefix}owner' - ${await commandHandler.data.getLang("helpowner", null, requesterID)}

            ${await commandHandler.data.getLang("helpreadothercmdshere", null, requesterID)} ' https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/commands_doc.md '
        `.replace(/^( {4})+/gm, "")); // Remove all the whitespaces that are added by the proper code indentation here
    }
};


module.exports.info = {
    names: ["info"],
    description: "Returns useful information and statistics about the bot and you",
    args: [],
    ownersOnly: false,

    /**
     * The info command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Get the correct ownerid array for this request
        let owners = commandHandler.data.cachefile.ownerid;
        if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

        commandHandler.data.lastCommentDB.findOne({ id: resInfo.userID }, async (err, doc) => {
            const lastReq = await commandHandler.data.getLastCommentRequest();

            let userLastReq = "Never";
            if (doc) userLastReq = ((new Date(doc.time)).toISOString().replace(/T/, " ").replace(/\..+/, "")) + " (GMT time)";

            const info = commandHandler.controller.info;

            /* eslint-disable no-irregular-whitespace */
            respond(`
                -----------------------------------~~~~~------------------------------------
                >   ${commandHandler.data.datafile.mestr}'s Comment Bot [Version ${commandHandler.data.datafile.versionstr}] (More info: ${resInfo.cmdprefix}about)
                >   ${`Uptime: ${Number(Math.round(((new Date() - commandHandler.controller.info.bootStartTimestamp) / 3600000)+"e"+2)+"e-"+2)} hours`.padEnd(24, " ")} | Branch: ${commandHandler.data.datafile.branch}
                >   ${`'node.js' Version: ${process.version}`.padEnd(25, " ")} | RAM Usage (RSS): ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB
                >   ${`Accounts: ${commandHandler.controller.getBots().length}`.padEnd(24, " ")} | Active Plugins: ${Object.keys(commandHandler.controller.pluginSystem.pluginList).length}
                |
                >   Your ID: ${resInfo.userID} | Steam Chat? ${resInfo.fromSteamChat ? "Yes" : "No"} | Owner? ${owners.includes(resInfo.userID) ? "Yes" : "No"}
                >   Your last request: ${userLastReq}
                >   Last processed request: ${(new Date(lastReq)).toISOString().replace(/T/, " ").replace(/\..+/, "")} (GMT time)
                >   I have fulfilled ${info.commentCounter + info.favCounter + info.followCounter + info.voteCounter} comments/favs/follows/votes since my last restart!
                -----------------------------------~~~~~------------------------------------
            `.replace(/^( {4})+/gm, "")); // Remove all the whitespaces that are added by the proper code indentation here
            /* eslint-enable no-irregular-whitespace */
        });
    }
};


module.exports.stats = {
    names: ["stats", "statistics"],
    description: "Returns statistics about the amount of fulfilled requests",
    args: [],
    ownersOnly: false,

    /**
     * The stats command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        const info       = commandHandler.controller.info;
        const stats      = await commandHandler.data.statsDB.findAsync({});
        const statsStart = (new Date(stats.find((e) => e.requestType == "startedTrackingTimestamp").timestamp)).toISOString().split("T", 1)[0];

        const totalComments = stats.find((e) => e.requestType == "comment");
        const totalFavs     = stats.find((e) => e.requestType == "favorite");
        const totalFollows  = stats.find((e) => e.requestType == "follow");
        const totalVotes    = stats.find((e) => e.requestType == "vote");

        /* eslint-disable no-irregular-whitespace */
        respond(`
            -----------------------------------~~~~~------------------------------------
            >   During the last ${Number(Math.round(((new Date() - commandHandler.controller.info.bootStartTimestamp) / 3600000)+"e"+2)+"e-"+2)} hours of uptime, I have...
            >   - sent ${info.commentCounter} comments
            >   - sent ${info.favCounter} un-/favorites
            >   - sent ${info.followCounter} un-/follows
            >   - sent ${info.voteCounter} votes
            |
            >   Since ${statsStart}, I have...
            >   - sent ${totalComments ? totalComments.amount : 0} comments
            >   - sent ${totalFavs     ? totalFavs.amount     : 0} un-/favorites
            >   - sent ${totalFollows  ? totalFollows.amount  : 0} un-/follows
            >   - sent ${totalVotes    ? totalVotes.amount    : 0} votes
            -----------------------------------~~~~~------------------------------------
        `.replace(/^( {4})+/gm, "")); // Remove all the whitespaces that are added by the proper code indentation here
        /* eslint-enable no-irregular-whitespace */
    }
};


module.exports.ping = {
    names: ["ping", "pong"],
    description: "Returns ping in ms to Steam's servers. Can be used to check if the bot is responsive",
    args: [],
    ownersOnly: false,

    /**
     * The ping command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        const respond   = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call
        const pingStart = Date.now();

        https.get("https://steamcommunity.com/ping", (res) => { // Ping steamcommunity.com/ping and measure time
            res.setEncoding("utf8");
            res.on("data", () => {});
            res.on("end", async () => respond(await commandHandler.data.getLang("pingcmdmessage", { "pingtime": Date.now() - pingStart }, resInfo.userID)));
        });
    }
};


module.exports.about = {
    names: ["about"],
    description: "Displays information about this project. The message also contains a disclaimer as well as a link to the owner's profile set in the config.json",
    args: [],
    ownersOnly: false,

    /**
     * The about command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        respond(commandHandler.data.datafile.aboutstr);
    }
};


module.exports.owner = {
    names: ["owner"],
    description: "Returns a link to the owner's profile set in the config.json",
    args: [],
    ownersOnly: false,

    /**
     * The owner command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        const respond = ((txt) => respondModule(context, resInfo, txt)); // Shorten each call

        // Check if no owner link is set
        if (commandHandler.data.config.owner.length < 1) return respond(await commandHandler.data.getLang("ownercmdnolink", null, resInfo.userID));

        respond((await commandHandler.data.getLang("ownercmdmsg", { "cmdprefix": resInfo.cmdprefix }, resInfo.userID)) + "\n" + commandHandler.data.config.owner);
    }
};


// Test Command for debugging
module.exports.test = {
    names: ["test"],
    description: "Test Command for debugging",
    args: [],
    ownersOnly: true,

    /**
     * The test command
     * @param {CommandHandler} commandHandler The commandHandler object
     * @param {Array} args Array of arguments that will be passed to the command
     * @param {function(object, object, string): void} respondModule Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param {object} context The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     */
    run: async (commandHandler, args, respondModule, context, resInfo) => {
        let respond = ((txt) => respondModule(context, resInfo, txt)); // eslint-disable-line

        // Test steamcommunity follow & unfollow implementation
        /* commandHandler.controller.main.community.followUser(args[0], (err, res) => {
            if (err) return logger("", err, true);

            logger("", res, true);
        });

        setTimeout(() => {
            commandHandler.controller.main.community.unfollowUser(args[0], (err, res) => {
                if (err) return logger("", err, true);

                logger("", res, true);
            });
        }, 10000);

        commandHandler.controller.main.community.followCurator(args[0], (err, res) => {
            if (err) return logger("", err, true);

            logger("", res, true);
        });

        setTimeout(() => {
            commandHandler.controller.main.community.unfollowCurator(args[0], (err, res) => {
                if (err) return logger("", err, true);

                logger("", res, true);
            });
        }, 10000); */


        // Test steamcommunity steam discussion implementation
        // App Discussion with lots of comments: https://steamcommunity.com/app/739630/discussions/0/1750150652078713439
        // Forum Discussion I can post in with my test acc: https://steamcommunity.com/discussions/forum/24/3815167348912316274
        // Group discussion with no comment rights: https://steamcommunity.com/groups/SteamLabs/discussions/2/1643168364649277130/

        /* commandHandler.controller.main.community.getSteamDiscussion(args[0], async (err, discussion) => {
            if (err) {
                respond("Error loading discussion: " + err);
                return;
            }

            logger("", discussion, true);
        });

        commandHandler.controller.main.community.getDiscussionComments("https://steamcommunity.com/app/739630/discussions/0/5904837854428568148", 0, null, (err, res) => {
            logger("", res, true);
        });

        commandHandler.controller.main.community.postDiscussionComment("103582791432902485", "882957625821686010", "5291222404430243834", "bleh", (err, res) => {
            logger("", res + " " + err, true);
        });

        setTimeout(() => {
            commandHandler.controller.main.community.getDiscussionComments("https://steamcommunity.com/app/730/discussions/0/5291222404430243834/", 32, 32, (err, res) => {
                let id = res[0].commentId;

                console.log(id);

                commandHandler.controller.main.community.deleteDiscussionComment("103582791432902485", "882957625821686010", "5291222404430243834", id, (err, res) => {
                    logger("", res + " " + err, true);
                });
            });
        }, 5000);

        commandHandler.controller.main.community.getSteamDiscussion("https://steamcommunity.com/discussions/forum/24/3815167348912316274", (err, res) => {
            if (err) logger("", err.stack, true);
                else logger("", res, true);
        });

        commandHandler.controller.main.community.setDiscussionCommentsPerPage("30", (err) => {
            logger("", err, true);
        });

        commandHandler.controller.main.community.getSteamDiscussion("https://steamcommunity.com/groups/SteamLabs/discussions/2/1643168364649277130/", (err, res) => {
            if (err) logger("", err.stack, true);
                else logger("", res, true);
        });

        commandHandler.controller.main.community.getSteamDiscussion("https://steamcommunity.com/app/739630/discussions/0/1750150652078713439/", (err, res) => {
            res.getComments(35, 37, (err, res2) => {
                console.log(res2);
            });
        }); */


        // Test getLang():
        /* logger("", "1: " + await commandHandler.data.getLang("resetcooldowncmdsuccess", { "profileid": "1234" }), true); // Valid test cases
        logger("", "2: " + await commandHandler.data.getLang("resetcooldowncmdsuccess", { "profileid": "1234" }, "russian"), true);
        logger("", "3: " + await commandHandler.data.getLang("resetcooldowncmdsuccess", { "profileid": "1234" }, resInfo.userID), true); // Note: Make sure you exist in the database

        logger("", "4: " + await commandHandler.data.getLang("resetcooldowncmdsuccess", { "testvalue": "1234" }), true); // Invalid test cases
        logger("", "5: " + await commandHandler.data.getLang("resetcooldowncmdsucces"), true);
        logger("", "6: " + await commandHandler.data.getLang("resetcooldowncmdsuccess", { "profileid": "1234" }, "99827634"), true); */


        // Test handleSteamIdResolving():
        /* let handleSteamIdResolving = commandHandler.controller.handleSteamIdResolving;

        // With type param
        handleSteamIdResolving("3urobeat", "profile", console.log);
        handleSteamIdResolving("3urobeatGroup", "group", console.log);
        handleSteamIdResolving("2966606880", "sharedfile", console.log);
        handleSteamIdResolving("https://steamcommunity.com/app/739630/discussions/0/1750150652078713439/", "discussion", console.log);

        // Link matching
        handleSteamIdResolving("https://steamcommunity.com/id/3urobeat", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/profiles/76561198260031749", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/groups/3urobeatGroup", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/sharedfiles/filedetails/?id=2966606880", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/discussions/forum/24/3815167348912316274", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/groups/SteamLabs/discussions/2/1643168364649277130/", null, console.log);
        handleSteamIdResolving("https://steamcommunity.com/app/739630/discussions/0/1750150652078713439/", null, console.log);

        // We don't know, let helper figure it out
        handleSteamIdResolving("3urobeat", null, console.log);
        handleSteamIdResolving("3urobeatGroup", null, console.log);
        handleSteamIdResolving("2966606880", null, console.log);

        // We already provide the correct id
        handleSteamIdResolving("76561198260031749", null, console.log);
        handleSteamIdResolving("103582791464712227", null, console.log); */


        // Job registration and unregistration test:
        /* let testfunc = (jobManager) => {
            logger("info", "Hello, I'm a job");
            logger("", jobManager.jobs.length); // Test if jobManager reference works
        };

        commandHandler.controller.jobManager.registerJob({ name: "testjob", interval: 2500, func: testfunc, runOnRegistration: true });

        setTimeout(() => { // Unregister after 10 sec
            commandHandler.controller.jobManager.unregisterJob("testjob");
        }, 10000); */


        // Test steamcommunity steam reviews implementation
        /* commandHandler.controller.main.community.getSteamReview("76561198260031749", "1902490", (err, res) => {
            if (err) return logger("error", err.stack, true);

            logger("", res, true);

            res.comment("test", (err) => { if (err) logger("", err, true); });
            res.subscribe();
            res.voteFunny((err) => { if (err) logger("error", "Failed to vote: " + err, true); });
            res.deleteComment("7434949789831866840", (err) => { if (err) logger("error", "Failed to delete: " + err, true); });
            res.unsubscribe();
        }); */

    }
};
