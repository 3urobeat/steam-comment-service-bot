/*
 * File: friendMessage.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 03.04.2023 13:41:24
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const Bot = require("../bot.js");


/**
 * Handles messages, cooldowns and executes commands.
 */
Bot.prototype._attachSteamFriendMessageEvent = function() {
    let _this = this;

    this.user.on("friendMessage", (steamID, message) => {

        let resInfo    = { steamID: steamID };                         // Object required for sendChatMessage(), our commandHandler respondModule implementation
        let steam64id  = new SteamID(String(steamID)).getSteamID64();
        let ownercheck = cachefile.ownerid.includes(steam64id);


        // Check if this event should be handled or if user is blocked
        let isBlocked = require("../helpers/checkMsgBlock.js").checkMsgBlock(this.logPrefix, this.user, steamID, message, this.controller.data.lang, chatmsg);
        if (isBlocked) return; // Stop right here if user is blocked, on cooldown or not a friend


        // Function to quickly respond with owneronly message and stop command execution
        let notOwnerResponse = (() => { return this.sendChatMessage(resInfo, this.controller.data.lang.commandowneronly); });


        // Log friend message but cut it if it is >= 75 chars
        if (message.length >= 75) logger("info", `[${this.logPrefix}] Friend message from ${steam64id}: ${message.slice(0, 75) + "..."}`);
            else logger("info", `[${this.logPrefix}] Friend message from ${steam64id}: ${message}`);


        // Sort out any chat messages not sent to the main bot
        if (this.index !== 0) {
            switch(message.toLowerCase()) {
                case "!about": // Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                    this.sendChatMessage(resInfo, this.controller.data.datafile.aboutstr);
                    break;
                default:
                    if (message.startsWith("!")) this.sendChatMessage(resInfo, `${this.controller.data.lang.childbotmessage}\nhttps://steamcommunity.com/profiles/${new SteamID(String(this.controller.main.user.steamID)).getSteamID64()}`);
                        else logger("debug", `[${this.logPrefix}] Chat message is not a command, ignoring message.`);
            }

            return;
        }


        /* -------------- Handle message event for the main bot -------------- */

        // Check if user is in lastcomment database
        this.controller.data.lastCommentDB.findOne({ id: steam64id }, (err, doc) => {
            if (err) logger("error", "Database error on friendMessage. This is weird. Error: " + err);

            if (!doc) { // Add user to database if he/she is missing for some reason
                let lastcommentobj = {
                    id: new SteamID(String(steamID)).getSteamID64(),
                    time: Date.now() - (config.commentcooldown * 60000) // Subtract commentcooldown so that the user is able to use the command instantly
                };

                this.controller.data.lastCommentDB.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err); });
            }
        });


        // Get arguments provided with the message
        let cont = message.slice("!").split(" ");
        let args = cont.slice(1);

        // Run the correct command
        switch(cont[0].toLowerCase()) {
            case "!h":
            case "help":
            case "!help":
            case "!commands":
                require("../commands/general.js").help(ownercheck, chatmsg, steamID, this.controller.data.lang);
                break;

            case "!comment":
                if (this.controller.data.advancedconfig.disableCommentCmd) return chatmsg(steamID, this.controller.data.lang.botmaintenance);
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                this.controller.data.lastCommentDB.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                    if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err);

                    try { // Catch any unhandled error to be able to remove user from activecommentprocess array
                        require("../commands/commentprofile.js").run(chatmsg, steamID, args, this.controller.data.lang, null, lastcommentdoc);
                    } catch (err) {
                        chatmsg(steamID, "Sorry, a non comment related error occurred while trying to process your request! Please try again later.");
                        logger("error", "A non comment related error occurred while trying to process a comment request. Aborting request to make sure nothing weird happens.\n        " + err.stack);
                    }
                });
                break;


            case "!gcomment":
            case "!groupcomment":
                if (!ownercheck) return notOwnerResponse();
                if (this.controller.data.advancedconfig.disableCommentCmd) return chatmsg(steamID, this.controller.data.lang.botmaintenance);
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                this.controller.data.lastCommentDB.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                    if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err);

                    try { // Catch any unhandled error to be able to remove user from activecommentprocess array
                        require("../commands/commentgroup.js").run(chatmsg, steamID, args, this.controller.data.lang, null, lastcommentdoc);
                    } catch (err) {
                        chatmsg(steamID, "Error while processing group comment request: " + err.stack);
                        logger("error", "Error while processing group comment request: " + err);
                    }
                });
                break;

            case "!ping":
                this.commandHandler.ping({ steamID: steamID });
                break;

            case "!info":
                require("../commands/general.js").info(steam64id, chatmsg, steamID);
                break;

            case "!owner":
                require("../commands/general.js").owner(chatmsg, steamID, this.controller.data.lang);
                break;

            case "!group":
                require("../commands/group.js").group(this.user, chatmsg, steamID, this.controller.data.lang);
                break;

            case "!abort":
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/commentmisc.js").abort(chatmsg, steamID, this.controller.data.lang, args, steam64id);
                break;

            case "!rc":
            case "!resetcooldown":
                if (!ownercheck) return notOwnerResponse();
                if (this.controller.data.advancedconfig.disableCommentCmd) return chatmsg(steamID, this.controller.data.lang.botmaintenance);

                require("../commands/commentmisc.js").resetCooldown(chatmsg, steamID, this.controller.data.lang, args, steam64id);
                break;

            case "!config":
            case "!settings":
                if (!ownercheck) return notOwnerResponse();

                require("../commands/settings.js").run(chatmsg, steamID, this.controller.data.lang, this.index, args);
                break;

            case "!failed":
                require("../commands/commentmisc.js").failed(chatmsg, steamID, this.controller.data.lang, args, steam64id);
                break;

            case "!sessions":
                if (!ownercheck) return notOwnerResponse();

                require("../commands/commentmisc.js").sessions(chatmsg, steamID, this.controller.data.lang);
                break;

            case "!mysessions":
                require("../commands/commentmisc.js").mysessions(chatmsg, steamID, this.controller.data.lang, steam64id);
                break;

            case "!about": // Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                require("../commands/general.js").about(chatmsg, steamID);
                break;

            case "!addfriend":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/friend.js").addFriend(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!unfriend":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/friend.js").unfriend(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!unfriendall":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/friend.js").unfriendAll(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!leavegroup":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/group.js").leaveGroup(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!leaveallgroups":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/group.js").leaveAllGroups(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!block": // Well it kinda works but unblocking doesn't. The friend relationship enum stays at 6
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/block.js").block(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!unblock":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/block.js").unblock(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!rs":
            case "!restart":
                if (!ownercheck) return notOwnerResponse();

                require("../commands/system.js").restart(chatmsg, steamID, this.controller.data.lang);
                break;

            case "!stop":
                if (!ownercheck) return notOwnerResponse();

                require("../commands/system.js").stop(chatmsg, steamID, this.controller.data.lang);
                break;

            case "!update":
                if (!ownercheck) return notOwnerResponse();
                if (!this.controller.info.readyAfter || this.controller.relogQueue.length > 0) return chatmsg(steamID, this.controller.data.lang.botnotready); // Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/system.js").update(chatmsg, steamID, this.controller.data.lang, args);
                break;

            case "!log":
            case "!output":
                if (!ownercheck) return notOwnerResponse();

                require("../commands/system.js").output(chatmsg, steamID);
                break;

            case "!eval":
                if (!this.controller.data.advancedconfig.enableevalcmd) return chatmsg(steamID, this.controller.data.lang.evalcmdturnedoff);
                if (!ownercheck) return notOwnerResponse();

                require("../commands/system.js").eval(chatmsg, steamID, this.controller.data.lang, args, this.user, this.community);
                break;

            case ":)":
                chatmsg(steamID, ":))");
                break;

            default: // Cmd not recognized
                if (message.startsWith("!")) chatmsg(steamID, this.controller.data.lang.commandnotfound);
                    else logger("debug", "Chat message is not a command, ignoring message.");
        }

    });

};