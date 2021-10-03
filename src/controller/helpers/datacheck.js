/*
 * File: datacheck.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 03.10.2021 19:38:48
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Checks the config for my leftovers, checks owner link & ids and prints some recommendations for a few settings.
 * @param {Object} logininfo The logininfo object
 */
module.exports.run = (logininfo, callback) => {
    var fs              = require("fs")
    var SteamID         = require("steamid")
    var steamidresolver = require("steamid-resolver")

    logger("info", "Checking config for 3urobeat's leftovers...", false, true, logger.animation("loading"))

    if ((process.env.LOGNAME !== 'tomg' && process.env.LOGNAME !== 'pi') || (require('os').hostname() !== 'Toms-Hoellenmaschine' && require('os').hostname() !== 'raspberrypi' && require('os').hostname() !== 'TomsThinkpad')) { //remove myself from config on different computer
        let write = false;
        if (config.owner.includes(extdata.mestr)) { config.owner = ""; write = true } 
        if (config.ownerid.includes("76561198260031749")) { config.ownerid.splice(config.ownerid.indexOf("76561198260031749"), 1); write = true } 
        if (config.ownerid.includes("76561198982470768")) { config.ownerid.splice(config.ownerid.indexOf("76561198982470768"), 1); write = true }

        //Moin Tom, solltest du in der Zukunft noch einmal auf dieses Projekt zurückschauen, dann hoffe ich dass du etwas sinnvolles mit deinem Leben gemacht hast. (08.06.2020)
        //Dieses Projekt war das erste Projekt welches wirklich ein wenig Aufmerksamkeit bekommen hat. (1,5k Aufrufe in den letzten 14 Tagen auf GitHub, 1,3k Aufrufe auf mein YouTube Tutorial, 15k Aufrufe auf ein Tutorial zu meinem Bot von jemand fremden)
        //Das Projekt hat schon bis jetzt viel Zeit in Anspruch genommen, die ersten Klausuren nach der Corona Pandemie haben bisschen darunter gelitten. All der Code ist bis auf einzelne, markierte Schnipsel selbst geschrieben. Node Version zum aktuellen Zeitpunkt: v12.16.3

        if (write) {
            //Get arrays on one line
            var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
                if(v instanceof Array)
                return JSON.stringify(v);
                return v; 
            }, 4)
                .replace(/"\[/g, '[')
                .replace(/\]"/g, ']')
                .replace(/\\"/g, '"')
                .replace(/""/g, '""');

            fs.writeFile("./config.json", stringifiedconfig, err => {
                if (err) logger("error", "delete 3urobeat from config.json error: " + err, true) 
            }) 
        }
    }


    //Check config values:
    logger("info", "Checking for invalid config values...", false, true, logger.animation("loading"))

    config.maxComments = Math.round(config.maxComments) //round maxComments number everytime to avoid user being able to set weird numbers (who can comment 4.8 times? right - no one)
    config.maxOwnerComments = Math.round(config.maxOwnerComments)

    var maxCommentsOverall = config.maxOwnerComments //define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
    if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments

    if (config.allowcommentcmdusage === false && new SteamID(String(config.ownerid[0])).isValid() === false) {
        logger("error", "\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m", true)
        return process.send("stop()")
    }
    if (config.maxComments < 1) {
        logger("info", "\x1b[31mYour maxComments value in config.json can't be smaller than 1! Automatically setting it to 1...\x1b[0m", true)
        config.maxComments = 1
    }
    if (config.maxOwnerComments < 1) {
        logger("info", "\x1b[31mYour maxOwnerComments value in config.json can't be smaller than 1! Automatically setting it to 1...\x1b[0m", true)
        config.maxOwnerComments = 1
    }
    if (config.commentdelay / (maxCommentsOverall / 2) < 1250) {
        logger("warn", "\x1b[31mYou have raised maxComments or maxOwnerComments but I would recommend to raise the commentdelay further. Not increasing the commentdelay further raises the probability to get cooldown errors from Steam.\x1b[0m", true) 
    }
    if (logininfo.bot0 == undefined) { //check real quick if logininfo is empty
        logger("error", "\x1b[31mYour logininfo doesn't contain a bot0 or is empty! Aborting...\x1b[0m", true); 
        return process.send("stop()")
    }
    if (config.commentdelay * maxCommentsOverall > 2147483647) { //check for 32-bit integer limit for commentcmd timeout
        logger("error", "\x1b[31mYour maxComments and/or maxOwnerComments and/or commentdelay value in the config are too high.\nPlease lower these values so that 'commentdelay * maxComments' is not bigger than 2147483647.\n\nThis will otherwise cause an error when trying to comment (32-bit integer limit). Aborting...\x1b[0m\n", true)
        return process.send("stop()")
    }
    if (config.randomizeAccounts && Object.keys(logininfo).length <= 5 && maxCommentsOverall > Object.keys(logininfo).length * 2) {
        logger("warn", "\x1b[31mI wouldn't recommend using randomizeAccounts with 5 or less accounts when each account can/has to comment multiple times. The chance of an account getting a cooldown is higher.\n       Please make sure your commentdelay is set adequately to reduce the chance of this happening.\x1b[0m", true) 
    }


    //Check if ownerids are correct:
    logger("info", `Checking for invalid ownerids...`, false, true, logger.animation("loading"))
    config.ownerid.forEach((e) => {
        if (isNaN(e) || new SteamID(String(e)).isValid() == false) { 
            logger("warn", `${e} is not a valid ownerid!`, true) 
        }
    })

    //Check if owner link is correct
    logger("info", `Checking if owner link is valid...`, false, true, logger.animation("loading"))
    if (!config.owner.includes("steamcommunity.com")) { 
        logger("warn", "You haven't set a correct owner link to your profile in the config!\n       Please add this to refer to yourself as the owner and operator of this bot.", true) 
    } else {
        try {
            steamidresolver.customUrlTosteamID64(config.owner, (err, ownerResult) => {
                if (err == "The specified profile could not be found.") { //if the profile couldn't be found display specific message
                    return logger("warn", "You haven't set a correct owner link to your profile in the config!\n       Please add this to refer to yourself as the owner and operator of this bot.\n       Error: " + err, true)
                } else {
                    if (err) return logger("error", "Error checking if owner is valid: " + err) //if a different error then display a generic message with the error
                }

                logger("info", `Successfully checked owner link. steamID64: ${ownerResult}`, false, true)
            })
        } catch (err) {
            if (err) { 
                logger("error", "error getting owner profile xml info: " + err, true); 
                return; 
            } 
        }
    }

    callback();
}