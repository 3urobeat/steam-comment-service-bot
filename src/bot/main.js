/*
 * File: main.js
 * Project: steam-comment-service-bot
 * Created Date: 13.07.2021 19:13:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:46:10
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Runs & defines certain stuff only once as bot0
 */
module.exports.run = () => {

    var controller                       = require("../controller/controller.js")

    module.exports.quotes                = require("../controller/helpers/dataimport.js").quotes()

    module.exports.failedcomments        = [] //array saving failedcomments so the user can access them via the !failecomments command
    module.exports.activecommentprocess  = {} //object storing active comment processes so that a user can only request one process at a time, used accounts can only be used in one session, have a cooldown (not the user! that is handled by lastcomment) and the updater is blocked
    module.exports.lastcommentrequestmsg = [] //array saving the last comment cmd request to apply higher cooldown to the comment cmd usage compared to normal cmd usage cooldown
    module.exports.commentcounter        = 0  //this will count the total of comments requested since the last reboot


    //Import lang object
    require("../controller/helpers/dataimport.js").lang((lang) => {
        module.exports.lang = lang
    })


    //Define configgroup64id for the accounts to be able to access
    require("./helpers/steamgroup.js").configgroup64id((configgroup64id) => {
        module.exports.configgroup64id = configgroup64id //just get it and export it
    })


    /**
     * Function to return last successful comment from lastcomment.db
     * @param {function} [callback] Called with `timestamp` (Number) on completion
     */
    module.exports.lastsuccessfulcomment = (callback) => {
        var greatesttimevalue = 0

        controller.lastcomment.find({}, (err, docs) => { //get all documents
            docs.forEach((e, i) => {
                if (e.time > greatesttimevalue) greatesttimevalue = Number(e.time)

                if (i == docs.length - 1) {
                    return callback(greatesttimevalue)
                }
            })
        }) 
    }
}