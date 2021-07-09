
/* ------------ Check for update function: ------------ */
/**
 * Checks for an available update and installs it.
 * @param {Boolean} forceupdate If it should force an update even if user is on newest version or only update when a new version is found
 * @param {String} responseSteamID A steamID if the user requested an update via the Steam chat to send responses
 * @param {Boolean} compatibilityfeaturedone Only works with forceupdate! Changes compatibilityfeaturedone in data.json to true
 * @param {function} [callback] Called with `foundanddone`(Boolean) on completion. If `true` you should restart the bot and if `false` you can carry on.
 */
module.exports.run = (forceupdate, responseSteamID, compatibilityfeaturedone, foundanddone) => {
    var releasemode             = extdata.branch

    module.exports.activeupdate = false

    require("./helpers/checkforupdate").checkforupdate(releasemode, forceupdate, (ready, chunk) => {
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

                require("./helpers/prepareupdate.js").run(responseSteamID, () => {
                    logger("info", "Starting to download update...", false, true)

                    require("./helpers/downloadupdate.js").downloadupdate(releasemode, compatibilityfeaturedone, (err) => {
                        if (err) {
                            //dunno, print err message and restart or what?
                            return;
                        }

                        logger("info", "\x1b[33mUpdating packages with npm...\x1b[0m", true)

                        require(srcdir + "./controller/helpers/npminteraction.js").update((err) => {
                            if (err) {
                                //dunno, print err message and restart or what?
                                return;
                            }

                            foundanddone(true); //finished updating!
                        })
                    })

                    //Maybe useful when downloadupdate should fail
                    /* logger("error", "Aborted trying to update. Please check the log for other errors.")
                    foundanddone(false)
                    return; */
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

            foundanddone(true) //make callback to let caller know the update is finished

        } else { //no update found

            //log result and send message back to user if update was requested via chat
            logger("info", `No available update found. (online: ${chunk.versionstr} | local: ${extdata.versionstr})`, false, true)
            if (responseSteamID) require('../controller/controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `No available update in the ${releasemode} branch found.`)

            foundanddone(false) //make callback to let caller carry on
        }

        //update the last time we checked for an update
        lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms
    })
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
                module.exports.check() //call func from this file
            } 
        })
    }
}, 300000); //5 min in ms






//Needs to have logic added to dynamically run compatibility checks
/* function compatibilityfeatures() {
    //Compatibility features
    try { //this is sadly needed when updating to 2.10 because I forgot in 2.9.x to set compatibilityfeature to false again which completly skips the comp feature
        var extdata = require("./data.json")
        if (extdata.firststart && fs.existsSync('./src/lastcomment.json') && (extdata.version == "2100" || extdata.versionstr == "BETA 2.10 b5")) extdata.compatibilityfeaturedone = false
    } catch (err) { } //eslint-disable-line

    if (!fs.existsSync('./src')) { //this has to trigger if user was on version <2.6
        try {
            logger("info", "Applying 2.6 compatibility changes...", false, true)
            fs.mkdirSync('./src') 

            fs.writeFile('./src/data.json', '{ "version": 0 }', (err) => { //create data.json to avoid errors
                if (err) logger("error", "error creating data.json: " + err, true) 
            })
            fs.unlink("./bot.js", (err) => { //delete bot.js
                if (err) logger("error", "error deleting bot.js: " + err, true) 
            }) 
            fs.rename("./lastcomment.json", "./src/lastcomment.json", (err) => { //move lastcomment.json
                if (err) logger("error", "error moving lastcomment.json: " + err, true) 
            })

            var logininfo = require('../logininfo.json')

            if (Object.keys(logininfo)[0] == "bot1") { //check if first bot is 1 (old) and not 0
                Object.keys(logininfo).forEach((e, i) => {      
                    Object.defineProperty(logininfo, `bot${i}`, //Credit: https://stackoverflow.com/a/14592469 
                        Object.getOwnPropertyDescriptor(logininfo, e));
                    delete logininfo[e]; 
                })
                
                fs.writeFile("./logininfo.json", JSON.stringify(logininfo, null, 4), (err) => {
                    if (err) logger("error", "error writing changes to logininfo.json: " + err, true) 
                }) 
            }

            if (config.globalcommentcooldown == 5000) { //check if the user uses default settings and raise 5 to 10 sec
                config.globalcommentcooldown = 10000
                fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                    if (err) logger("error", 'error changing default globalcommentcooldown value: ' + err, true) 
                }) 
            }

            setTimeout(() => {
                checkforupdate(true) //force to update again to get files from new structure
            }, 1000);
        } catch(err) {
            logger("", `\n\n\x1b[31m*------------------------------------------*\x1b[0m\nI have problems updating your bot to the new filesystem.\nPlease restart the bot. If you still encounter issues:\n\nPlease either download and setup the bot manually again (https://github.com/HerrEurobeat/steam-comment-service-bot/)\nor open an issue (https://github.com/HerrEurobeat/steam-comment-service-bot/issues) and include the errors\n(*only* if you have no GitHub account message ${extdata.mestr}#0975 on Discord).\n\x1b[31m*------------------------------------------*\x1b[0m\n\nError: \n${err}\n`, true) 
        }

    } else if (Object.keys(config).includes("botsgroupid")) { //this has to trigger if user was on version <2.7
        if (config.botsgroupid != "") {
            logger("info", "Applying 2.7 compatibility changes...")
            const xml2js = require("xml2js")
            Object.keys(config).push("botsgroup") //add new key

            try {
                var output = ""

                https.get(`https://steamcommunity.com/gid/${config.botsgroupid}/memberslistxml/?xml=1`, function(res) { //get group64id from code to simplify config
                    res.on('data', function (chunk) {
                        output += chunk });

                    res.on('end', () => {
                        new xml2js.Parser().parseString(output, function(err, result) {
                            if (err) logger("error", "error parsing botsgroupid xml: " + err)
                            config.botsgroup = `https://steamcommunity.com/groups/${result.memberList.groupDetails.groupURL}` //assign old value to new key 

                            fs.writeFile("./config.json", JSON.stringify(output, null, 4), (err) => {
                                if (err) logger("error", 'error writing botsgroupid to botsgroup: ' + err, true)
                            })

                            checkforupdate(true) //force update so that config gets cleaned up
                        }) 
                    }) 
                })
            } catch (err) {
                if (err) logger("error", "error getting groupurl of botsgroupid or getting new config: " + err) 
            }
        } else {
            checkforupdate(true) 
        }

    } else if (!extdata.compatibilityfeaturedone && (extdata.versionstr == "2.8" || extdata.versionstr == "BETA 2.8 b3")) {
        if (fs.existsSync('./updater.js')) {
            logger("info", "Applying 2.8 compatibility changes...")

            fs.unlink("./updater.js", (err) => { //delete old updater.js
                if (err) logger("error", "error deleting old updater.js: " + err, true) 
                checkforupdate(true, null, true) 
            }) 
        } else {
            checkforupdate(true, null, true) 
        }

    } else if (!extdata.compatibilityfeaturedone && (extdata.version == "2100" || extdata.versionstr == "BETA 2.10 b5")) {
        logger("info", "Applying 2.10 compatibility changes...")

        if (fs.existsSync('./src/lastcomment.json')) {     
            const nedb = require("@yetzt/nedb")
            const lastcomment = new nedb("./src/lastcomment.db")
            const lastcommentjson = require("./lastcomment.json")

            lastcomment.loadDatabase((err) => {
                if (err) return logger("error", "Error creating lastcomment.db database! Error: " + err, true)
                logger("info", "Successfully created lastcomment database.", false, true) 
            })

            Object.keys(lastcommentjson).forEach((e) => {
                lastcomment.insert({ id: e, time: lastcommentjson[e].time }, (err) => {
                    if (err) logger("error", "Error adding lastcomment.json entries to new lastcomment database! This is not good.\nError: " + err, true)
                }) 
            })

            fs.unlink("./src/lastcomment.json", (err) => { //delete lastcomment.json
                if (err) logger("error", "error deleting lastcomment.json: " + err, true) 
            })
        }

        logger("info", "I will now update again. Please wait a moment...")
        checkforupdate(true, null, true)

    } else if (!extdata.compatibilityfeaturedone && extdata.version == "2103" && config.globalcommentcooldown != 10) {
        config.globalcommentcooldown = config.globalcommentcooldown / 60000

        fs.writeFile('./config.json', JSON.stringify(config, null, 4), (err) => { 
            if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true)
        })

        extdata.compatibilityfeaturedone = true

        fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => { 
            if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true)
        })

        checkforupdate() //check will start the bot afterwards

    } else if (!extdata.compatibilityfeaturedone && extdata.version == "2104") {
        let logininfo = require("../logininfo.json")
        
        config.maxComments = Object.keys(logininfo).length * config.repeatedComments //calculate new value which is just amount_of_accounts * repeatedComments
        config.maxOwnerComments = config.maxComments //set max comments allowed for owners to the same value - user can configure it differently later if he/she/it wishes to
        delete config.repeatedComments //remove value from config as it got removed with 2.10.4

        var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; 
        }, 4)
            .replace(/"\[/g, '[')
            .replace(/\]"/g, ']')
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        fs.writeFile('./config.json', stringifiedconfig, (err) => { 
            if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true)
        })

        extdata.compatibilityfeaturedone = true //set compatibilityfeaturedone to true here because we don't need to make another force update through checkforupdate() which would be necessary in order to set it to true from there

        fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => { 
            if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true)
        })

        checkforupdate() //check will start the bot afterwards

    } else {
        if (releasemode == "beta-testing") logger("", "\x1b[0m[\x1b[31mNotice\x1b[0m] Your updater and bot is running in beta mode. These versions are often unfinished and can be unstable.\n         If you would like to switch, open data.json and change 'beta-testing' to 'master'.\n         If you find an error or bug please report it: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose\n", true)
        checkforupdate() //check will start the bot afterwards
    }
} */