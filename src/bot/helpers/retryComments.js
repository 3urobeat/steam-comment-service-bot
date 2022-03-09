/*
 * File: retryComments.js
 * Project: steam-comment-service-bot
 * Created Date: 08.03.2022 13:09:21
 * Author: 3urobeat
 * 
 * Last Modified: 08.03.2022 19:06:46
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const mainfile = require("../main.js");
const round    = require("../../controller/helpers/round.js");

/**
 * Retries failed comments after completed request if enabled in advancedconfig.json
 * @param {function} [callback] Called with `true` if finished msg should be sent or `false` if comments are getting retried and no finished msg should be sent now
 */
module.exports.retryComments = (recieverSteamID, lang, respond, callback) => {

    //Check if we should even attempt to retry failed comments
    if (advancedconfig.retryFailedComments && mainfile.activecommentprocess[recieverSteamID].retryAttempt < advancedconfig.retryFailedCommentsAttempts && Object.keys(mainfile.failedcomments[recieverSteamID]).length > 0) {
        
        //First, increase retryAttempt so that the next comment interval iteration will be "timeouted" by retryFailedCommentsDelay ms
        mainfile.activecommentprocess[recieverSteamID].retryAttempt++;

        //Log and notify user about retry attempt starting in retryFailedCommentsDelay ms
        logger("info", `${Object.keys(mainfile.failedcomments[recieverSteamID]).length} comments failed for ${recieverSteamID}. Retrying in ${round(advancedconfig.retryFailedCommentsDelay / 60000, 2)} minutes (Attempt ${mainfile.activecommentprocess[recieverSteamID].retryAttempt}/${advancedconfig.retryFailedCommentsAttempts})`)
        respond(202, lang.commentretrying.replace("failedamount", Object.keys(mainfile.failedcomments[recieverSteamID]).length).replace("numberOfComments", mainfile.activecommentprocess[recieverSteamID].amount).replace("retrydelay", round(advancedconfig.retryFailedCommentsDelay / 60000, 2)).replace("thisattempt", mainfile.activecommentprocess[recieverSteamID].retryAttempt).replace("maxattempt", advancedconfig.retryFailedCommentsAttempts))

        //Timeout before increasing numberOfComments for repeated retry attempts so that these comments won't be posted instantly from the previous retry attempt
        setTimeout(() => {
            //Increase numberOfComments by amount of failed comments
            mainfile.activecommentprocess[recieverSteamID].amount = Number(mainfile.activecommentprocess[recieverSteamID].amount) + Object.keys(mainfile.failedcomments[recieverSteamID]).length;

            //Increase until value (amount of retried comments * commentdelay) + delay before starting retry attempts
            mainfile.activecommentprocess[recieverSteamID].until = Number(mainfile.activecommentprocess[recieverSteamID].until) + (Object.keys(mainfile.failedcomments[recieverSteamID]).length * config.commentdelay) + advancedconfig.retryFailedCommentsDelay;

            //Reset content in failedcomments obj
            mainfile.failedcomments[recieverSteamID] = {};
        }, advancedconfig.retryFailedCommentsDelay * (mainfile.activecommentprocess[recieverSteamID].retryAttempt - 1));

        //Don't send finished message
        callback(false);

    } else {
        if (advancedconfig.retryFailedComments) logger("debug", `retryComments(): Looks like all retryAttempts have been made or no comments failed. Sending finished message...`)
            else logger("debug", `retryComments(): retryFailedComments is disabled. Sending finished message...`)

        //Allow to send finished message
        callback(true)
    }
    
}