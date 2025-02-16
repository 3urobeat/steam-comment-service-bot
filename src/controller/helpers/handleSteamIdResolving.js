/*
 * File: handleSteamIdResolving.js
 * Project: steam-comment-service-bot
 * Created Date: 2022-03-09 12:58:17
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-16 15:55:33
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID         = require("steamid");
const steamIDResolver = require("steamid-resolver");

const Controller = require("../controller.js");


/**
 * ID types supported by this resolver
 * @enum {EIdTypes}
 */
const EIdTypes = {
    "profile": "profile",
    "group": "group",
    "sharedfile": "sharedfile",
    "discussion": "discussion",
    "curator": "curator",
    "review": "review"
};

module.exports = EIdTypes;


/**
 * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
 * Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.
 * @param {string} str The profileID argument provided by the user. If `null` the function will instantly callback with `null`.
 * @param {EIdTypes} expectedIdType The type of SteamID expected or `null` if type should be assumed.
 * @param {function((string|null), (string|null), (EIdTypes|null)): void} callback
 * Called with `err` (String or null), `id` (String or null), `idType` (String or null) parameters on completion. The `id` param has the format `userID/appID` for type review and full input url for type discussion.
 */
Controller.prototype.handleSteamIdResolving = (str, expectedIdType, callback) => {

    // Instantly callback nothing if nothing was provided
    if (!str) return callback(null, null, null);

    // Check for invalid type. Explicitly check for null
    if (expectedIdType !== null && !EIdTypes[expectedIdType]) return callback(new Error("Unsupported expectedIdType, must be one of these: " + Object.values(EIdTypes).join(", ")), null, null);

    let idType;

    // Function to handle steamIDResolver callbacks as they are always roughly the same. Only call for profile & group!
    function handleResponse(err, res) { //eslint-disable-line
        logger("debug", `handleSteamIdResolving: handleResponse(): Received resolving result. err: ${err} | res: ${res}`);

        // Check if resolving failed
        if (err) return callback(err, null, null);

        // Quickly determine type if not already done. We know that the ID here must be valid and of type profile or group as sharedfile is recognized as invalid by SteamID
        if (!idType) idType = new SteamID(res).type == SteamID.Type.INDIVIDUAL ? "profile" : "group";

        // Quickly check if the response has the expected type
        if (expectedIdType && idType != expectedIdType) callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
            else callback(null, res, idType);
    }

    // Try to figure out if user provided an steamID64 or a customURL or a whole profile link
    if (isNaN(str) || !new SteamID(str).isValid()) { // If not a number or invalid SteamID. Note: Sharedfile IDs are considered invalid.
        if (/steamcommunity.com\/.+\/recommended\/\d+/g.test(str)) { // This check *must* run before the /id/ & /profiles/ checks below because they would always trigger. The URLs start the same, with reviews having /recommended/ at the end
            const strArr = str.split("/");

            // Update idType
            idType = "review";

            if (expectedIdType && idType != expectedIdType) return callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);

            // Find out if we need to resolve the userID
            if (str.includes("steamcommunity.com/id/")) {
                logger("debug", "handleSteamIdResolving: User provided review link with customURL...");

                const customURL = strArr[strArr.findIndex((e) => e == "id") + 1]; // Find customURL by searching for id and going to the next element
                const appID     = strArr[strArr.findIndex((e) => e == "recommended") + 1];

                // Resolve customURL and replace /id/customURL with /profiles/steamID64
                steamIDResolver.customUrlToSteamID64(customURL, (err, res) => {
                    if (err) return callback(err, null, null);

                    callback(null, res + "/" + appID, idType);
                });
            } else {
                logger("debug", "handleSteamIdResolving: User provided review link with steamID64...");

                const userID = strArr[strArr.findIndex((e) => e == "profiles") + 1];
                const appID  = strArr[strArr.findIndex((e) => e == "recommended") + 1];

                callback(null, userID + "/" + appID, idType); // Instantly callback input
            }

        } else if (str.includes("steamcommunity.com/id/")) {
            logger("debug", "handleSteamIdResolving: User provided customURL profile link...");

            steamIDResolver.customUrlToSteamID64(str, handleResponse);

        } else if (str.includes("steamcommunity.com/profiles/")) {
            logger("debug", "handleSteamIdResolving: User provided steamID64 profile link...");

            // My library doesn't have a check if exists function nor returns the steamID64 if I pass it into steamID64ToCustomUrl(). But since I don't want to parse the URL myself here I'm just gonna request the full obj and cut the id out of it
            steamIDResolver.steamID64ToFullInfo(str, (err, obj) => handleResponse(err, obj.steamID64[0]));

        } else if (str.includes("steamcommunity.com/discussions/forum") || /steamcommunity.com\/app\/.+\/discussions/g.test(str) || /steamcommunity.com\/groups\/.+\/discussions/g.test(str) || /steamcommunity.com\/app\/.+\/eventcomments/g.test(str)) {
            logger("debug", "handleSteamIdResolving: User provided discussion link...");

            idType = "discussion";

            if (expectedIdType && idType != expectedIdType) callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
                else callback(null, str, idType);

        } else if (str.includes("steamcommunity.com/groups/")) { // Must be below the discussion check because of the "groups/abc/discussion" regex above
            logger("debug", "handleSteamIdResolving: User provided group link...");

            steamIDResolver.groupUrlToGroupID64(str, handleResponse);

        } else if (str.includes("steamcommunity.com/sharedfiles/filedetails/?id=")) {
            logger("debug", "handleSteamIdResolving: User provided sharedfile link...");

            // Check if ID is valid
            steamIDResolver.isValidSharedfileID(str, (err, res) => {
                if (err) return callback(err, null, null);
                if (!res) return callback("The specified sharedfile could not be found", null, null);

                // Cut domain away
                const split = str.split("/");
                if (split[split.length - 1] == "") split.pop(); // Remove trailing slash (which is now a space because of split("/"))

                str = split[split.length - 1].replace("?id=", "");

                // Update idType
                idType = "sharedfile";

                if (expectedIdType && idType != expectedIdType) callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
                    else callback(null, str, idType);
            });

        } else if (str.includes("store.steampowered.com/curator/") || str.includes("store.steampowered.com/developer/") || str.includes("store.steampowered.com/publisher/")) { // Apparently developer & publisher are also curators (https://github.com/3urobeat/steam-comment-service-bot/issues/266)
            logger("debug", "handleSteamIdResolving: User provided curator link, resolving clanid from curator webpage...");

            // Update idType and instantly abort if it doesn't match expectations
            idType = "curator";

            if (expectedIdType && idType != expectedIdType) {
                callback(`Received steamID of type ${idType} but expected ${expectedIdType}.`, null, null);
                return;
            }

            // Resolve clanid from curator webpage
            let output = "";

            require("https").get(str, (res) => {
                res.setEncoding("utf8");

                res.on("data", function (chunk) {
                    output += chunk;
                });

                res.on("end", () => {
                    try {
                        // Load result into cheerio
                        const $ = require("cheerio").load(output);

                        // Find follow_btn div child which has an id starting with "CuratorFollowBtn"
                        const CuratorFollowBtn = $(".follow_controls > .follow_btn [id^=\"CuratorFollowBtn\"]").attr("id");

                        if (!CuratorFollowBtn) return callback("Couldn't find follow button on curator page!", null, idType);

                        // Get the clanid from the follow button container id after an underscore: "CuratorFollowBtn_26299579"
                        callback(null, CuratorFollowBtn.split("_")[1], idType);
                    } catch (err) {
                        logger("error", "Failed to get clanid from curator page: " + err);
                        callback("Failed to get clanid from curator page!", null, idType);
                        return;
                    }
                });
            });

        } else { // Doesn't seem to be an URL. We can ignore discussions & reviews as we need expect the user to provide the full URL.

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
                                            const split = str.split("/");
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
