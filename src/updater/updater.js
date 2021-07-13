
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


    starter.checkAndGetFile("./src/updater/helpers/checkforupdate.js", (file) => { //also too many nested callbacks
        file.checkforupdate(releasemode, forceupdate, (ready, chunk) => {
            if (ready) { //update found or forceupdate is true

                //log result of the check
                logger("", "", true)
                logger("", `\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${extdata.versionstr}\x1b[0m | New version: \x1b[32m${chunk.versionstr}\x1b[0m`, true)
                logger("", "", true)


                //respond to the user if he/she requested an update via the Steam chat
                if (responseSteamID) { 
                    require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `Update available! Your version: ${extdata.versionstr} | New version: ${chunk.versionstr}`)

                    if (config.disableautoupdate == true && !forceupdate) { 
                        require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, "You have turned automatic updating off. You need to confirm the update in the console!") 
                    }
                }


                /* eslint-disable no-inner-declarations */
                function initiateUpdate() { //make initating the update a function to simplify the permission check below
                    this.activeupdate = true; //block new comment requests by setting active update to true and exporting it

                    starter.checkAndGetFile("./src/updater/helpers/prepareupdate.js", (file2) => {
                        file2.run(responseSteamID, () => {
                            logger("", "Starting to download update...", true)

                            starter.checkAndGetFile("./src/updater/helpers/downloadupdate.js", (file3) => {
                                file3.downloadupdate(releasemode, compatibilityfeaturedone, (err) => {
                                    if (err) logger("error", "I failed trying to download & install the update. Please check the log after other errors for more information.\nTrying to continue anyway...")

                                    logger("", "\x1b[33mUpdating packages with npm...\x1b[0m\n", true)

                                    starter.checkAndGetFile("./src/controller/helpers/npminteraction.js", (file4) => {
                                        file4.update((err) => {
                                            if (err) logger("error", "I failed trying to update the dependencies. Please check the log after other errors for more information.\nTrying to continue anyway...")

                                            foundanddone(true); //finished updating!
                                        })
                                    })
                                })
                            })
                        })
                    })
                }


                /* ------------------ Check for permission to update ------------------ */
                if (config.disableautoupdate == false || forceupdate) { //check if the user has disabled the automatic updater or an update was forced
                    initiateUpdate();

                } else { //user has it disabled, ask for confirmation

                    if (botisloggedin == false || responseSteamID) { //only ask on start (or when user checked for an update from the Steam chat), otherwise this will annoy the user

                        logger("", `\x1b[4mWhat's new:\x1b[0m ${chunk.whatsnew}\n`, true)
                        logger("info", "You have disabled the automatic updater.", true, true) //Log once for output.txt (gets overwritten by the next line)
                        logger("", `\x1b[93mWould you like to update now?\x1b[0m [y/n] `, true, true) //Split into two logger calls so that remove works correctly

                        process.stdout.write(`You have disabled the automatic updater.\n\x1b[93mWould you like to update now?\x1b[0m [y/n] `)
                        var updatestdin = process.openStdin();

                        let noresponsetimeout = setTimeout(() => { //skip update after 7.5 sec if the user doesn't respond
                            updatestdin.pause()
                            process.stdout.write("\x1b[31mX\n") //write a X behind the y/n question
                            logger("info", "\x1b[93mStopping updater since you didn't reply in 7.5 seconds...\x1b[0m\n\n", true)

                            foundanddone(false)
                        }, 7500);

                        updatestdin.addListener('data', text => {
                            clearTimeout(noresponsetimeout) 
                            updatestdin.pause() //stop reading

                            var response = text.toString().trim()

                            if (response == "y") initiateUpdate()
                                else foundanddone(false)
                        })
                    }
                }

            } else { //no update found

                //log result and send message back to user if update was requested via chat
                logger("info", `No available update found. (online: ${chunk.versionstr} | local: ${extdata.versionstr})`, false, true)
                if (responseSteamID) require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `No available update found. (online: ${chunk.versionstr} | local: ${extdata.versionstr})`)

                foundanddone(false) //make callback to let caller carry on
            }

            //update the last time we checked for an update
            lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms
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
        starter.checkAndGetFile(`./src/updater/compatibility/${filename}.js`, (file) => {
            logger("info", `Running compatibility feature ${filename}.js...`)

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

    } else if (!extdata.compatibilityfeaturedone && extdata.version == "2103" && config.globalcommentcooldown != 10) {
        runCompFeature("2103")

    } else if (!extdata.compatibilityfeaturedone && extdata.version == "2104") {
        runCompFeature("2104")

    } else if (!extdata.compatibilityfeaturedone && (extdata.version == "21100" || extdata.version.match(/2110b[0-9]/g))) { //run on every beta build with quick regex
        runCompFeature("21100")
    
    } else {
        callback(false)
    }
}


/* ------------ Register update checker: ------------ */
var fs                      = require("fs")

var lastupdatecheckinterval = Date.now()
if (updatecheckinterval) clearInterval(updatecheckinterval) //this check should never run but I added it just to be sure

var updatecheckinterval = setInterval(() => {
    if (Date.now() > lastupdatecheckinterval) {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error", "error checking output for update notice: " + err)

            if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice

                module.exports.run(false, null, false, (done) => { //check if there is an update available
                    if (done) require("../../start.js").restart({ skippedaccounts: require('../controller/controller.js').skippedaccounts }) //restart if the bot found and ran the update
                })
            } 
        })
    }
}, 300000); //5 min in ms