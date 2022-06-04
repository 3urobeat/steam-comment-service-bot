/*
 * File: steamgroup.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 04.06.2022 11:30:27
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const steamidresolver = require("steamid-resolver") //my own library, cool right?
const fs              = require("fs")

/**
 * Gets the groupID64 of yourgroup set in the config from cache.json or Steam
 * @param {function} [callback] Called with `steamID64` (null on error or when not set in config, String on success) parameter on completion
 */
module.exports.configgroup64id = (callback) => {
    
    //Check if no group is set in the config
    if (config.yourgroup.length < 1) {
        logger("info", "Skipping groupID64 request of yourgroup because config.yourgroup is empty.", false, true, logger.animation("loading")); //log to output for debugging

        //Reset cachefile values
        cachefile.configgroup = ""
        cachefile.configgroup64id = ""

        fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cachefile, null, 4), err => { 
            if (err) logger("error", `Writing botsgroupid to cache.json error: ${err}`) 
        })

        callback(null);
        
    } else {
    
        //Check if url was already converted to id previously and skip doing that again
        if (cachefile.configgroup == config.yourgroup) {
            logger("debug", "configgroupID64 of yourgroup is stored in cache.json...", false, true, logger.animation("loading"))

            callback(cachefile.configgroup64id); //callback configgroup64id
    
        } else {
            logger("info", "groupID64 of yourgroup not in cache.json. Requesting information from Steam...", false, true, logger.animation("loading"))
    
            steamidresolver.groupUrlToGroupID64(config.yourgroup, (err, yourgroupResult) => {
                if (err == "The specified group could not be found.") { //if the group couldn't be found display specific message
                    logger("error", "Your group (yourgroup in config) doesn't seem to be valid!\n        Error: " + config.yourgroup + " contains no xml or groupID64 data", true);
                    callback(null);
                    return;

                } else {
                    if (err) {
                        logger("error", "Error getting yourgroup information from Steam: " + err) //if a different error then display a generic message with the error
                        callback(null);
                        return;
                    }
                }
    
                logger("info", `Successfully retrieved yourgroup information. groupID64: ${yourgroupResult}`, false, true, logger.animation("loading"))
    

                cachefile.configgroup = config.yourgroup
                cachefile.configgroup64id = yourgroupResult

                fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cachefile, null, 4), err => { 
                    if (err) logger("error", `Writing configgroup64id to cache.json error: ${err}`) 
                })

                callback(yourgroupResult); //callback configgroup64id
            })
        } 
    } 
}


/**
 * Gets the groupID64 of botsgroup set in the config from cache.json or Steam
 * @param {Number} loginindex The loginindex of the calling account
 * @param {String} thisbot The thisbot string of the calling account
 * @param {function} [callback] Called with `steamID64` (null on error or when not set in config, String on success) parameter on completion
 */
module.exports.botsgroupID64 = (loginindex, thisbot, callback) => {

    //Check if no botsgroup is set in the config
    if (config.botsgroup.length < 1) {
        logger("info", `[${thisbot}] Skipping groupID64 request of botsgroup because config.botsgroup is empty.`, false, true); //log to output for debugging

        //Reset cachefile values
        cachefile.botsgroup = ""
        cachefile.botsgroupid = ""

        fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cachefile, null, 4), err => { 
            if (err) logger("error", `Writing botsgroupid to cache.json error: ${err}`) 
        })

        callback(null);
        
    } else {
    
        //Check if url was already converted to id previously and skip doing that again
        if (cachefile.botsgroup == config.botsgroup) {
            logger("debug", `[${thisbot}] groupID64 of botsgroup is stored in cache.json...`, false, true, logger.animation("loading"))

            callback(cachefile.botsgroupid); //callback botsgroupid
    
        } else {
            logger("info", `[${thisbot}] groupID64 of botsgroup not in cache.json. Requesting information from Steam...`, false, true, logger.animation("loading"))
    
            steamidresolver.groupUrlToGroupID64(config.botsgroup, (err, botsgroupid) => {
                if (err == "The specified group could not be found.") { //if the group couldn't be found display specific message
                    if (loginindex == 0) logger("warn", "Your group (botsgroup in config) doesn't seem to be valid!\n                             " + config.botsgroup + " contains no xml or groupID64 data"); 
                    callback(null);
                    return;

                } else {
                    if (err) {
                        logger("error", "Error getting botsgroup information from Steam: " + err) //if a different error then display a generic message with the error
                        callback(null);
                        return;
                    }
                }
    
                logger("info", `[${thisbot}] Successfully retrieved botsgroup information. groupID64: ${botsgroupid} - Writing to cache.json...`, false, true, logger.animation("loading"))
    

                cachefile.botsgroup = config.botsgroup
                cachefile.botsgroupid = botsgroupid

                fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cachefile, null, 4), err => { 
                    if (err) logger("error", `Writing botsgroupid to cache.json error: ${err}`) 
                })

                callback(botsgroupid); //callback botsgroupid
            })
        } 
    } 
}