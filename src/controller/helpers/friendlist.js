/*
 * File: friendlist.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-05-08 21:33:43
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const SteamID = require("steamid");

const Controller = require("../../controller/controller.js");
const Bot        = require("../../bot/bot.js"); // eslint-disable-line


/**
 * Check if all friends are in lastcomment database
 * @param {Bot} bot Bot object of the account to check
 */
Controller.prototype.checkLastcommentDB = function(bot) {
    logger("debug", "Controller checkLastCommentDB(): Checking if all friends are in lastcomment.db...");

    this.data.lastCommentDB.find({}, (err, docs) => {
        Object.keys(bot.user.myFriends).forEach((e) => {

            if (bot.user.myFriends[e] == 3 && !docs.find(el => el.id == e)) {
                logger("info", `Inserting user ${e} into lastcomment.db...`, false, true);

                const obj = {
                    id: e,
                    time: Date.now() - (this.data.config.requestCooldown * 60000) // Subtract requestCooldown so that the user is able to use the command instantly
                };

                this.data.lastCommentDB.insert(obj, (err) => {
                    if (err) logger("error", "Error inserting existing user into lastcomment.db database! Error: " + err);
                });
            }

        });
    });
};


/**
 * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
 * @param {Bot} bot Bot object of the account to check
 * @param {function(number|null): void} callback Called with `remaining` (Number) on success or `null` on failure
 */
Controller.prototype.friendListCapacityCheck = function(bot, callback) {
    try {
        bot.user.getSteamLevels([bot.user.steamID], (err, users) => { // Check steam level of botindex account with bot0
            if (!users) return; // Users was undefined one time (I hope this will (hopefully) suppress an error?)

            const friendlistlimit = Object.values(users)[0] * 5 + 250; // Profile Level * 5 + 250
            const friends         = Object.values(bot.user.myFriends);
            const friendsamount   = friends.length - friends.filter(val => val == 0).length - friends.filter(val => val == 5).length; // Subtract friend enums 0 & 5

            const remaining = friendlistlimit - friendsamount;

            logger("debug", `Controller friendListCapacityCheck(): bot${bot.index} has ${friendsamount}/${friendlistlimit} friends`);

            if (remaining < 0) {
                logger("error", `Failed to check friendlist space for bot${bot.index}. Error: Remaining amount is negative - account has more friends than calculated limit?`);
                callback(null); // Stop if number is negative somehow - maybe when bot profile is private?

            } else {

                // Check if we are supposed to force-unfriend the oldest entry to make room for another friend
                if (remaining < 1 && this.data.advancedconfig.forceFriendlistSpaceTime > 0) {
                    logger("debug", `Controller friendListCapacityCheck(): Searching for oldest lastcomment db entry to unfriend as forceFriendlistSpace is ${this.data.advancedconfig.forceFriendlistSpaceTime}...`);

                    this.data.lastCommentDB.find({}, (err, docs) => { // Get all docs

                        // Sort to get oldest/smallest entry from lastcomment db as first element
                        docs = docs.sort((a, b) => a.time - b.time);

                        // Iterate over all docs until we find someone still on our friendlist that isn't an owner (since this func is called for each bot acc we don't need to iterate over the botobject)
                        docs.every(async (e, i) => { // Use every() so we can break with return false
                            if (bot.user.myFriends[e.id] == 3 && !this.data.cachefile.ownerid.includes(e.id)) { // Check if friend and not owner
                                const steamID = new SteamID(e.id);

                                // Unfriend user and send them a message // TODO: Maybe only do this from the main bot?
                                bot.sendChatMessage(bot, { userID: steamID.getSteamID64() }, await this.data.getLang("userforceunfriend", { "forceFriendlistSpaceTime": this.data.advancedconfig.forceFriendlistSpaceTime }, steamID.getSteamID64()));
                                bot.user.removeFriend(steamID);

                                logger("info", `[${bot.logPrefix}] Force-Unfriended '${e.id}' after being inactive for ${this.data.advancedconfig.forceFriendlistSpaceTime} days to keep 1 empty slot on the friendlist`);
                                return false; // Stop loop as one friend slot should now be free
                            }

                            // Log warning if we are on the last iteration as when this code is executed no candidate was found
                            if (i + 1 == docs.length) logger("warn", `[${bot.logPrefix}] No user was found to unfriend in order to keep at least one friendlist slot empty! Consider lowering 'forceFriendlistSpaceTime' in advancedconfig.json`);

                            return true; // Keep loop running
                        });
                    });

                } else {

                    // Log debug msg why the system above was skipped
                    if (remaining < 1 && this.data.advancedconfig.forceFriendlistSpaceTime == 0) logger("debug", "Controller friendListCapacityCheck(): Skipping force-unfriend system as it is disabled by forceFriendlistSpaceTime = 0");
                        else logger("debug", "Controller friendListCapacityCheck(): Skipping force-unfriend system as enough friendlist slots are free...");
                }

                callback(remaining);
            }
        });
    } catch (err) {
        logger("error", `Failed to check friendlist space for bot${bot.index}. Error: ${err}`);
        callback(null);
    }
};


/**
 * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
 */
Controller.prototype._lastcommentUnfriendCheck = function() {
    // Logger("debug", "Controller lastcommentUnfriendCheck(): 60 seconds passed, checking for users to unfriend..."); // This debug call annoys me

    this.data.lastCommentDB.find({ time: { $lte: Date.now() - (this.data.config.unfriendtime * 86400000) } }, (err, docs) => { // Until is a date in ms, so we check if it is less than right now
        if (docs.length < 1) return; // Nothing found

        docs.forEach((e, i) => { // Take action for all results
            setTimeout(() => {

                this.getBots().forEach(async (thisBot, j) => {
                    const thisUser = thisBot.user;

                    if (thisUser.myFriends[e.id] && thisUser.myFriends[e.id] == 3 && !this.data.cachefile.ownerid.includes(e.id)) { // Check if the targeted user is still friend and not an owner
                        if (j == 0) this.main.sendChatMessage(this.main, { userID: e.id }, await this.data.getLang("userunfriend", { "unfriendtime": this.data.config.unfriendtime }, e.id));

                        setTimeout(() => {
                            thisUser.removeFriend(new SteamID(e.id)); // Unfriend user with each bot
                            logger("info", `[${thisBot.logPrefix}] Unfriended '${e.id}' after ${this.data.config.unfriendtime} days of inactivity.`);
                        }, 1000 * j); // Delay every iteration so that we don't make a ton of requests at once (IP)
                    }

                    // Disabled db cleanup as entries from plugins would be deleted as well. SteamID does not recognize Discord IDs for example as invalid so we cannot check for that
                    // if (!this.data.cachefile.ownerid.includes(e.id)) this.data.lastCommentDB.remove({ id: e.id }); // Entry gets removed no matter what but we are nice and let the owner stay. Thank me later! <3
                });

            }, 1000 * i); // Delay every iteration so that we don't make a ton of requests at once (account)

        });
    });
};
