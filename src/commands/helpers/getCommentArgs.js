/*
 * File: getCommentArgs.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-02-28 11:55:06
 * Author: 3urobeat
 *
 * Last Modified: 2023-12-28 21:29:17
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


/**
 * Helper function: Gets the visibility status of a profile and appends it to idType
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {string} steamID64 The steamID64 of the profile to check
 * @param {string} type Type of steamID64, determined by handleSteamIdResolving(). Must be "profile", otherwise callback will be called instantly with this type param, unchanged.
 * @param {function(string): void} callback Called on completion with your new idType
 */
function getVisibilityStatus(commandHandler, steamID64, type, callback) {
    if (steamID64 && type == "profile") {
        logger("debug", `CommandHandler getVisibilityStatus(): Getting visibility status of profile ${steamID64}...`);

        commandHandler.controller.main.community.getSteamUser(new SteamID(steamID64), async (err, user) => {
            if (err || !user || !user.privacyState) {
                logger("warn", `[Main] Failed to check if ${steamID64} is private: ${err}\n       Assuming profile is public and hoping for the best...`); // This can happen sometimes and most of the times commenting will still work

                callback(type + "Public");
            } else {
                logger("debug", "CommandHandler getVisibilityStatus(): Successfully checked privacyState of receiving user: " + user.privacyState);

                callback(type + user.privacyState[0].toUpperCase() + user.privacyState.slice(1)); // Append privacy state to type with the first letter capitalized
            }
        });
    } else {
        logger("debug", `CommandHandler getVisibilityStatus(): Type '${type}' was provided, ignoring request...`);

        callback(type);
    }
}


/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Array} args The command arguments
 * @param {string} requesterID The steamID64 of the requesting user
 * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param {function(string): void} respond The shortened respondModule call
 * @returns {Promise.<{ maxRequestAmount: number, commentcmdUsage: string, numberOfComments: number, profileID: string, idType: string, quotesArr: Array.<string> }>} Resolves promise with object containing all relevant data when done
 */
module.exports.getCommentArgs = (commandHandler, args, requesterID, resInfo, respond) => {
    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            // Get the correct ownerid array for this request
            let owners = commandHandler.data.cachefile.ownerid;
            if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

            let maxRequestAmount = commandHandler.data.config.maxRequests; // Set to default value and if the requesting user is an owner it gets changed below
            let numberOfComments = 0;
            let quotesArr        = commandHandler.data.quotes;

            let profileID;
            let idType = "profile"; // Set profile as default because that makes sense (because it can only be a group/sharedfile/discussion when param was provided yk)


            /* --------- Define command usage messages & maxRequestAmount for each user's privileges --------- */
            let commentcmdUsage;

            if (owners.includes(requesterID)) {
                maxRequestAmount = commandHandler.data.config.maxOwnerRequests;

                if (maxRequestAmount > 1) commentcmdUsage = await commandHandler.data.getLang("commentcmdusageowner", { "cmdprefix": resInfo.cmdprefix }, requesterID);
                    else commentcmdUsage = await commandHandler.data.getLang("commentcmdusageowner2", { "cmdprefix": resInfo.cmdprefix }, requesterID);
            } else {
                if (maxRequestAmount > 1) commentcmdUsage = await commandHandler.data.getLang("commentcmdusage", { "cmdprefix": resInfo.cmdprefix }, requesterID);
                    else commentcmdUsage = await commandHandler.data.getLang("commentcmdusage2", { "cmdprefix": resInfo.cmdprefix }, requesterID);
            }


            /* --------- Check numberOfComments argument if it was provided --------- */
            if (args[0] !== undefined) {
                if (isNaN(args[0])) { // Isn't a number?
                    if (args[0].toLowerCase() == "all" || args[0].toLowerCase() == "max") {
                        args[0] = maxRequestAmount; // Replace the argument with the max amount of comments this user is allowed to request
                    } else {
                        logger("debug", `CommandHandler getCommentArgs(): User provided invalid request amount "${args[0]}". Stopping...`);

                        respond(await commandHandler.data.getLang("invalidnumber", { "cmdusage": commentcmdUsage }, requesterID));
                        return resolve(false);
                    }
                }

                if (args[0] > maxRequestAmount) { // Number is greater than maxRequestAmount?
                    logger("debug", `CommandHandler getCommentArgs(): User requested ${args[0]} but is only allowed ${maxRequestAmount} comments. Stopping...`);

                    respond(await commandHandler.data.getLang("commentrequesttoohigh", { "maxRequestAmount": maxRequestAmount, "commentcmdusage": commentcmdUsage }, requesterID));
                    return resolve(false);
                }

                numberOfComments = args[0];


                /* --------- Check profileid argument if it was provided --------- */
                if (args[1]) {
                    if (owners.includes(requesterID) || args[1] == requesterID) { // Check if user is a bot owner or if they provided their own profile id
                        let arg = args[1];

                        commandHandler.controller.handleSteamIdResolving(arg, null, async (err, res, type) => {
                            if (err) {
                                respond((await commandHandler.data.getLang("commentinvalidid", { "commentcmdusage": commentcmdUsage }, requesterID)) + "\n\nError: " + err);
                                return resolve(false);
                            }

                            // Get profile visibility status if profile. Resolving at the bottom will wait until profileID is set
                            getVisibilityStatus(commandHandler, res, type, (newType) => {
                                profileID = res;     // Will be null on err
                                idType    = newType; // Update idType with what handleSteamIdResolving determined
                            });
                        });

                    } else {
                        logger("debug", "CommandHandler getCommentArgs(): Non-Owner tried to provide profileid for another profile. Stopping...");

                        respond(await commandHandler.data.getLang("commentprofileidowneronly", null, requesterID));
                        return resolve(false);
                    }
                } else {
                    logger("debug", "CommandHandler getCommentArgs(): No profileID parameter received, setting profileID to requesterID...");

                    // Get profile visibility status if profile. Resolving at the bottom will wait until profileID is set
                    getVisibilityStatus(commandHandler, requesterID, "profile", (newType) => {
                        profileID = requesterID; // Will be null on err
                        idType    = newType;     // Update idType with what handleSteamIdResolving determined
                    });
                }


                /* --------- Check if custom quotes were provided --------- */
                if (args[2] !== undefined) {
                    quotesArr = args.slice(2).join(" ").replace(/^\[|\]$/g, "").split(", "); // Change default quotes to custom quotes
                }

            } // Arg[0] if statement ends here


            /* --------- Check if user did not provide numberOfComments --------- */
            if (numberOfComments == 0) { // No numberOfComments given? Ask again if maxRequestAmount > 1 (numberOfComments default value at the top is 0)
                if (commandHandler.controller.getBots().length == 1 && maxRequestAmount == 1) {
                    logger("debug", "CommandHandler getCommentArgs(): User didn't provide numberOfComments but maxRequestAmount is 1. Accepting request as numberOfComments = 1.");

                    numberOfComments = 1;    // If only one account is active, set 1 automatically
                    profileID = requesterID; // Define profileID so that the interval below resolves
                } else {
                    logger("debug", `CommandHandler getCommentArgs(): User didn't provide numberOfComments and maxRequestAmount is ${maxRequestAmount} (> 1). Rejecting request.`);

                    respond(await commandHandler.data.getLang("commentmissingnumberofcomments", { "maxRequestAmount": maxRequestAmount, "commentcmdusage": commentcmdUsage }, requesterID));
                    return resolve(false);
                }
            }


            /* --------- Resolve promise with calculated values when profileID is defined --------- */
            let profileIDDefinedInterval = setInterval(() => { // Check if profileID is defined every 250ms and only then return values
                if (profileID != undefined) {
                    clearInterval(profileIDDefinedInterval);

                    // Log debug values
                    logger("debug", `CommandHandler getCommentArgs() success. maxRequestAmount: ${maxRequestAmount} | numberOfComments: ${numberOfComments} | ID: ${profileID} | idType: ${idType} | quotesArr.length: ${quotesArr.length}`);

                    // Return obj if profileID is not null, otherwise return false as an error has occurred, the user was informed and execution should be stopped
                    if (profileID) resolve({ maxRequestAmount, numberOfComments, profileID, idType, quotesArr });
                        else return resolve(false);
                }
            }, 250);

        })();
    });
};
