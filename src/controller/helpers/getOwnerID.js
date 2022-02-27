/*
 * File: getOwnerID.js
 * Project: steam-comment-service-bot
 * Created Date: 27.02.2022 13:06:43
 * Author: 3urobeat
 * 
 * Last Modified: 27.02.2022 13:49:54
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const SteamID         = require("steamid");
const steamidresolver = require("steamid-resolver");

/**
 * Retrieves ownerid steamID64s from config, even if it includes customURLs. (Don't call before dataimport!)
 * @param {Number} index Index of the id to retrieve from the ownerid array. Pass `null` to get full array of steamID64s
 * @param {function} [callback] Called with `steamID64` (String) when calling with index or Array when calling without index on success or `null` on failure
 */
module.exports.getOwnerID = (index, callback) => {    
    if (!isNaN(index) && index != null) {
        let target = config.ownerid[index];
        logger("debug", "getOwnerID(): Recieved request for steamID64 of " + target)

        //Either convert to steamID64 or directly callback target
        if (isNaN(target) || !new SteamID(String(target)).isValid()) {
            steamidresolver.customUrlTosteamID64(String(target), (err, id) => {
                if (err) {
                    logger("error", `Error converting ownerid from config (${target}) to a steamID64! ${err}`);
                    callback(null);
                } else {
                    logger("debug", `getOwnerID(): Converted ${target} to ${id}`)
                    callback(id);
                }
            })
        } else {
            callback(target);
        }
    } else {
        let tempArr = [];
        logger("debug", "getOwnerID(): Recieved request for steamID64s of all ownerids")

        //Either convert to steamID64 or directly push e
        config.ownerid.forEach((e, i) => {
            if (isNaN(e) || !new SteamID(String(e)).isValid()) {
                steamidresolver.customUrlTosteamID64(String(e), (err, id) => {
                    if (err) {
                        logger("error", `Error converting ownerid from config (${e}) to a steamID64! ${err}`);
                        tempArr.push(null);
                    } else {
                        logger("debug", `getOwnerID(): Converted ${e} to ${id}`)
                        tempArr.push(id)
                    }
                })
            } else {
                tempArr.push(e)
            }

            //Check for last iteration and make callback
            if (i + 1 == config.ownerid.length) callback(tempArr);
        })
    }
}