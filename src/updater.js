//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Checking for updates, updating the bot's files and starting the controller.js.

const fs = require('fs')
const https = require("https")
const readline = require("readline")
var skippedaccounts = [] //array to save which accounts have been skipped to skip them automatically when restarting
var botisloggedin = false
var activeupdate = false
var lastupdatecheckinterval = Date.now()

var logger = (str, nodate, remove) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` } //make errors red in console
    if (str.toLowerCase().includes("updating")) { var str = `\x1b[33m${str}\x1b[0m` } //make errors red in console

    if (nodate) { var string = str; } else {
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}` }

    if (remove) {
        readline.clearLine(process.stdout, 0) //0 clears entire line
        process.stdout.write(`${string}\r`)
    } else { 
        readline.clearLine(process.stdout, 0)
        console.log(`${string}`) }

    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var restartdata = (data) => {
    module.exports.skippedaccounts = data }

/**
 * Comments with all bot accounts on one profile.
 * @param {String} url The folder/file ending of the GitHub URL
 * @param {String} name Filename.Ending of the file
 * @param {any} callback Response when function finished
 */
function downloadandupdate(url, name, callback) {
    let path = `./${url}`
    output = ""
    try {
        logger(`Updating ${name}...`, true)
        logger(`Getting ${name} code from GitHub...`, false, true)
        https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/${url}`, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                output += chunk });

            res.on('end', () => {
                if (name.includes(".json")) { //Parse data differently when file is a json file
                    logger(`Parsing new json data...`, false, true)
                    output = JSON.parse(output)

                    if (name == "config.json") { //Special code for config.json to transfer user changes
                        logger(`Transfering your changes to new config...`, false, true)
                        Object.keys(output).forEach(e => {
                            if (!Object.keys(config).includes(e)) return; //config value seems to have gotten deleted
                            output[e] = config[e]
                        }) }

                    if (name == "data.json") { //Special code for data.json to keep 4 values
                        if (Object.keys(extdata).length > 2) { //Only do this if the data.json update call originates from the updater and not from the integrity check
                            output.compatibilityfeaturedone = extdata.compatibilityfeaturedone
                            output.urlrequestsecretkey = extdata.urlrequestsecretkey
                            output.timesloggedin = extdata.timesloggedin
                            output.totallogintime = extdata.totallogintime
                        } }

                    logger(`Writing new data to ${name}...`, false, true)
                    fs.writeFile(path, JSON.stringify(output, null, 4), err => {
                        if (err) {
                            logger(`error writing ${name}: ${err}`, true) 
                            if (name == "data.json") return logger("\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true); }
                        callback() })

                } else {
                    logger(`Writing new code to ${name}...`, false, true)
                    fs.writeFile(path, output, err => {
                        if (err) logger(`error writing ${name}: ${err}`, true)
                        callback(); })
                }
            }) 
        });
    } catch (err) { 
        logger(`get ${name} function Error: ${err}`, true)
        if (name == "data.json") return logger("\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true); }
}

var checkforupdate = (forceupdate, responseSteamID, compatibilityfeaturedone) => {
    try {
        /* ------------------ Check for new version ------------------ */
        logger(`Checking for update in ${releasemode} branch...`, false, true)
        var httpsrequest = https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/data.json`, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                var onlineversion = JSON.parse(chunk).version //parse version number from get request
                module.exports.onlinemestr = JSON.parse(chunk).mestr //get mestr and aboutstr from GitHub to check for modification
                module.exports.onlineaboutstr = JSON.parse(chunk).aboutstr
                if (onlineversion > extdata.version || forceupdate == true || releasemode == "beta-testing" && !onlineversion.includes("BETA") && extdata.version.includes("BETA") || releasemode == "beta-testing" && onlineversion.includes("BETA") && !extdata.version.includes("BETA")) { //version number greater or forceupdate is true?
                    logger("", true)
                    logger(`\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${extdata.version}\x1b[0m | New version: \x1b[32m${onlineversion}\x1b[0m`, true)
                    logger("", true)

                    var config = require("../config.json")

                    if (responseSteamID) { require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `Update available! Your version: ${extdata.version} | New version: ${onlineversion}`)
                        if (config.disableautoupdate == true && !forceupdate) { require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, "You have turned automatic updating off. You need to confirm the update in the console!") }}

                    /* ------------------ Check for permission to update ------------------ */
                    if (config.disableautoupdate == false || forceupdate) { //check if the user has disabled the automatic updater or an update was forced
                        logger('Starting the automatic updater...')
                        startupdate();
                    } else { //user has it disabled, ask for confirmation
                        if (botisloggedin == false || responseSteamID) { //only ask on start (or when user checked for an update from the Steam chat), otherwise this will annoy the user
                            logger(`\x1b[4mWhat's new:\x1b[0m ${JSON.parse(chunk).whatsnew}\n`, true)
                            process.stdout.write(`You have disabled the automatic updater.\n\x1b[93mWould you like to update now?\x1b[0m [y/n] `)
                            var updatestdin = process.openStdin();

                            let noresponsetimeout = setTimeout(() => { //skip update after 7.5 sec if the user doesn't respond
                                updatestdin.pause()
                                process.stdout.write("\x1b[31mX\n\x1b[93mStarting the bot since you haven't replied in 7.5 seconds...\x1b[0m\n\n", true)

                                require('./controller.js')
                                botisloggedin = true
                            }, 7500);

                            updatestdin.addListener('data', text => {
                                var response = text.toString().trim()
                                if (response == "y") startupdate();
                                    else { require('./controller.js'); botisloggedin = true } //start bot or do nothing

                                updatestdin.pause() //stop reading
                                clearTimeout(noresponsetimeout) })
                        }
                    }

                    /* ------------------ Check stuff & Initiate updater & log out ------------------ */
                    function startupdate() {
                        module.exports.activeupdate = true //block new comment requests by setting active update to true and exporting it

                        if (botisloggedin) { //if bot is already logged in we need to check for ongoing comment processes and log all bots out when finished

                            logger(`Bot is logged in. Checking for active comment process...`, false, true)

                            var controller = require('./controller.js')
                            if (controller.activecommentprocess.length != 0) logger("Waiting for an active comment process to finish...")

                            var activecommentinterval = setInterval(() => { //check if a comment request is being processed every 2.5 secs
                                if (controller.activecommentprocess.length == 0) { //start logging off accounts when no comment request is being processed anymore
                                    logger("Active comment process finished. Starting to update...", true)
                                    Object.keys(controller.botobject).forEach((e, i) => {
                                        logger(`Logging off bot${e}...`, false, true)
                                        controller.botobject[e].logOff() }) //logging off each account

                                    setTimeout(() => {
                                        botisloggedin = false

                                        updaterjs(); //start update
                                        logger(`Starting to update...`, false, true)
                                        clearInterval(activecommentinterval);
                                    }, 2500) }
                            }, 2500);
                        } else {
                            updaterjs();
                        } }

                    /* ------------------ Start updating files ------------------ */
                    function updaterjs() { //update updater first to fix issues in updater
                        downloadandupdate("src/updater.js", "updater.js", function() { botjs(); }) }

                    function botjs() {
                        downloadandupdate("src/bot.js", "bot.js", function() { startjs(); }) }

                    function startjs() {
                        downloadandupdate("start.js", "start.js", function() { packagejson(); }) }

                    function packagejson() {
                        logger(`Clearing package.json data...`, false, true)
                        fs.writeFile("./package.json", "{}", err => {
                            if (err) logger(err, true) })
                        downloadandupdate("package.json", "package.json", function() { packagelockjson(); }) }

                    function packagelockjson() {
                        logger(`Clearing package-lock.json data...`, false, true)
                        fs.writeFile("./package-lock.json", "{}", err => {
                            if (err) logger(err, true) })
                        downloadandupdate("package-lock.json", "package-lock.json", function() { configjson(); }) }

                    //Code by: https://github.com/HerrEurobeat/

                    function configjson() {
                        downloadandupdate("config.json", "config.json", function() { controllerjs(); }) }

                    function controllerjs() {
                        downloadandupdate("src/controller.js", "controller.js", function() { datajson(); }) }

                    function datajson() {
                        if (compatibilityfeaturedone) extdata.compatibilityfeaturedone = true //prevents compatibility feature from running again
                        downloadandupdate("src/data.json", "data.json", function() { npmupdate(); }) }

                    function npmupdate() {
                        try {
                            const { exec } = require('child_process');
   
                            logger("Updating packages with npm...", true)
                            exec('npm install', (err, stdout) => { //wanted to do it with the npm package but that didn't work out (BETA 2.8 b2)
                                if (err) {
                                    logger("Error running the npm install command: " + err)
                                    return; }

                                logger(`NPM Log:\n${stdout}`, true) //entire log

                                logger("\x1b[32mUpdate finished. Restarting myself in 5 seconds...\x1b[0m", true);
                                setTimeout(() => {
                                    module.exports.activeupdate = false
                                    require('../start.js').restart(skippedaccounts, true); //restart the bot
                                }, 5000); })                                    
                        } catch (err) { logger('update npm packages Error: ' + err, true) }}

                } else {
                    logger(`No available update found. (online: ${onlineversion} | local: ${extdata.version})`, false, true)
                    if (botisloggedin == false) require('./controller.js'); botisloggedin = true //no update, start bot
                    if (responseSteamID) require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `No available update in the ${releasemode} branch found.`)
                }
            }) })

            lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms

            httpsrequest.on("error", function(err) {
                logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't check for an available update because either GitHub is down or your internet isn't working.\n          Error: " + err, true)
                if (botisloggedin == false) {
                    logger("\nTrying to start the bot anyway in 5 seconds...", true)
                    setTimeout(() => {
                        require('./controller.js'); 
                        botisloggedin = true //try to start bot anyway
                    }, 5000);
            } })
        } catch (err) {
            logger('checkforupdate/update function Error: ' + err, true) }}

logger("\nBootup sequence started...", true, true) //mark new execution in output.txt
logger(`Using node.js version ${process.version}...`, false, true)

/* ------------ File integrity checks: ------------ */
//Check cache.json
try {
    cache = require("./cache.json")
    datajsoncheck();
} catch (err) {
    if (err) {
        readytostart = false //let the interval wait for the recovery to finish
        logger("Your cache.json is broken/not existing. Trying to write/create...", false, true)

        fs.writeFile('./src/cache.json', "{}", (err) => { //write empty valid json
            if (err) { 
                logger("Error writing {} to cache.json.\nPlease do this manually: Go into 'src' folder, open 'cache.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                process.exit(0) //abort since writeFile was unable to write and any further execution would crash
            } else {
                logger("Successfully cleared/created cache.json.\n", false, true)
                cache = require("./cache.json")
                datajsoncheck();
            } })
    }}

//Check data.json
function datajsoncheck() {
    logger("Checking if data.json is valid...", false, true)
    try {
        extdata = require("./data.json")
        releasemode = extdata.branch
        configjsoncheck();
    } catch (err) {
        if (err) { //Corrupted!
            readytostart = false //let the interval wait for the recovery to finish
            releasemode = "master" //Set this real quick to prevent a further error and it will be refreshed after restoring from the backup
            logger("data.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)
    
            fs.writeFile('./src/data.json', JSON.stringify(cache.datajson, null, 2), (err) => { //write last backup to it from cache.json
                if (err) {
                    logger("Error writing data to data.json.\nPlease do this manually: Visit https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/data.json, put everything into the file and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                    process.exit(0) //abort since writeFile was unable to write and any further execution would crash
    
                } else {
                    //Test backup:
                    logger("Testing data.json backup...", false, true)
    
                    try { //Yes, this is a try catch inside a try catch please forgive me
                        extdata = require("./data.json")
                        releasemode = extdata.branch
                        logger("Successfully restored backup and written it to data.json!\n", true)
                        compatibilityfeatures(); //Continue startup
    
                    } catch (err) { //Worst case, even the backup seems to be broken
                        logger("Backup seems to be broken/not available! Pulling file from GitHub...", true)
    
                        downloadandupdate("src/data.json", "data.json", function() {
                            logger("Successfully pulled new data.json from GitHub.\n", true)
                            extdata = require("./data.json")
                            releasemode = extdata.branch
                            configjsoncheck() }) } //Continue startup 
                } })
        }}
}

//Check config.json
function configjsoncheck() {
    logger("Checking if config.json is valid...", false, true)
    try {
        config = require("../config.json")
        compatibilityfeatures();
    } catch (err) {
        if (err) { //Corrupted!
            readytostart = false //let the interval wait for the recovery to finish
            config = {} //Set this real quick to prevent a further error and it will be refreshed after restoring from the backup
            logger("config.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)

            fs.writeFile('./config.json', JSON.stringify(cache.configjson, null, 2), (err) => { //write last backup to it from cache.json
                if (err) {
                    logger("Error writing data to config.json.\nPlease do this manually: Visit https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json, put everything into the file and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                    process.exit(0) //abort since writeFile was unable to write and any further execution would crash

                } else {
                    //Test backup:
                    logger("Testing config.json backup...", false, true)

                    try { //Yes, this is a try catch inside a try catch please forgive me
                        config = require("../config.json")
                        logger("Successfully restored backup and written it to config.json!\n", true)
                        compatibilityfeatures(); //Continue startup

                    } catch (err) { //Worst case, even the backup seems to be broken
                        logger("Backup seems to be broken/not available! Pulling file from GitHub...", true)

                        downloadandupdate("config.json", "config.json", function() {
                            logger("Successfully pulled new config.json from GitHub. Please configure it again!\n", true)
                            config = require("../config.json")
                            compatibilityfeatures(); }) } //Continue startup
                } })
        }}
}

function compatibilityfeatures() {
    //Compatibility features
    if (!fs.existsSync('./src')) { //this has to trigger if user was on version <2.6
        try {
            logger("Applying 2.6 compatibility changes...", false, true)
            fs.mkdirSync('./src') 

            fs.writeFile('./src/data.json', '{ "version": 0 }', (err) => { //create data.json to avoid errors
                if (err) logger("error creating data.json: " + err, true) })
            fs.unlink("./bot.js", (err) => { //delete bot.js
                if (err) logger("error deleting bot.js: " + err, true) }) 
            fs.rename("./lastcomment.json", "./src/lastcomment.json", (err) => { //move lastcomment.json
                if (err) logger("error moving lastcomment.json: " + err, true) })

            var logininfo = require('../logininfo.json')

            if (Object.keys(logininfo)[0] == "bot1") { //check if first bot is 1 (old) and not 0
                Object.keys(logininfo).forEach((e, i) => {      
                    Object.defineProperty(logininfo, `bot${i}`, //Credit: https://stackoverflow.com/a/14592469 
                        Object.getOwnPropertyDescriptor(logininfo, e));
                    delete logininfo[e]; })
                
                fs.writeFile("./logininfo.json", JSON.stringify(logininfo, null, 4), err => {
                    if(err) logger("error writing changes to logininfo.json: " + err, true) }) }

            if (config.globalcommentcooldown == 5000) { //check if the user uses default settings and raise 5 to 10 sec
                config.globalcommentcooldown = 10000
                fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                    if (err) logger('error changing default globalcommentcooldown value: ' + err, true) }) }

            setTimeout(() => {
                checkforupdate(true) //force to update again to get files from new structure
            }, 1000);
        } catch(err) {
            logger(`\n\n\x1b[31m*------------------------------------------*\x1b[0m\nI have problems updating your bot to the new filesystem.\nPlease restart the bot. If you still encounter issues:\n\nPlease either download and setup the bot manually again (https://github.com/HerrEurobeat/steam-comment-service-bot/)\nor open an issue (https://github.com/HerrEurobeat/steam-comment-service-bot/issues) and include the errors\n(*only* if you have no GitHub account message ${extdata.mestr}#0975 on Discord).\n\x1b[31m*------------------------------------------*\x1b[0m\n\nError: \n${err}\n`, true) }

    } else if (Object.keys(config).includes("botsgroupid")) { //this has to trigger if user was on version <2.7
        if (config.botsgroupid != "") {
            logger("Applying 2.7 compatibility changes...")
            const xml2js = require("xml2js")
            Object.keys(config).push("botsgroup") //add new key

            try {
                output = ""
                https.get(`https://steamcommunity.com/gid/${config.botsgroupid}/memberslistxml/?xml=1`, function(res) { //get group64id from code to simplify config
                    res.on('data', function (chunk) {
                        output += chunk });

                    res.on('end', () => {
                        new xml2js.Parser().parseString(output, function(err, result) {
                            if (err) logger("error parsing botsgroupid xml: " + err)
                            config.botsgroup = `https://steamcommunity.com/groups/${result.memberList.groupDetails.groupURL}` //assign old value to new key 

                            fs.writeFile("./config.json", JSON.stringify(output, null, 4), (err) => {
                                if (err) logger('error writing botsgroupid to botsgroup: ' + err, true) })
                                checkforupdate(true) //force update so that config gets cleaned up
                        }) }) })
            } catch (err) {
                if (err) logger("error getting groupurl of botsgroupid or getting new config: " + err) }
        } else {
            checkforupdate(true) }

    } else if (!extdata.compatibilityfeaturedone && (extdata.version == "2.8" || extdata.version == "BETA 2.8 b3")) {
        if (fs.existsSync('./updater.js')) {
            logger("Applying 2.8 compatibility changes...")
            fs.unlink("./updater.js", (err) => { //delete old updater.js
                if (err) logger("error deleting old updater.js: " + err, true) 
                checkforupdate(true, null, true) }) 
        } else {
            checkforupdate(true, null, true) }

    } else {
        if (releasemode == "beta-testing") logger("\x1b[0m[\x1b[31mNotice\x1b[0m] Your updater and bot is running in beta mode. These versions are often unfinished and can be unstable.\n         If you would like to switch, open data.json and change 'beta-testing' to 'master'.\n         If you find an error or bug please report it: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose\n", true)
        checkforupdate() } //check will start the bot afterwards

    module.exports={
        restartdata,
        skippedaccounts,
        checkforupdate,
        activeupdate,
        lastupdatecheckinterval
    }
}

setInterval(() => { //update interval
    if (Date.now() > lastupdatecheckinterval) {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error checking output for update notice: " + err)
            if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice
                checkforupdate() } }) }
}, 300000); //5 min in ms

//Code by: https://github.com/HerrEurobeat/ 