/*
 * File: getAccountOrder.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 12:37:38
 * Author: 3urobeat
 * 
 * Last Modified: 03.03.2022 17:51:33
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

/**
 * Arranges account order and checks if user is friend with limited accounts
 * @param {Boolean} checkLimitedFriend Set to true to check if recieverSteamID is friend with bot accounts (set to false for example when recieverSteamID is a group)
 * @param {Array} allAccounts Array of all bot accounts
 * @param {Number} accountsNeeded Amount of bot accounts needed for the request
 * @param {Number} numberOfComments The amount of comments requested
 * @param {SteamID} requesterSteamID The steamID object of the requesting user
 * @param {SteamID} recieverSteamID The steamID object of the recieving user/group
 * @param {Object} lang The language object
 * @param {Function} respond The function to send messages to the requesting user
 */
module.exports.getAccountOrder = (checkLimitedFriend, allAccounts, accountsNeeded, numberOfComments, requesterSteamID, recieverSteamID, lang, respond) => {
    var accsToAdd = [];

    var accountOrder = [ ... allAccounts ]
    if (config.randomizeAccounts) accountOrder.sort(() => Math.random() - 0.5); //randomize order if enabled in config

    //Remove accounts that are not needed in this request
    accountOrder = accountOrder.slice(0, accountsNeeded);

    //Check all accounts if they are limited and send user profile links if not friend
    if (checkLimitedFriend) {
        accsToAdd[requesterSteamID] = []

        for (let i in accountOrder) {       
            if (Number(i) + 1 <= numberOfComments && Number(i) + 1 <= Object.keys(controller.botobject).length) { //only check if this acc is needed for a comment
                try {
                    //if bot account limitations can be read from obj and bot account is limited and hasn't target account in friend list
                    if (controller.botobject[accountOrder[i]].limitations && controller.botobject[accountOrder[i]].limitations.limited == true && !Object.keys(controller.botobject[accountOrder[i]].myFriends).includes(recieverSteamID)) {
                        accsToAdd[requesterSteamID].push(`\n ' https://steamcommunity.com/profiles/${new SteamID(String(controller.botobject[accountOrder[i]].steamID)).getSteamID64()} '`) //...then push profile URL into array
                    }
                } catch (err) {
                    logger("error", "Error checking if comment requester is friend with limited bot accounts: " + err) //This error check was implemented as a temporary solution to fix this error (and should be fine since it seems that this error is rare and at least prevents from crashing the bot): https://github.com/HerrEurobeat/steam-comment-service-bot/issues/54
                }
            } 

            //if all accounts needed for this request are processed and at least one account to add was found
            if (Number(i) + 1 == numberOfComments && accsToAdd[requesterSteamID].length > 0 || Number(i) + 1 == Object.keys(controller.botobject).length && accsToAdd[requesterSteamID].length > 0) {
                logger("debug", `getAccountOrder(): User needs to add ${accsToAdd.length} accounts before I am able to comment.`)

                respond(403, lang.commentaddbotaccounts.replace("numberOfComments", numberOfComments) + "\n" + accsToAdd[requesterSteamID]) //send message
                return false; //stop right here criminal
            }
        }
    }

    //Log debug values
    logger("debug", "getAccountOrder() success. accountOrder: " + accountOrder)

    //Return value
    return accountOrder;
}