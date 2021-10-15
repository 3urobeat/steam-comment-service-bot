/*
 * File: cmisc.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 15.10.2021 21:23:04
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Runs the abort command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {String} steam64id The steam64id of the requesting user
 */
module.exports.abort = (chatmsg, steamID, lang, steam64id) => {
    var mainfile = require("../../main.js")

    if (!mainfile.activecommentprocess[steam64id] || mainfile.activecommentprocess[steam64id].status != "active") return chatmsg(steamID, lang.abortcmdnoprocess)

    mainfile.activecommentprocess[steam64id].status = "aborted"

    logger("info", `Aborting comment process for profile ${steam64id}...`)
    chatmsg(steamID, lang.abortcmdsuccess)
}


/**
 * Runs the resetcooldown command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 * @param {String} steam64id The steam64id of the requesting user
 */
module.exports.resetCooldown = (chatmsg, steamID, lang, args, steam64id) => {
    var SteamID    = require("steamid")

    var mainfile   = require("../../main.js")
    var controller = require("../../../controller/controller.js")


    if (args[0]) {
        if (args[0] == "global") { //Check if user wants to reset the global cooldown (will reset all until entries in activecommentprocess)
            if (config.globalcommentcooldown == 0) return chatmsg(steamID, lang.resetcooldowncmdcooldowndisabled) //is the global cooldown enabled?

            Object.keys(mainfile.activecommentprocess).forEach((e) => {
                mainfile.activecommentprocess[e].until = Date.now() - (config.globalcommentcooldown * 60000); //since the cooldown checks will add the cooldown we need to subtract it (can't delete the entry because we might abort running processes with it)
            })

            return chatmsg(steamID, lang.resetcooldowncmdglobalreset) 
        }

        if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid) 
        if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid) 

        var steam64id = args[0] //change steam64id to the provided id
    }

    if (config.commentcooldown == 0) return chatmsg(steamID, lang.resetcooldowncmdcooldowndisabled) //is the cooldown enabled?

    controller.lastcomment.update({ id: steam64id }, { $set: { time: Date.now() - (config.commentcooldown * 60000) } }, (err) => { 
        if (err) return chatmsg(steamID, "Error updating database entry: " + err)
            else chatmsg(steamID, lang.resetcooldowncmdsuccess.replace("profileid", steam64id.toString())) 
    })
}


/**
 * Runs the failed command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {String} steam64id The steam64id of the requesting user
 */
module.exports.failed = (chatmsg, steamID, lang, steam64id) => {
    var mainfile   = require("../../main.js")
    var controller = require("../../../controller/controller.js")
    
    controller.lastcomment.findOne({ id: steam64id }, (err, doc) => {
        if (!mainfile.failedcomments[steam64id] || Object.keys(mainfile.failedcomments[steam64id]).length < 1) return chatmsg(steamID, lang.failedcmdnothingfound);

        let requesttime = new Date(doc.time).toISOString().replace(/T/, ' ').replace(/\..+/, '')
        
        let failedcommentsobj = JSON.stringify(mainfile.failedcomments[steam64id], null, 4)
        let failedcommentsstr = failedcommentsobj.slice(1, -1).split("\n").map(s => s.trim()).join("\n") //remove brackets and whitespaces

        let messagestart = lang.failedcmdmsg.replace("steam64id", steam64id).replace("requesttime", requesttime)

        //Limit length to 750 characters to ensure the message can be sent
        if (failedcommentsstr.length >= 800) chatmsg(steamID, "/pre " + messagestart + "\nc = Comment, p = Proxy\n" + failedcommentsstr.slice(0, 800) + "... \n\n ..." + failedcommentsstr.slice(800, failedcommentsstr.length).split("\n").length + " entries hidden because message would be too long.");
            else chatmsg(steamID, "/pre " + messagestart + "\nc = Comment, p = Proxy\n" + failedcommentsstr);
    })
}


/**
 * Runs the sessions command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.sessions = (chatmsg, steamID, lang) => {
    var mainfile = require("../../main.js")
    var str      = "";

    if (Object.keys(mainfile.activecommentprocess).length > 0) { //Only loop through object if it isn't empty
        let objlength = Object.keys(mainfile.activecommentprocess).length //save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

        Object.keys(mainfile.activecommentprocess).forEach((e, i) => {

            if (Date.now() < mainfile.activecommentprocess[e].until + (config.globalcommentcooldown * 60000)) { //check if entry is not finished yet

                str += `- Status: ${mainfile.activecommentprocess[e].status} | ${mainfile.activecommentprocess[e].amount} comments with ${mainfile.activecommentprocess[e].accounts.length} accounts by ${mainfile.activecommentprocess[e].requestedby} for ${mainfile.activecommentprocess[e].type} ${Object.keys(mainfile.activecommentprocess)[i]}`
            } else {
                delete mainfile.activecommentprocess[e] //remove entry from object if it is finished to keep the object clean
            }

            if (i == objlength - 1) {
                if (Object.keys(mainfile.activecommentprocess).length > 0) { //check if obj is still not empty
                    chatmsg(steamID, lang.sessionscmdmsg.replace("amount", Object.keys(mainfile.activecommentprocess).length) + "\n" + str);
                } else {
                    chatmsg(steamID, lang.sessionscmdnosessions);
                }
            }
        })
    } else {
        chatmsg(steamID, lang.sessionscmdnosessions);
    }
}


/**
 * Runs the mysessions command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {String} steam64id The steam64id of the requesting user
 */
module.exports.mysessions = (chatmsg, steamID, lang, steam64id) => {
    var mainfile = require("../../main.js")
    var str      = ""

    if (Object.keys(mainfile.activecommentprocess).length > 0) { //Only loop through object if it isn't empty
        let objlength = Object.keys(mainfile.activecommentprocess).length //save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

        Object.keys(mainfile.activecommentprocess).forEach((e, i) => {

            if (Date.now() < mainfile.activecommentprocess[e].until + (config.globalcommentcooldown * 60000)) { //check if entry is not finished yet

                if (mainfile.activecommentprocess[e].requestedby == steam64id) str += `- Status: ${mainfile.activecommentprocess[e].status} | ${mainfile.activecommentprocess[e].amount} comments with ${mainfile.activecommentprocess[e].accounts.length} accounts by ${mainfile.activecommentprocess[e].requestedby} for ${mainfile.activecommentprocess[e].type} ${Object.keys(mainfile.activecommentprocess)[i]}`
            } else {
                delete mainfile.activecommentprocess[e] //remove entry from object if it is finished to keep the object clean
            }

            if (i == objlength - 1) {
                if (i == objlength - 1) {
                    if (Object.keys(mainfile.activecommentprocess).length > 0) { //check if obj is still not empty
                        chatmsg(steamID, lang.sessionscmdmsg.replace("amount", Object.keys(mainfile.activecommentprocess).length) + "\n" + str);
                    } else {
                        chatmsg(steamID, lang.mysessionscmdnosessions);
                    }
                }
            }
        })
    } else {
        chatmsg(steamID, lang.mysessionscmdnosessions);
    }
}