/*
 * File: getSharedfileArgs.js
 * Project: steam-comment-service-bot
 * Created Date: 28.05.2023 12:18:49
 * Author: 3urobeat
 *
 * Last Modified: 10.09.2023 15:50:59
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
 * Retrieves arguments from a vote request. If request is invalid, an error message will be sent
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Array} args The command arguments
 * @param {string} cmd Either "upvote", "downvote", "favorite" or "unfavorite", depending on which command is calling this function
 * @param {CommandHandler.resInfo} resInfo Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param {function(string): void} respond The shortened respondModule call
 * @returns {Promise.<{ amount: number|string, id: string }>} If the user provided a specific amount, amount will be a number. If user provided "all" or "max", it will be returned as an unmodified string for getVoteBots.js to handle
 */
module.exports.getSharedfileArgs = (commandHandler, args, cmd, resInfo, respond) => {
    return new Promise((resolve) => {
        (async () => { // Lets us use await insidea Promise without creating an antipattern

            // Check for missing params
            let voteCmdUsage = `'${resInfo.cmdprefix}${cmd} amount/"all" id/link'`;

            if (args[0]) args[0] = args[0].toLowerCase();
            if (args[0] == "max") args[0] = "all";                     // Convert "all" alias
            let amount = args[0] == "all" ? args[0] : Number(args[0]); // If user provides "all" then keep it as is and update it later to how many accounts are available, otherwise convert it to a number

            if (args.length == 0 || (amount != "all" && isNaN(amount)) || amount == 0) {
                respond(await commandHandler.data.getLang("invalidnumber", { "cmdusage": voteCmdUsage }, resInfo.userID)); // An empty string will become a 0
                return resolve({});
            }

            // Process input and check if ID is valid
            commandHandler.controller.handleSteamIdResolving(args[1], "sharedfile", async (err, id, idType) => { // eslint-disable-line no-unused-vars

                // Send error if item could not be found
                if (err || !id) {
                    respond(await commandHandler.data.getLang("invalidsharedfileid", { "cmdusage": voteCmdUsage }, resInfo.userID));
                    return resolve({});
                }

                // ...otherwise resolve
                logger("debug", `CommandHandler getSharedfileArgs() success. amount: ${amount} | id: ${id}`);

                resolve({
                    "amountRaw": amount,
                    "id": id
                });

            });

        })();
    });
};