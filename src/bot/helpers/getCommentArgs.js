/*
 * File: getCommentArgs.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 11:55:06
 * Author: 3urobeat
 * 
 * Last Modified: 04.03.2022 12:09:03
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamID    = require("steamid");

const controller = require("../../controller/controller.js");
const mainfile   = require("../main.js");


/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param {Array} args The command arguments
 * @param {SteamID} steamID The steamID object of the requesting user
 * @param {String} requesterSteamID The steamID64 of the requesting user
 * @param {Object} lang The language object
 * @param {Function} respond The function to send messages to the requesting user
 * @returns {Object} maxRequestAmount, commentcmdUsage, numberOfComments, profileID, customQuotesArr
 */
module.exports.getCommentArgs = (args, steamID, requesterSteamID, lang, respond) => {
    var maxRequestAmount = config.maxComments; //set to default value and if the requesting user is an owner it gets changed below
    var numberOfComments = 0;
    var profileID        = "";
    var quotesArr        = mainfile.quotes;

    let ownercheck = cachefile.ownerid.includes(requesterSteamID)
    
    
    /* --------- Define command usage messages & maxRequestAmount for each user's privileges --------- */ //Note: Web Comment Requests always use cachefile.ownerid[0]
    if (ownercheck) {
        maxRequestAmount = config.maxOwnerComments

        if (Object.keys(controller.communityobject).length > 1 || maxRequestAmount) var commentcmdUsage = lang.commentcmdusageowner.replace("maxRequestAmount", maxRequestAmount) //typed confog here accidentaly and somehow found that really funny
            else var commentcmdUsage = lang.commentcmdusageowner2
    } else {
        if (Object.keys(controller.communityobject).length > 1 || maxRequestAmount) var commentcmdUsage = lang.commentcmdusage.replace("maxRequestAmount", maxRequestAmount)
            else var commentcmdUsage = lang.commentcmdusage2
    }


    /* --------- Check numberOfComments argument if it was provided --------- */
    if (args[0] !== undefined) {
        if (isNaN(args[0])) { //isn't a number?
            if (args[0].toLowerCase() == "all") {
                args[0] = maxRequestAmount //replace the argument with the max amount of comments this user is allowed to request
            } else {
                logger("debug", `getCommentArgs(): User provided invalid request amount "${args[0]}". Stopping...`)

                respond(400, lang.commentinvalidnumber.replace("commentcmdusage", commentcmdUsage)) 
                return false;
            }
        }

        if (args[0] > maxRequestAmount) { //number is greater than maxRequestAmount?
            logger("debug", `getCommentArgs(): User requested ${args[0]} but is only allowed ${maxRequestAmount} comments. Stopping...`)

            respond(403, lang.commentrequesttoohigh.replace("maxRequestAmount", maxRequestAmount).replace("commentcmdusage", commentcmdUsage)) 
            return false;
        }

        var numberOfComments = args[0]

        /* --------- Check profileid argument if it was provided --------- */
        if (args[1] !== undefined) {
            if (cachefile.ownerid.includes(requesterSteamID) || args[1] == requesterSteamID) { //check if user is a bot owner or if he provided his own profile id
                if (isNaN(args[1])) { respond(400, lang.commentinvalidid.replace("commentcmdusage", commentcmdUsage)); return false; }
                if (new SteamID(args[1]).isValid() == false) { respond(400, lang.commentinvalidid.replace("commentcmdusage", commentcmdUsage)); return false; }

                profileID = args[1];
            } else {
                logger("debug", "getCommentArgs(): Non-Owner tried to provide profileid for another profile. Stopping...")
                
                respond(403, lang.commentprofileidowneronly)
                return false;
            }
        }

        /* --------- Check if custom quotes were provided --------- */
        if (args[2] !== undefined) {
            quotesArr = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); //change default quotes to custom quotes
        }
        
    } //arg[0] if statement ends here


    /* --------- Check if user did not provide numberOfComments --------- */
    if (numberOfComments == 0) { //no numberOfComments given? ask again
        if (Object.keys(controller.botobject).length == 1 && maxRequestAmount == 1) { 
            var numberOfComments = 1 //if only one account is active, set 1 automatically
        } else {
            logger("debug", "getCommentArgs(): User didn't provide numberOfComments and maxRequestAmount is > 1. Stopping...")
            
            respond(400, lang.commentmissingnumberofcomments.replace("maxRequestAmount", maxRequestAmount).replace("commentcmdusage", commentcmdUsage))
            return false;
        } 
    }
    

    /* --------- Log debug values --------- */
    logger("debug", `getCommentArgs() success. maxRequestAmount: ${maxRequestAmount} | numberOfComments: ${numberOfComments} | profileID: ${profileID} | quotesArr.length: ${quotesArr.length} `)

    /* --------- Return calculated values --------- */
    return { maxRequestAmount, numberOfComments, profileID, quotesArr }
}