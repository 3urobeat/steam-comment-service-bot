/*
 * File: getFollowArgs.js
 * Project: steam-comment-service-bot
 * Created Date: 24.09.2023 16:10:36
 * Author: 3urobeat
 *
 * Last Modified: 26.09.2023 22:14:34
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


/**
 * Retrieves arguments from a follow request. If request is invalid, an error message will be sent
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Array} args The command arguments
 * @param {string} cmd Either "upvote", "downvote", "favorite" or "unfavorite", depending on which command is calling this function
 * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param {function(string): void} respond The shortened respondModule call
 * @returns {Promise.<{ amount: number|string, id: string }>} If the user provided a specific amount, amount will be a number. If user provided "all" or "max", it will be returned as an unmodified string for getVoteBots.js to handle
 */
module.exports.getFollowArgs = (commandHandler, args, cmd, resInfo, respond) => {
    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            // Check for missing params
            let cmdUsage = `'${resInfo.cmdprefix}${cmd} amount/"all" id/link'`;

            if (args[0]) args[0] = args[0].toLowerCase();
            if (args[0] == "max") args[0] = "all";                     // Convert "all" alias
            let amount = args[0] == "all" ? args[0] : Number(args[0]); // If user provides "all" then keep it as is and update it later to how many accounts are available, otherwise convert it to a number

            if (args.length == 0 || (amount != "all" && isNaN(amount)) || amount == 0) {
                respond(await commandHandler.data.getLang("invalidnumber", { "cmdusage": cmdUsage }, resInfo.userID)); // An empty string will become a 0
                return resolve({});
            }


            // Get the correct ownerid array for this request
            let owners = commandHandler.data.cachefile.ownerid;
            if (resInfo.ownerIDs && resInfo.ownerIDs.length > 0) owners = resInfo.ownerIDs;

            let requesterSteamID64 = resInfo.userID;


            // Check if id was provided and process input
            if (args[1]) {
                if (owners.includes(requesterSteamID64) || args[1] == requesterSteamID64) { // Check if user is a bot owner or if they provided their own profile id
                    let arg = args[1];

                    commandHandler.controller.handleSteamIdResolving(arg, null, async (err, res, idType) => {
                        if (err || (idType != "profile" && idType != "curator")) {
                            respond((await commandHandler.data.getLang("invalidprofileid", null, requesterSteamID64)) + "\n\nError: " + err);
                            return resolve({});
                        }

                        logger("debug", `CommandHandler getFollowArgs(): Owner provided valid id - amount: ${amount} | id: ${res} | idType: ${idType}`);

                        resolve({
                            "amountRaw": amount,
                            "id": res,
                            "idType": idType
                        });
                    });

                } else {
                    logger("debug", "CommandHandler getFollowArgs(): Non-Owner tried to provide id for another profile. Stopping...");

                    respond(await commandHandler.data.getLang("commentprofileidowneronly", null, requesterSteamID64));
                    return resolve({});
                }
            } else {
                logger("debug", `CommandHandler getFollowArgs(): No id parameter received, using requesterSteamID64 - amount: ${amount} | id: ${requesterSteamID64} | idType: profile`);

                resolve({
                    "amountRaw": amount,
                    "id": requesterSteamID64,
                    "idType": "profile"
                });
            }

        })();
    });
};