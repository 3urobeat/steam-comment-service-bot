/*
 * File: commentmisc.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 09.03.2022 15:49:30
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamID = require("steamid");

const mainfile               = require("../main.js");
const controller             = require("../../controller/controller.js");
const handleSteamIdResolving = require("../helpers/handleSteamIdResolving.js");


/**
 * Runs the abort command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 * @param {String} steam64id The steam64id of the requesting user
 */
module.exports.abort = (chatmsg, steamID, lang, args, steam64id) => {

    handleSteamIdResolving.run(args[0], null, (err, res) => {
        if (res) {
            if (!cachefile.ownerid.includes(steam64id)) return chatmsg(steamID, lang.commandowneronly)

            steam64id = res //if user provided an id as argument then use that instead of his/her id
        }

        if (!mainfile.activecommentprocess[steam64id] || mainfile.activecommentprocess[steam64id].status != "active") return chatmsg(steamID, lang.abortcmdnoprocess)

        //Set new status for comment process
        mainfile.activecommentprocess[steam64id].status = "aborted"

        //Clear comment interval manually if defined (just check to avoid potential errors)
        if (mainfile.activecommentprocess[steam64id].interval) clearInterval(mainfile.activecommentprocess[steam64id].interval);

        //push a reason for all other comments to failedcomments
        var m = 0;

        for (var l = mainfile.activecommentprocess[steam64id].thisIteration + 1; l <= mainfile.activecommentprocess[steam64id].amount; l++) { //start with l = thisIteration + 1 because humans start counting at 1 (this species confuses me)
            if (m + 1 > Object.keys(controller.communityobject).length) m = 0; //reset variable tracking communityobject index if it is greater than the amount of accounts

            mainfile.failedcomments[steam64id][`c${l}`] = "Skipped because user aborted comment process." //intentionally not including botindex and proxy because accountOrder gets shuffled every botindex reset s it wouldn't be accurate anyway and is also irrelevant if user aborted process
            
            m++
        }

        logger("info", `Aborting comment process for profile/group ${steam64id}...`)
        chatmsg(steamID, lang.abortcmdsuccess)
    })

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

    if (args[0] && args[0] == "global") { //Check if user wants to reset the global cooldown (will reset all until entries in activecommentprocess)
        if (config.botaccountcooldown == 0) return chatmsg(steamID, lang.resetcooldowncmdcooldowndisabled) //is the global cooldown enabled?

        Object.keys(mainfile.activecommentprocess).forEach((e) => {
            mainfile.activecommentprocess[e].until = Date.now() - (config.botaccountcooldown * 60000); //since the cooldown checks will add the cooldown we need to subtract it (can't delete the entry because we might abort running processes with it)
        })

        chatmsg(steamID, lang.resetcooldowncmdglobalreset) 
    } else {
        handleSteamIdResolving.run(args[0], SteamID.Type.INDIVIDUAL, (err, res) => {
            if (err) return chatmsg(steamID, lang.invalidprofileid + "\n\nError: " + err);
            if (res) steam64id = res //change steam64id to the provided id
    
            if (config.commentcooldown == 0) return chatmsg(steamID, lang.resetcooldowncmdcooldowndisabled) //is the cooldown enabled?
    
            controller.lastcomment.update({ id: steam64id }, { $set: { time: Date.now() - (config.commentcooldown * 60000) } }, (err) => { 
                if (err) return chatmsg(steamID, "Error updating database entry: " + err)
                    else chatmsg(steamID, lang.resetcooldowncmdsuccess.replace("profileid", steam64id.toString())) 
            })
        })
    }
}


/**
 * Runs the failed command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 * @param {String} steam64id The steam64id of the requesting user
 */
module.exports.failed = (chatmsg, steamID, lang, args, steam64id) => {

    handleSteamIdResolving.run(args[0], null, (err, res) => {
        if (res) {
            if (!cachefile.ownerid.includes(steam64id)) return chatmsg(steamID, lang.commandowneronly)

            steam64id = res //if user provided an id as argument then use that instead of his/her id
        }

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
    })
}


/**
 * Runs the sessions command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.sessions = (chatmsg, steamID, lang) => {
    var str = "";

    if (Object.keys(mainfile.activecommentprocess).length > 0) { //Only loop through object if it isn't empty
        let objlength = Object.keys(mainfile.activecommentprocess).length //save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

        Object.keys(mainfile.activecommentprocess).forEach((e, i) => {

            if (Date.now() < mainfile.activecommentprocess[e].until + (config.botaccountcooldown * 60000)) { //check if entry is not finished yet

                str += `- Status: ${mainfile.activecommentprocess[e].status} | ${mainfile.activecommentprocess[e].amount} comments with ${mainfile.activecommentprocess[e].accounts.length} accounts by ${mainfile.activecommentprocess[e].requestedby} for ${mainfile.activecommentprocess[e].type} ${Object.keys(mainfile.activecommentprocess)[i]}\n`
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
    var str = ""

    if (Object.keys(mainfile.activecommentprocess).length > 0) { //Only loop through object if it isn't empty
        let objlength = Object.keys(mainfile.activecommentprocess).length //save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

        Object.keys(mainfile.activecommentprocess).forEach((e, i) => {

            if (Date.now() < mainfile.activecommentprocess[e].until + (config.botaccountcooldown * 60000)) { //check if entry is not finished yet

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