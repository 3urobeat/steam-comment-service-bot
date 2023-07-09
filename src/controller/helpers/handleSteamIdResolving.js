/*
 * File: handleSteamIdResolving.js
 * Project: steam-comment-service-bot
 * Created Date: 09.03.2022 12:58:17
 * Author: 3urobeat
 *
 * Last Modified: 08.07.2023 00:36:23
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID         = require("steamid");
const steamIDResolver = require("steamid-resolver");

const Controller = require("../controller.js");


// Note: I tried extending the SteamID Type enum to support sharedfiles but that didn't work out because of TypeScript reasons.
// I'm therefore taking Strings instead of SteamID.Type values for types now.

/**
 * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation
 * @param {string} str The profileID argument provided by the user
 * @param {string} expectedIdType The type of SteamID expected ("profile", "group" or "sharedfile") or `null` if type should be assumed.
 * @param {function(string|null, string|null, string|null): void} callback Called with `err` (String or null), `steamID64` (String or null), `idType` (String or null) parameters on completion
 */
Controller.prototype.handleSteamIdResolving = (str, expectedIdType, callback) => {

    // Instantly callback nothing if nothing was provided
    if (!str) return callback(null, null);

    // "profile", "group" or "sharedfile" - Is populated before making callback
    let idType;

    // Function to handle steamIDResolver callbacks as they are always roughly the same. Only call for profile & group!
    function handleResponse(err, res) { //eslint-disable-line
        logger("debug", `handleSteamIdResolving: handleResponse(): Received callback from steamid-resolver. err: ${err} | res: ${res}`);

        // Check if resolving failed
        if (err) return callback(err, null, null);

        // Quickly determine type. We know that the ID here must be valid and of type profile or group as sharedfile is recognized as invalid by SteamID
        idType = new SteamID(res).type == SteamID.Type.INDIVIDUAL ? "profile" : "group";

        // Quickly check if the response has the expected type
        if (expectedIdType && idType != expectedIdType) callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
            else callback(null, res, idType);
    }

    // Try to figure out if user provided an steamID64 or a customURL or a whole profile link
    if (isNaN(str) || !new SteamID(str).isValid()) { // If not a number or invalid SteamID. Note: Sharedfile IDs are considered invalid.
        if (str.includes("steamcommunity.com/id/")) {
            logger("debug", "handleSteamIdResolving: User provided customURL profile link...");

            steamIDResolver.customUrlToSteamID64(str, handleResponse);

        } else if (str.includes("steamcommunity.com/profiles/")) {
            logger("debug", "handleSteamIdResolving: User provided steamID64 profile link...");

            // My library doesn't have a check if exists function nor returns the steamID64 if I pass it into steamID64ToCustomUrl(). But since I don't want to parse the URL myself here I'm just gonna request the full obj and cut the id out of it
            steamIDResolver.steamID64ToFullInfo(str, (err, obj) => handleResponse(err, obj.steamID64[0]));

        } else if (str.includes("steamcommunity.com/groups/")) {
            logger("debug", "handleSteamIdResolving: User provided group link...");

            steamIDResolver.groupUrlToGroupID64(str, handleResponse);

        } else if (str.includes("steamcommunity.com/sharedfiles/filedetails/?id=")) {
            logger("debug", "handleSteamIdResolving: User provided sharedfile link...");

            // Check if ID is valid
            steamIDResolver.isValidSharedfileID(str, (err, res) => {
                if (err) return callback(err, null, null);
                if (!res) return callback("The specified sharedfile could not be found", null, null);

                // Cut domain away
                let split = str.split("/");
                if (split[split.length - 1] == "") split.pop(); // Remove trailing slash (which is now a space because of split("/"))

                str = split[split.length - 1].replace("?id=", "");

                // Update idType
                idType = "sharedfile";

                if (expectedIdType && idType != expectedIdType) callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
                    else callback(null, str, idType);
            });

        } else { // Doesn't seem to be an URL

            // If user just provided the customURL part of the URL then try and figure out from the expected expectedIdType if this could be a profile or group customURL
            if (expectedIdType == "profile") {
                logger("debug", "handleSteamIdResolving: No URL but expecting profile vanity based on expectedIdType...");

                steamIDResolver.customUrlToSteamID64(str, handleResponse);

            } else if (expectedIdType == "group") {
                logger("debug", "handleSteamIdResolving: No URL but expecting group vanity based on expectedIdType...");

                steamIDResolver.groupUrlToGroupID64(str, handleResponse);

            } else if (expectedIdType == "sharedfile") {
                logger("debug", "handleSteamIdResolving: No URL but expecting sharedfileID based on expectedIdType...");

                // Check if ID is valid
                steamIDResolver.isValidSharedfileID(str, (err, res) => {
                    if (err) return callback(err, null, null);
                    if (!res) return callback("The specified sharedfile could not be found.", null, null);

                    // Update idType
                    idType = "sharedfile";

                    callback(null, str, idType); // No need to check for expectedIdType here
                });

            } else {

                // ProfileIDType is null, we need to try and figure out what might have been provided
                logger("debug", "handleSteamIdResolving: expectedIdType is null. Trying to figure out what has been provided...");

                steamIDResolver.customUrlToSteamID64(str, (err, steamID64) => { // Check profile first, as it will probably be used more often
                    if (err) {
                        logger("debug", "handleSteamIdResolving: profile id check returned an error. Trying group id check...");

                        steamIDResolver.groupUrlToGroupID64(str, (err, groupID) => {
                            if (err) {
                                logger("debug", "handleSteamIdResolving: group id check returned an error. Trying sharedfile id check...");

                                steamIDResolver.isValidSharedfileID(str, (err, isValid) => {
                                    if (err || !isValid) {
                                        logger("debug", "handleSteamIdResolving: sharedfile id check also returned an error! Resolving with error as something unknown was provided: " + str);
                                        handleResponse("ID parameter seems to be invalid.", null);

                                    } else {

                                        logger("debug", "handleSteamIdResolving: the provided id seems to be a sharedfile id! Returning sharedfileID...");

                                        if (str.includes("steamcommunity.com/")) { // Check if full URL was provided and cut domain away
                                            let split = str.split("/");
                                            if (split[split.length - 1] == "") split.pop(); // Remove trailing slash (which is now a space because of split("/"))

                                            str = split[split.length - 1].replace("?id=", "");
                                        }

                                        // Update idType
                                        idType = "sharedfile";

                                        callback(null, str, idType); // No need to check for expectedIdType here as it must be null/invalid
                                    }
                                });

                            } else {
                                logger("debug", "handleSteamIdResolving: the provided id seems to be a group id! Returning groupID...");
                                handleResponse(null, groupID);
                            }
                        });

                    } else {
                        logger("debug", "handleSteamIdResolving: the provided id seems to be a profile id! Returning steamID64...");
                        handleResponse(null, steamID64);
                    }
                });
            }
        }

    } else {

        logger("debug", "handleSteamIdResolving: I don't need to convert anything as user seems to have already provided an steamID64. Cool!");

        // Quickly determine type. We know that the ID here must be valid and of type profile or group as sharedfile is recognized as invalid by SteamID
        idType = new SteamID(str).type == SteamID.Type.INDIVIDUAL ? "profile" : "group";

        if (expectedIdType && idType != expectedIdType) handleResponse(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
            else handleResponse(null, str, idType);
    }

};