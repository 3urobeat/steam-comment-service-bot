/*
 * File: getVoteArgs.js
 * Project: steam-comment-service-bot
 * Created Date: 28.05.2023 12:18:49
 * Author: 3urobeat
 *
 * Last Modified: 31.05.2023 16:09:52
 * Modified By: 3urobeat
 *
 * Copyright (c) 2023 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const CommandHandler = require("../commandHandler.js"); // eslint-disable-line


/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param {CommandHandler} commandHandler The commandHandler object
 * @param {Array} args The command arguments
 * @param {Function} respond The function to send messages to the requesting user
 * @returns {Promise.<{ amount: number|string, id: string }>} If the user provided a specific amount, amount will be a number. If user provided "all" or "max", it will be returned as an unmodified string for getVoteBots.js to handle
 */
module.exports.getVoteArgs = (commandHandler, args, respond) => {
    return new Promise((resolve) => {
        (async () => { // Lets us use await inside a Promise without creating an antipattern

            // Check for missing params
            let voteCmdUsage = "'!upvote amount/\"all\" id/link'";

            if (args[0]) args[0] = args[0].toLowerCase();
            if (args[0] == "max") args[0] = "all";                     // Convert "all" alias
            let amount = args[0] == "all" ? args[0] : Number(args[0]); // If user provides "all" then keep it as is and update it later to how many accounts are available, otherwise convert it to a number

            if (args.length == 0 || (amount != "all" && isNaN(amount)) || amount == 0) {
                respond(commandHandler.data.lang.voteinvalidnumber.replace("votecmdusage", voteCmdUsage)); // An empty string will become a 0
                return resolve({});
            }


            // Process input and check if ID is valid
            commandHandler.controller.handleSteamIdResolving(args[1], "sharedfile", (err, id, idType) => { // eslint-disable-line no-unused-vars

                // Send error if item could not be found
                if (err || !id) {
                    respond(commandHandler.data.lang.voteinvalidid.replace("votecmdusage", voteCmdUsage));
                    return resolve({});
                }

                // ...otherwise resolve
                logger("debug", `CommandHandler getVoteArgs() success. amount: ${amount} | id: ${id}`);

                resolve({
                    "amountRaw": amount,
                    "id": id
                });

            });

        })();
    });
};