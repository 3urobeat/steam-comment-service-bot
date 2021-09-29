/*
 * File: ready.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 29.09.2021 17:59:23
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Checks if the startup is completed and shows some messages
 * @param {Object} logininfo The logininfo object imported in login.js
 */
module.exports.readyCheck = (logininfo) => {
    var fs         = require("fs")

    var controller = require("./controller.js")
    var login      = require("./login.js")
    var round      = require("./helpers/round.js")
    var cache      = require("../data/cache.json")

    var { botobject, communityobject } = controller //import these two directly for simplicity

    var readyafter = 0

    
    var readyinterval = setInterval(() => { //run ready check every x ms

        if (Object.keys(communityobject).length + login.skippednow.length == Object.keys(logininfo).length && login.accisloggedin == true) {
            clearInterval(readyinterval) //stop checking if startup is done


            //Start logging the ready message block
            logger("", ' ', true)
            logger("", '*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
            logger("", `\x1b[95m>\x1b[0m \x1b[96m${logininfo.bot0[0]}\x1b[0m version \x1b[96m${extdata.versionstr}\x1b[0m by ${extdata.mestr} logged in.`, true)


            //Calculate what the max amount of comments per account is and log it
            var maxCommentsOverall = config.maxOwnerComments //define what the absolute maximum is which the bot is allowed to process. This should make checks shorter
            if (config.maxComments > config.maxOwnerComments) maxCommentsOverall = config.maxComments

            if (maxCommentsOverall > 3) var repeatedCommentsStr = `\x1b[4m\x1b[31m${maxCommentsOverall / Object.keys(botobject).length}\x1b[0m` 
                else var repeatedCommentsStr = maxCommentsOverall / Object.keys(botobject).length
            
            logger("", `\x1b[94m>\x1b[0m ${Object.keys(communityobject).length} total account(s) | ${repeatedCommentsStr} comments per account allowed`, true)


            //display amount of proxies if any were used
            if (login.proxies.length > 1) { //'null' will always be in the array (your own ip)
                logger("", `\x1b[36m>\x1b[0m Using ${login.proxies.length} proxies | ${Math.round(Object.keys(communityobject).length / login.proxies.length)} account(s) per proxy`, true)
            }


            //display amount of limited accounts
            require("./helpers/limitedcheck.js").check(botobject, (limited, failed) => {
                if (failed > 0) var failedtocheckmsg = `(Couldn't check ${failed} account(s))`;
                    else var failedtocheckmsg = "";
                
                logger("", `\x1b[92m>\x1b[0m ${limited}/${Object.keys(botobject).length} account(s) are \x1b[31mlimited\x1b[0m ${failedtocheckmsg}`, true) 
            })


            //Log warning message if automatic updater is turned off
            if (config.disableautoupdate) logger("", "\x1b[41m\x1b[30m>\x1b[0m Automatic updating is \x1b[4m\x1b[31mturned off\x1b[0m!", true)


            //Log which games the main and child bots are playing
            var playinggames = ""
            if (config.playinggames[1]) var playinggames = `(${config.playinggames.slice(1, config.playinggames.length)})`
            logger("", `\x1b[93m>\x1b[0m Playing status: \x1b[32m${config.playinggames[0]}\x1b[0m ${playinggames}`, true)


            //Calculate time the bot took to start
            const bootend = Date.now()
            readyafter = ((bootend - controller.bootstart) - login.steamGuardInputTime) / 1000
            module.exports.readyafter = readyafter //refresh exported variable to now allow cmd usage

            var readyafterunit = "seconds"
            if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "minutes" }
            if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "hours" }
            
            logger("", `\x1b[91m>\x1b[0m Ready after ${round(readyafter, 2)} ${readyafterunit}!`, true)
            extdata.timesloggedin++
            extdata.totallogintime += readyafter / Object.keys(communityobject).length //get rough logintime of only one account


            //Finished logging ready message
            logger("", '*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
            logger("", ' ', true)


            //Start webserver
            if (config.enableurltocomment) require("./webserver.js").run()


            //Show disclaimer message to not misuse this bot if firststart
            if (extdata.firststart) logger("", `\x1b[0m[\x1b[31mDisclaimer\x1b[0m]: Please don't misuse this bot by spamming or posting malicious comments. Your accounts can get banned from Steam if you do that.\n              You are responsible for the actions of your bot instance.\n`, true)
            

            //Log amount of skippedaccounts
            if (controller.skippedaccounts.length > 0) logger("info", `Skipped Accounts: ${controller.skippedaccounts.length}/${Object.keys(logininfo).length}\n`, true)


            //Please star my repo :)
            if (extdata.firststart) logger("", `If you like my work please consider giving my repository a star! I would really appreciate it!\nhttps://github.com/HerrEurobeat/steam-comment-service-bot\n`, true)

            
            //Log extra messages that were suppressed during login
            logger("info", `Logging supressed logs...`, false, true, logger.animation("loading"))
            controller.readyafterlogs.forEach(e => { logger("", e, true) }) //log suppressed logs


            //Add backups to cache.json
            logger("info", "Writing backups to cache.json...", false, true, logger.animation("loading"))
            cache["configjson"] = config
            cache["datajson"] = extdata

            fs.writeFile(srcdir + '/data/cache.json', JSON.stringify(cache, null, 2), err => {
                if (err) logger("error", "error writing file backups to cache.json: " + err) 
            })
            

            //Friendlist capacity check
            Object.keys(botobject).forEach((e, i) => {
                require("./helpers/friendlist.js").friendlistcapacitycheck(i, (remaining) => {
                    if (remaining < 25) {
                        logger("warn", `The friendlist space of bot${i} is running low! (${remaining} remaining)`)
                    }
                })
            })
            

            //Message owners if firststart is true that the bot just updated itself
            if (extdata.firststart) {
                config.ownerid.forEach(e => {
                    botobject[0].chat.sendFriendMessage(e, `I have updated myself to version ${extdata.versionstr}!\nWhat's new: ${extdata.whatsnew}`) 
                }) 
            }

            
            //Write logintime stuff to data.json
            logger("info", `Writing logintime...`, false, true, logger.animation("loading"))
            extdata.totallogintime = round(extdata.totallogintime, 2)
            extdata.firststart = false

            fs.writeFile(srcdir + "/data/data.json", JSON.stringify(extdata, null, 4), err => { //write changes
                if (err) logger("error", "change extdata to false error: " + err)
            })


            //Print startuo complete message and erase it after 5 sec
            setTimeout(() => {
                logger("info", 'Startup complete!', false, true, ["✅"]) 

                setTimeout(() => {
                    logger("", "", true, true) //clear out last remove message
                }, 5000);
            }, 2000);
        }
    }, 500);
}