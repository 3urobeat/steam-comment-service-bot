/*
 * File: checkCooldown.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 11:06:57
 * Author: 3urobeat
 * 
 * Last Modified: 10.03.2022 14:25:22
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamID    = require("steamid"); //eslint-disable-line

const controller = require("../../controller/controller.js");
const mainfile   = require("../main.js");
const round      = require("../../controller/helpers/round.js");


/**
 * Checks for user cooldown, bot cooldown, calculates amount of accounts needed for a request and responds to the user if request is invalid
 * @param {SteamID} recieverSteamID The steamID object of the recieving user
 * @param {Number} numberOfComments The amount of comments requested
 * @param {Boolean} removeLimitedAccs Set to true to remove all limited bot accounts from available accounts list (for example for group comment cmd, as only unlimited accs can comment in groups)
 * @param {Object} lang The language object
 * @param {*} res The res parameter if request is coming from the webserver, otherwise null
 * @param {Object} lastcommentdoc The lastcomment db document of the requesting user
 * @param {Function} respond The function to send messages to the requesting user
 * @returns {Object} allAccounts, accountsNeeded
 */
module.exports.checkAvailability = (recieverSteamID, numberOfComments, removeLimitedAccs, lang, res, lastcommentdoc, respond) => {
    
    /* ------------------ Check for cooldowns ------------------ */
    if (config.commentcooldown !== 0 && !res) { //check for user specific cooldown (ignore if it is a webrequest)
        
        if ((Date.now() - lastcommentdoc.time) < (config.commentcooldown * 60000)) { //check if user has cooldown applied
            var remainingcooldown = Math.abs(((Date.now() - lastcommentdoc.time) / 1000) - (config.commentcooldown * 60))
            var remainingcooldownunit = "seconds"
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "minutes" }
            if (remainingcooldown > 120) { var remainingcooldown = remainingcooldown / 60; var remainingcooldownunit = "hours" }

            //send error message and stop execution
            logger("debug", "checkAvailability(): User has cooldown. Stopping...")

            respond(403, lang.commentuseroncooldown.replace("commentcooldown", config.commentcooldown).replace("remainingcooldown", round(remainingcooldown, 2)).replace("timeunit", remainingcooldownunit))
            return false;
        } else {
            //is the profile already recieving comments?
            if (mainfile.activecommentprocess[recieverSteamID] && mainfile.activecommentprocess[recieverSteamID].status == "active") {
                logger("debug", "checkAvailability(): Profile is already recieving comments. Stopping...")

                respond(403, lang.commentuseralreadyrecieving)
                return false;
            }
        }
    }


    /* --------- Calculate the amount of accounts needed for this request ---------  */
    //Method 1: Use as many accounts as possible to maximise the spread (Default)
    if (numberOfComments <= Object.keys(controller.communityobject).length) var accountsNeeded = numberOfComments
        else var accountsNeeded = Object.keys(controller.communityobject).length //cap accountsNeeded at amount of accounts because if numberOfComments is greater we will start at account 1 again

    //Method 2: Use as few accounts as possible to maximise the amount of parallel requests (Not implemented yet, probably coming in 2.12)


    /* --------- Check if enough bot accounts are available for this rerquest --------- */
    logger("info", `Checking for available bot accounts for this request...`, false, false, logger.animation("loading"))

    //Sort activecommentprocess obj by highest until value, decreasing, so that we can tell the user how long he/she has to wait if not enough accounts were found
    let sortedvals = Object.keys(mainfile.activecommentprocess).sort((a, b) => {
        return mainfile.activecommentprocess[b].until - mainfile.activecommentprocess[a].until;
    })
    
    if (sortedvals.length > 0) mainfile.activecommentprocess = Object.assign(...sortedvals.map(k => ( {[k]: mainfile.activecommentprocess[k] } ) )) //map sortedvals back to object if array is not empty - credit: https://www.geeksforgeeks.org/how-to-create-an-object-from-two-arrays-in-javascript/


    var whenavailable; //we will save the until value of the activecommentprocess entry that the user has to wait for here
    var allAccounts = [ ... Object.keys(controller.communityobject) ] //clone keys array of communityobject
    
    //loop over activecommentprocess obj and remove all valid entries from allAccounts array if object is not empty
    if (Object.keys(mainfile.activecommentprocess).length > 0) {
        Object.keys(mainfile.activecommentprocess).forEach((e) => { 

            if (Date.now() < mainfile.activecommentprocess[e].until + (config.botaccountcooldown * 60000)) { //check if entry is not finished yet

                mainfile.activecommentprocess[e].accounts.forEach((f) => { //loop over every account used in this request
                    allAccounts.splice(allAccounts.indexOf(f), 1) //remove that accountindex from the allAccounts array
                })

                if (allAccounts.length - mainfile.activecommentprocess[e].accounts.length < numberOfComments) {
                    whenavailable = mainfile.activecommentprocess[e].until + (config.botaccountcooldown * 60000)
                }
            } else {
                delete mainfile.activecommentprocess[e] //remove entry from object if it is finished to keep the object clean
            }
        })
    }


    //Remove limited accounts from allAccounts array if desired
    if (removeLimitedAccs) {
        let previousLength = allAccounts.length;
        allAccounts = allAccounts.filter(e => controller.botobject[e].limitations && !controller.botobject[e].limitations.limited);

        if (previousLength - allAccounts.length > 0) logger("info", `${previousLength - allAccounts.length} of ${previousLength} were removed from available accounts as they are limited and can't be used for this request!`)

        //Check if all accounts that were previously available are now removed and send custom error message
        if (previousLength != 0 && allAccounts.length < accountsNeeded) { respond(403, lang.commentaccslimitedremoved.replace("maxComments", allAccounts.length)); return false; } //using allAccounts.length works for the "spread requests on as many accounts as possible" method
    }


    //if not enough accounts are available respond with error message
    if (allAccounts.length < accountsNeeded) {
        //Calculate how far away whenavailable is from Date.now()
        var remaining     = Math.abs((whenavailable - Date.now()) / 1000)
        var remainingunit = "seconds"
        if (remaining > 120) { var remaining = remaining / 60; var remainingunit = "minutes" }
        if (remaining > 120) { var remaining = remaining / 60; var remainingunit = "hours" }

        //Respond with note about how many comments can be requested right now if more than 0 accounts are available
        if (allAccounts.length > 0) respond(500, lang.commentnotenoughavailableaccs.replace("waittime", round(remaining, 2)).replace("timeunit", remainingunit).replace("availablenow", allAccounts.length)) //using allAccounts.length works for the "spread requests on as many accounts as possible" method
            else respond(500, lang.commentzeroavailableaccs.replace("waittime", round(remaining, 2)).replace("timeunit", remainingunit))
        
        logger("info", `Found only ${allAccounts.length} available account(s) but ${accountsNeeded} account(s) are needed to send ${numberOfComments} comments.`)
        return false;
    } else {
        logger("info", `Found ${allAccounts.length} available account(s)!`)
    }
    
    //Log debug values
    logger("debug", `checkAvailability() success. allAccounts: ${allAccounts} | accountsNeeded: ${accountsNeeded}`)

    //Return values
    return { allAccounts, accountsNeeded };
}