/*
 * File: updater.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 26.02.2022 19:40:42
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/* ------------ Check for update function: ------------ */
/**
 * Checks for an available update and installs it.
 * @param {Boolean} forceupdate If it should force an update even if user is on newest version or only update when a new version is found
 * @param {String} responseSteamID A steamID if the user requested an update via the Steam chat to send responses
 * @param {Boolean} compatibilityfeaturedone Only works with forceupdate! Changes compatibilityfeaturedone in data.json to true
 * @param {function} [callback] Called with `foundanddone` (Boolean) on completion. If `true` you should restart the bot and if `false` you can carry on.
 */
module.exports.run = (forceupdate, responseSteamID, compatibilityfeaturedone, foundanddone) => {
    var starter = require("../starter.js")

    var releasemode             = extdata.branch

    module.exports.activeupdate = false


    starter.checkAndGetFile("./src/updater/helpers/checkforupdate.js", logger, false, false, (file) => { //also too many nested callbacks
        file.checkforupdate(releasemode, forceupdate, (ready, chunk) => {
            if (ready) { //update found or forceupdate is true

                //log result of the check
                logger("", "", true)
                logger("", `${logger.colors.fggreen}Update available!${logger.colors.reset} Your version: ${logger.colors.fgred}${extdata.versionstr}${logger.colors.reset} | New version: ${logger.colors.fggreen}${chunk.versionstr}`, true)
                logger("", "", true)


                //respond to the user if he/she requested an update via the Steam chat
                if (responseSteamID) { 
                    require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `Update available! Your version: ${extdata.versionstr} | New version: ${chunk.versionstr}`)

                    if (advancedconfig.disableAutoUpdate && !forceupdate) { 
                        require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, "You have turned automatic updating off. You need to confirm the update in the console!") 
                    }
                }


                /* eslint-disable no-inner-declarations */
                function initiateUpdate() { //make initating the update a function to simplify the permission check below
                    this.activeupdate = true; //block new comment requests by setting active update to true and exporting it

                    starter.checkAndGetFile("./src/updater/helpers/prepareupdate.js", logger, false, false, (file2) => { //prepare update (like waiting for active comment processes to finish, logging off accounts, etc.)
                        file2.run(responseSteamID, () => {
                            starter.checkAndGetFile("./src/updater/helpers/createBackup.js", logger, false, false, (file3) => { //create a backup of the current installation
                                file3.run(() => {
                                    starter.checkAndGetFile("./src/updater/helpers/downloadupdate.js", logger, false, false, (file4) => { //start downloading the update
                                        file4.downloadupdate(releasemode, compatibilityfeaturedone, (err) => {
                                            if (err) logger("error", "I failed trying to download & install the update. Please check the log after other errors for more information.\nTrying to continue anyway...")

                                            logger("", `${logger.colors.fgyellow}Updating packages with npm...`, true, false, logger.animation("loading"))

                                            starter.checkAndGetFile("./src/controller/helpers/npminteraction.js", logger, false, false, (file5) => {
                                                file5.update((err) => {
                                                    if (err) logger("error", "I failed trying to update the dependencies. Please check the log after other errors for more information.\nTrying to continue anyway...")

                                                    foundanddone(true); //finished updating!
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                }


                /* ------------------ Check for permission to update ------------------ */
                if (!advancedconfig.disableAutoUpdate || forceupdate) { //check if the user has disabled the automatic updater or an update was forced
                    initiateUpdate();

                } else { //user has it disabled, ask for confirmation

                    if (botisloggedin == false || responseSteamID) { //only ask on start (or when user checked for an update from the Steam chat), otherwise this will annoy the user

                        logger("", `${logger.colors.underscore}What's new:${logger.colors.reset} ${chunk.whatsnew}\n`, true)

                        //Get user choice from terminal input
                        logger.readInput(`You have disabled the automatic updater.\n${logger.colors.brfgyellow}Would you like to update now?${logger.colors.reset} [y/n] `, 7500, (text) => {
                            
                            if (!text) { //user didn't respond in 7.5 seconds
                                process.stdout.write(`${logger.colors.fgred}X${logger.colors.reset}\n`) //write a X behind the y/n question
                                logger("info", `${logger.colors.brfgyellow}Stopping updater since you didn't reply in 7.5 seconds...\n\n`, true, false)
                                foundanddone(false)
                                
                            } else {
                                var response = text.toString().trim()

                                if (response == "y") initiateUpdate()
                                    else foundanddone(false)
                            }
                        })
                    }
                }

            } else { //no update found

                //log result and send message back to user if update was requested via chat
                if (parseInt(process.argv[3]) + 10000 > Date.now()) logger("info", `No available update found. (online: ${chunk.versionstr} | local: ${extdata.versionstr})`, false, true, logger.animation("loading")) //only print message with animation if the start is more recent than 10 seconds
                    else logger("info", `No available update found. (online: ${chunk.versionstr} | local: ${extdata.versionstr})`, false, true)

                if (responseSteamID) require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `No available update found. (online: ${chunk.versionstr} | local: ${extdata.versionstr})`)

                foundanddone(false) //make callback to let caller carry on
            }

            //update the last time we checked for an update
            lastupdatecheckinterval = Date.now() + 21600000 //6 hours in ms
        })
    })
}


/* ------------ Compatibility feature function to ensure automatic updating works: ------------ */
/**
 * Runs the compatibility feature if compatibilityfeaturedone in data.json is false
 * @param {function} [callback] Called with `foundanddone`(Boolean) on completion. If `true` you should restart the bot and if `false` you can carry on.
 */
module.exports.compatibility = (callback) => {
    if (extdata.compatibilityfeaturedone) {
        callback(false)
        return;
    }

    var starter = require("../starter.js")


    /**
     * Runs the compatibility feature
     * @param {String} filename filename of the compatibility feature
     */
    function runCompFeature(filename) {
        starter.checkAndGetFile(`./src/updater/compatibility/${filename}.js`, logger, false, false, (file) => {
            logger("info", `Running compatibility feature ${filename}.js...`, true)

            file.run(callback)
        })
    }


    try { //this is sadly needed when updating to 2.10 because I forgot in 2.9.x to set compatibilityfeature to false again which completely skips the comp feature
        if (extdata.firststart && fs.existsSync('./src/lastcomment.json') && (extdata.version == "2100" || extdata.versionstr == "BETA 2.10 b5")) extdata.compatibilityfeaturedone = false
    } catch (err) { } //eslint-disable-line

    if (!fs.existsSync('./src')) { //this has to trigger if user was on version <2.6
        runCompFeature("2060")

    } else if (Object.keys(config).includes("botsgroupid")) { //this has to trigger if user was on version <2.7
        runCompFeature("2070")

    } else if (!extdata.compatibilityfeaturedone && (extdata.versionstr == "2.8" || extdata.versionstr == "BETA 2.8 b3")) {
        runCompFeature("2080")

    } else if (!extdata.compatibilityfeaturedone && (extdata.version == "2100" || extdata.versionstr == "BETA 2.10 b5")) {
        runCompFeature("2100")

    } else if (!extdata.compatibilityfeaturedone && extdata.version == "2103" && config.botaccountcooldown != 10) {
        runCompFeature("2103")

    } else if (!extdata.compatibilityfeaturedone && extdata.version == "2104") {
        runCompFeature("2104")

    } else if (!extdata.compatibilityfeaturedone && (extdata.version == "21100" || extdata.version.match(/2110b[0-9]/g))) { //run on every beta build with quick regex
        runCompFeature("21100")

    } else if (!extdata.compatibilityfeaturedone && (extdata.version == "21200" || extdata.version == "21200b02")) {
        runCompFeature("21200")
    
    } else {
        callback(false)
    }
}


/* ------------ Register update checker: ------------ */
var fs = require("fs")

var lastupdatecheckinterval = Date.now()
if (updatecheckinterval) clearInterval(updatecheckinterval) //this check should never run but I added it just to be sure

var updatecheckinterval = setInterval(() => {
    if (Date.now() > lastupdatecheckinterval) {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error", "error checking output for update notice: " + err)

            if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice

                module.exports.run(false, null, false, (done) => { //check if there is an update available
                    if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: require('../controller/controller.js').skippedaccounts })})`) //send request to parent process if the bot found and ran the update
                })
            } 
        })
    }
}, 300000); //5 min in ms