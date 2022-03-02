/*
 * File: friendMessage.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 02.03.2022 12:42:31
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Handles messages, cooldowns ad executes commands.
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {SteamUser} bot The bot instance of the calling account
 * @param {SteamCommunity} community The community instance of the calling account
 * @param {Object} steamID The steamID object from steam-user
 * @param {String} message The message string provided by steam-user friendMessage event
 */
module.exports.run = (loginindex, thisbot, bot, community, steamID, message) => {
    var controller = require("../../controller/controller.js")
    var ready      = require("../../controller/ready.js")
    var mainfile   = require("../main.js")

    var SteamID    = require('steamid');

    var lang       = mainfile.lang

    var disablecommentcmd     = false //disables the comment and resetcooldown command and responds with maintenance message
    var commandcooldown       = 12000 //The bot won't respond if a user sends more than 5 messages in this time frame
    var lastmessage           = {}    //tracks the last cmd usage of a normal command to apply cooldown if the user spams


    /**
     * Make chat message method shorter
     * @param {SteamID} steamID The steamID object of the recipient
     * @param {String} txt The text to send
     * @param {Boolean} retry true if chatmsg() called itself again to send error message
     */
    function chatmsg(steamID, txt, retry) { //sadly needed to be included here in order to access bot instance before friendMessage got called at least once or needing to provide it as parameter
        //Cut message if over 1k chars to try and reduce the risk of a RateLimitExceeded error
        if (txt.length > 1000) {
            logger("warn", `[${thisbot}] The bot tried to send a chat message that's longer than 1000 chars. Cutting it to 996 chars to reduce the risk of a RateLimitExceeded error!`)
            txt = txt.slice(0, 996);
            txt += "..."
        }

        logger("debug", `[${thisbot}] Sending message (${txt.length} chars) to ${new SteamID(String(steamID)).getSteamID64()} (retry: ${retry == true}): "${txt.replace(/\n/g, "\\n")}"`) //intentionally checking for == true to prevent showing undefined
        
        bot.chat.sendFriendMessage(steamID, txt, {}, (err) => {
            if (err) { //check for error as some chat messages seem to not get send lately
                logger("err", `[${thisbot}] Error trying to send chat message of length ${txt.length} to ${new SteamID(String(steamID)).getSteamID64()}! ${err}`)
                if (!retry) chatmsg(steamID, `Sorry, it looks like Steam blocked my last message. Please try again later.`, true) //send the user a fallback message just to indicate the bot is not down
            }
        })
    }


    


    var steam64id = new SteamID(String(steamID)).getSteamID64()
    var ownercheck = cachefile.ownerid.includes(steam64id)
    if (bot.myFriends[steam64id] == 1 || bot.myFriends[steam64id] == 6) return; //User is blocked.

    //Spam "protection" because spamming the bot is bad!
    if (!lastmessage[steam64id] || lastmessage[steam64id][0] + commandcooldown < Date.now()) lastmessage[steam64id] = [Date.now(), 0] //Add user to array or Reset time
    if (lastmessage[steam64id] && lastmessage[steam64id][0] + commandcooldown > Date.now() && lastmessage[steam64id][1] > 5) return; //Just don't respond

    if (lastmessage[steam64id] && lastmessage[steam64id][0] + commandcooldown > Date.now() && lastmessage[steam64id][1] > 4) { //Inform the user about the cooldown
        chatmsg(steamID, lang.userspamblock)
        logger("info", `${steam64id} has been blocked for 90 seconds for spamming.`)
        lastmessage[steam64id][0] += 90000
        lastmessage[steam64id][1]++
        return; 
    }

    if (!ownercheck) lastmessage[steam64id][1]++ //push new message to array if user isn't an owner

    //log friend message but cut it if it is >= 75 chars
    if (message.length >= 75) logger("info", `[${thisbot}] Friend message from ${steam64id}: ${message.slice(0, 75) + "..."}`);
        else logger("info", `[${thisbot}] Friend message from ${steam64id}: ${message}`);
        
    //Deny non-friends the use of any command
    if (bot.myFriends[steam64id] != 3) return chatmsg(steamID, lang.usernotfriend)

    if (loginindex === 0) { //check if this is the main bot

        /**
         * Function to quickly respond with owneronly message and stop command execution
         */
        var notownerresponse = (() => { 
            return chatmsg(steamID, lang.commandowneronly) 
        })

        //Check if user is in lastcomment database
        controller.lastcomment.findOne({ id: steam64id }, (err, doc) => {
            if (err) logger("error", "Database error on friendMessage. This is weird. Error: " + err)

            if (!doc) { //add user to database if he/she is missing for some reason
                let lastcommentobj = {
                    id: new SteamID(String(steamID)).getSteamID64(),
                    time: Date.now() - (config.commentcooldown * 60000) //subtract commentcooldown so that the user is able to use the command instantly
                }
                
                controller.lastcomment.insert(lastcommentobj, (err) => { if (err) logger("error", "Error inserting new user into lastcomment.db database! Error: " + err) }) 
            }
        })

        var cont = message.slice("!").split(" ");
        var args = cont.slice(1); 

        switch(cont[0].toLowerCase()) {
            case '!h':
            case 'help':
            case '!help':
            case '!commands':
                require("../commands/general.js").help(ownercheck, chatmsg, steamID, lang)
                break;
            
            case '!comment':
                if (disablecommentcmd) return chatmsg(steamID, lang.botmaintenance)
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                controller.lastcomment.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                    if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err)
    
                    try { //catch any unhandled error to be able to remove user from activecommentprocess array
                        require("../commands/commentprofile.js").run(chatmsg, steamID, args, lang, null, lastcommentdoc)
                    } catch (err) {
                        chatmsg(steamID, "Error while processing comment request: " + err.stack)
                        logger("error", "Error while processing comment request: " + err.stack)
                    }
                })
                break;

            
            case '!gcomment':
            case '!groupcomment':
                if (!ownercheck) return notownerresponse();
                if (disablecommentcmd) return chatmsg(steamID, lang.botmaintenance)
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                controller.lastcomment.findOne({ id: steam64id }, (err, lastcommentdoc) => {
                    if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err)
    
                    try { //catch any unhandled error to be able to remove user from activecommentprocess array
                        require("../commands/comment/groupcomment.js").run(chatmsg, steamID, args, null, lastcommentdoc)
                    } catch (err) {
                        chatmsg(steamID, "Error while processing group comment request: " + err.stack)
                        logger("error", "Error while processing group comment request: " + err)
                    }
                })
                break;
            
            case '!ping':
                require("../commands/general.js").ping(chatmsg, steamID, lang)
                break;
            
            case '!info':
                require("../commands/general.js").info(steam64id, chatmsg, steamID)
                break;
            
            case '!owner':
                require("../commands/general.js").owner(chatmsg, steamID, lang)
                break;
            
            case '!group':
                require("../commands/group.js").group(bot, chatmsg, steamID, lang)
                break;
            
            case '!abort':
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/commentmisc.js").abort(chatmsg, steamID, lang, args, steam64id)
                break;
            
            case '!rc':
            case '!resetcooldown':
                if (!ownercheck) return notownerresponse();
                if (disablecommentcmd) return chatmsg(steamID, lang.botmaintenance)

                require("../commands/commentmisc.js").resetCooldown(chatmsg, steamID, lang, args, steam64id)
                break;
            
            case '!config':
            case '!settings':
                if (!ownercheck) return notownerresponse();

                require("../commands/settings.js").run(chatmsg, steamID, lang, loginindex, args)
                break;
            
            case '!failed':
                require("../commands/commentmisc.js").failed(chatmsg, steamID, lang, args, steam64id)
                break;

            case '!sessions':
                if (!ownercheck) return notownerresponse();
                
                require("../commands/commentmisc.js").sessions(chatmsg, steamID, lang)
                break;

            case '!mysessions':
                require("../commands/commentmisc.js").mysessions(chatmsg, steamID, lang, steam64id)
                break;
            
            case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                require("../commands/general.js").about(chatmsg, steamID)
                break;
            
            case '!addfriend':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/friend.js").addFriend(chatmsg, steamID, lang, args)
                break;

            case '!unfriend':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/friend.js").unfriend(chatmsg, steamID, lang, args)
                break;
            
            case '!unfriendall':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/friend.js").unfriendAll(chatmsg, steamID, lang, args)
                break;
            
            case '!leavegroup':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/group.js").leaveGroup(chatmsg, steamID, lang, args)
                break;
            
            case '!leaveallgroups':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/group.js").leaveAllGroups(chatmsg, steamID, lang, args)
                break;
            
            case '!block': //Well it kinda works but unblocking doesn't. The friend relationship enum stays at 6
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/block.js").block(chatmsg, steamID, lang, args)
                break;
            
            case '!unblock':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/block.js").unblock(chatmsg, steamID, lang, args)
                break;
            
            case '!rs':
            case '!restart':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").restart(chatmsg, steamID, lang)
                break;

            case '!stop':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").stop(chatmsg, steamID, lang)
                break;
            
            case '!update':
                if (!ownercheck) return notownerresponse();
                if (!ready.readyafter || controller.relogQueue.length > 0) return chatmsg(steamID, lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

                require("../commands/system.js").update(chatmsg, steamID, lang, args)
                break;
            
            case '!log':
            case '!output':
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").output(chatmsg, steamID)
                break;
            
            case '!eval':
                if (advancedconfig.enableevalcmd !== true) return chatmsg(steamID, lang.evalcmdturnedoff)
                if (!ownercheck) return notownerresponse();

                require("../commands/system.js").eval(chatmsg, steamID, lang, args, bot, community)
                break;
            
            default: //cmd not recognized
                if (message.startsWith("!")) chatmsg(steamID, lang.commandnotfound) 
        }
    } else {
        switch(message.toLowerCase()) {
            case '!about': //Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
                chatmsg(steamID, extdata.aboutstr)
                break;
            default:
                if (message.startsWith("!")) chatmsg(steamID, `${lang.childbotmessage}\nhttps://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[0].steamID)).getSteamID64()}`)
        }
    }
}