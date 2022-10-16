/*
 * File: getCommentArgs.js
 * Project: steam-comment-service-bot
 * Created Date: 28.02.2022 11:55:06
 * Author: 3urobeat
 *
 * Last Modified: 09.03.2022 13:46:43
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const controller = require("../../controller/controller.js");
const mainfile   = require("../main.js");


/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param {Array} args The command arguments
 * @param {SteamID} steamID The steamID object of the requesting user
 * @param {String} requesterSteamID The steamID64 of the requesting user
 * @param {SteamID.Type} profileIDType The type of SteamID expected for profileID parameter (https://github.com/DoctorMcKay/node-steamid#types)
 * @param {Object} lang The language object
 * @param {Function} respond The function to send messages to the requesting user
 * @returns {Object} maxRequestAmount, commentcmdUsage, numberOfComments, profileID, customQuotesArr
 */
module.exports.getCommentArgs = (args, steamID, requesterSteamID, profileIDType, lang, respond) => {
    // Lets create a promise to be able to use await in calling function to make sure profileID callbacks finished before continuing
    return new Promise((resolve) => {

        var maxRequestAmount = config.maxComments; // Set to default value and if the requesting user is an owner it gets changed below
        var numberOfComments = 0;
        var quotesArr        = mainfile.quotes;

        var profileID;

        let ownercheck = cachefile.ownerid.includes(requesterSteamID);


        /* --------- Define command usage messages & maxRequestAmount for each user's privileges --------- */ // Note: Web Comment Requests always use cachefile.ownerid[0]
        if (ownercheck) {
            maxRequestAmount = config.maxOwnerComments;

            if (Object.keys(controller.communityobject).length > 1 || maxRequestAmount) var commentcmdUsage = lang.commentcmdusageowner.replace("maxRequestAmount", maxRequestAmount); // Typed confog here accidentaly and somehow found that really funny
                else var commentcmdUsage = lang.commentcmdusageowner2;
        } else {
            if (Object.keys(controller.communityobject).length > 1 || maxRequestAmount) var commentcmdUsage = lang.commentcmdusage.replace("maxRequestAmount", maxRequestAmount);
                else var commentcmdUsage = lang.commentcmdusage2;
        }


        /* --------- Check numberOfComments argument if it was provided --------- */
        if (args[0] !== undefined) {
            if (isNaN(args[0])) { // Isn't a number?
                if (args[0].toLowerCase() == "all") {
                    args[0] = maxRequestAmount; // Replace the argument with the max amount of comments this user is allowed to request
                } else {
                    logger("debug", `getCommentArgs(): User provided invalid request amount "${args[0]}". Stopping...`);

                    respond(400, lang.commentinvalidnumber.replace("commentcmdusage", commentcmdUsage));
                    resolve(false);
                }
            }

            if (args[0] > maxRequestAmount) { // Number is greater than maxRequestAmount?
                logger("debug", `getCommentArgs(): User requested ${args[0]} but is only allowed ${maxRequestAmount} comments. Stopping...`);

                respond(403, lang.commentrequesttoohigh.replace("maxRequestAmount", maxRequestAmount).replace("commentcmdusage", commentcmdUsage));
                resolve(false);
            }

            var numberOfComments = args[0];


            /* --------- Check profileid argument if it was provided --------- */
            if (args[1]) {
                if (cachefile.ownerid.includes(requesterSteamID) || args[1] == requesterSteamID) { // Check if user is a bot owner or if he provided his own profile id
                    let arg = args[1];

                    require("../helpers/handleSteamIdResolving.js").run(arg, profileIDType, (err, res) => {
                        if (err) respond(400, lang.commentinvalidid.replace("commentcmdusage", commentcmdUsage) + "\n\nError: " + err);

                        profileID = res; // Will be null on err
                    });

                } else {
                    logger("debug", "getCommentArgs(): Non-Owner tried to provide profileid for another profile. Stopping...");

                    profileID = null;
                    respond(403, lang.commentprofileidowneronly);
                }
            } else {
                logger("debug", "getCommentArgs(): No profileID parameter recieved, setting profileID to requesterSteamID...");

                profileID = requesterSteamID;
            }


            /* --------- Check if custom quotes were provided --------- */
            if (args[2] !== undefined) {
                quotesArr = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); // Change default quotes to custom quotes
            }

        } // Arg[0] if statement ends here


        /* --------- Check if user did not provide numberOfComments --------- */
        if (numberOfComments == 0) { // No numberOfComments given? ask again
            if (Object.keys(controller.botobject).length == 1 && maxRequestAmount == 1) {
                var numberOfComments = 1; // If only one account is active, set 1 automatically
            } else {
                logger("debug", "getCommentArgs(): User didn't provide numberOfComments and maxRequestAmount is > 1. Stopping...");

                respond(400, lang.commentmissingnumberofcomments.replace("maxRequestAmount", maxRequestAmount).replace("commentcmdusage", commentcmdUsage));
                resolve(false);
            }
        }


        /* --------- Resolve promise with calculated values when profileID is defined --------- */
        var profileIDDefinedInterval = setInterval(() => { // Check if profileID is defined every 250ms and only then return values
            if (profileID != undefined) {
                clearInterval(profileIDDefinedInterval);

                // Log debug values
                logger("debug", `getCommentArgs() success. maxRequestAmount: ${maxRequestAmount} | numberOfComments: ${numberOfComments} | profileID: ${profileID} | quotesArr.length: ${quotesArr.length}`);

                // Return obj if profileID is not null, otherwise return false as an error has ocurred, the user was informed and execution should be stopped
                if (profileID) resolve({ maxRequestAmount, numberOfComments, profileID, quotesArr });
                    else resolve(false);
            }
        }, 250);
    });
};