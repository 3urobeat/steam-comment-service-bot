//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Checking for updates, updating the bot's files and starting the controller.js.

const fs = require('fs')

//Quickly check if user forgot to run npm install and display custom error message
if (!fs.existsSync('./node_modules/steam-user') || !fs.existsSync('./node_modules/steamcommunity')) {
    console.log(`\n\n\x1b[31mIt seems like you haven't installed the needed npm packages yet.\nPlease run the following command in this terminal once: 'npm install'\nAborting...\x1b[0m\n`)
    process.exit(0) 
}

const https = require("https")
const logger = require("output-logger")
const download = require("download")

//Configure my logging library (https://github.com/HerrEurobeat/output-logger#options-1)
logger.options({
    msgstructure: "[date | type] message",
    paramstructure: ["type", "str", "nodate", "remove"]
})


var oldconfig = {} //obj that can get populated by restart data to keep config through restarts
var skippedaccounts = [] //array to save which accounts have been skipped to skip them automatically when restarting
var botisloggedin = false
var activeupdate = false
var releasemode = "master" //will be changed if data.json has set something else but is defined here with a "default" value to make eslint happy
var lastupdatecheckinterval = Date.now()

var config = {} //set those 3 here already to an empty obj to make eslint happy
var cache = {}
var extdata = {}


//start.js restart function calls this function and provides any data that should be kept over restarts
var restartdata = (data) => {
    if (!Object.keys(data).includes("skippedaccounts")) return; //stop any further execution if data structure is <2.10.4 (only an array containing skippedaccounts)

    if (data.oldconfig) oldconfig = data.oldconfig //eslint-disable-line
    module.exports.skippedaccounts = data.skippedaccounts
}


//Modify original setInterval function to be able to track all intervals being set which allows the restart function to clear all intervals (Issue reference: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/94)
//Credit for the idea: https://stackoverflow.com/a/8524313
global.intervalList = []
global.timeoutList = []

//Declare oldSetInterval only if it isn't set already. Global vars aren't getting reset during restart and setting this again would lead to a circular statement (if that's the right
// term for Zirkelschluss in German) which causes the function below to run like a thousand times and cause a MaxListenersExceededWarning (omg I feel so smart rn it's unbelievable)
if (!global.oldSetInterval) global.oldSetInterval = setInterval;
if (!global.oldSetTimeout) global.oldSetTimeout = setTimeout; 

global.setInterval = function(code, delay) {
    var retval = global.oldSetInterval(code, delay);
    global.intervalList.push(retval);
    return retval;
};

global.setTimeout = function(code, delay) {
    var retval = global.oldSetTimeout(code, delay);
    global.timeoutList.push(retval);
    return retval;
};


//Should keep the bot at least from crashing
process.on('unhandledRejection', (reason) => {
    logger("error", `Unhandled Rejection Error! Reason: ${reason.stack}`, true) });
process.on('uncaughtException', (reason) => {
    logger("error", `Uncaught Exception Error! Reason: ${reason.stack}`, true) });


/**
 * Comments with all bot accounts on one profile.
 * @param {String} url The folder/file ending of the GitHub URL
 * @param {String} name Filename.Ending of the file
 * @param {Boolean} compatibilityfeaturedone Update function parameter passthrough
 * @param {any} callback Response when function finished
 */
function updatesinglefile(url, name, compatibilityfeaturedone, callback) {
    let path = `./${url}`
    var output = ""

    try {
        logger("info", `Updating ${name}...`, true)
        logger("", `Getting ${name} content from GitHub...`, false, true)

        https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/${url}`, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                output += chunk });

            res.on('end', () => {
                if (name.includes(".json")) { //Parse data differently when file is a json file
                    logger("", `Parsing new json data...`, false, true)
                    output = JSON.parse(output)

                    if (name == "config.json") { //Special code for config.json to transfer user changes
                        logger("", `Transfering your changes to new config...`, false, true)
                        Object.keys(output).forEach(e => {
                            if (!Object.keys(config).includes(e)) return; //config value seems to be new
                            output[e] = config[e]
                        }) 
                    }

                    if (name == "data.json") { //Special code for data.json to keep 4 values
                        if (Object.keys(extdata).length > 2) { //Only do this if the data.json update call originates from the updater and not from the integrity check
                            if (compatibilityfeaturedone) output.compatibilityfeaturedone = true
                            output.urlrequestsecretkey = extdata.urlrequestsecretkey
                            output.timesloggedin = extdata.timesloggedin
                            output.totallogintime = extdata.totallogintime
                        } 
                    }

                    logger("", `Writing new data to ${name}...`, false, true)
                    fs.writeFile(path, JSON.stringify(output, null, 4), err => {
                        if (err) {
                            logger("error", `Error writing ${name}: ${err}`, true) 
                            if (name == "data.json") return logger("error", "\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true); 
                        }
                        callback() 
                    })

                } else {
                    logger("", `Writing new code to ${name}...`, false, true)

                    fs.writeFile(path, output, err => {
                        if (err) logger("error", `Error writing ${name}: ${err}`, true)
                        callback(); 
                    })
                }
            }) 
        });
    } catch (err) { 
        logger("error", `get ${name} function Error: ${err}`, true)
        if (name == "data.json") return logger("error", "\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true); 
    }
}

/**
 * Checks for an available update from the GitHub repo
 * @param {Boolean} forceupdate Force an update
 * @param {Object} responseSteamID If defined bot0 will respond to that steamID telling if an update was found
 * @param {Boolean} compatibilityfeaturedone Only works with forceupdate! Changes compatibilityfeaturedone in data.json to true
 */
var checkforupdate = (forceupdate, responseSteamID, compatibilityfeaturedone) => {
    try {
        /* ------------------ Check for new version ------------------ */
        logger("info", `Checking for update in ${releasemode} branch...`, false, true)
        var httpsrequest = https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/data.json`, function(res) {
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                var onlineversion = JSON.parse(chunk).version
                var onlineversionstr = JSON.parse(chunk).versionstr

                module.exports.onlinemestr = JSON.parse(chunk).mestr //get mestr and aboutstr from GitHub to check for modification
                module.exports.onlineaboutstr = JSON.parse(chunk).aboutstr

                if (onlineversion > extdata.version || forceupdate == true || !onlineversionstr.includes("BETA") && extdata.versionstr.includes("BETA") || onlineversionstr.includes("BETA") && !extdata.versionstr.includes("BETA")) { //version number greater, forceupdate is true, release or beta version available?
                    logger("", "", true)
                    logger("", `\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${extdata.versionstr}\x1b[0m | New version: \x1b[32m${onlineversionstr}\x1b[0m`, true)
                    logger("", "", true)

                    var config = require("../config.json")

                    if (responseSteamID) { 
                        require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `Update available! Your version: ${extdata.versionstr} | New version: ${onlineversionstr}`)

                        if (config.disableautoupdate == true && !forceupdate) { 
                            require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, "You have turned automatic updating off. You need to confirm the update in the console!") 
                        }
                    }

                    /* ------------------ Check for permission to update ------------------ */
                    if (config.disableautoupdate == false || forceupdate) { //check if the user has disabled the automatic updater or an update was forced
                        logger("info", 'Starting the automatic updater...')
                        startupdate();
                    } else { //user has it disabled, ask for confirmation

                        if (botisloggedin == false || responseSteamID) { //only ask on start (or when user checked for an update from the Steam chat), otherwise this will annoy the user

                            logger("", `\x1b[4mWhat's new:\x1b[0m ${JSON.parse(chunk).whatsnew}\n`, true)
                            logger("info", "You have disabled the automatic updater.", true, true) //Log once for output.txt (gets overwritten by the next line)
                            logger("", `\x1b[93mWould you like to update now?\x1b[0m [y/n] `, true, true) //Split into two logger calls so that remove works correctly

                            process.stdout.write(`You have disabled the automatic updater.\n\x1b[93mWould you like to update now?\x1b[0m [y/n] `)
                            var updatestdin = process.openStdin();

                            let noresponsetimeout = setTimeout(() => { //skip update after 7.5 sec if the user doesn't respond
                                updatestdin.pause()
                                process.stdout.write("\x1b[31mX\n") //write a X behind the y/n question
                                logger("info", "\x1b[93mStarting the bot since you didn't reply in 7.5 seconds...\x1b[0m\n\n", true)

                                require('./controller.js')
                                botisloggedin = true
                            }, 7500);

                            updatestdin.addListener('data', text => {
                                var response = text.toString().trim()
                                if (response == "y") startupdate();
                                    else { 
                                        require('./controller.js'); 
                                        botisloggedin = true //start bot or do nothing
                                    }

                                updatestdin.pause() //stop reading
                                clearTimeout(noresponsetimeout) 
                            })
                        }
                    }

                    /* ------------------ Check stuff & Initiate updater & log out ------------------ */
                    /* eslint-disable no-inner-declarations */
                    function startupdate() {
                        module.exports.activeupdate = true //block new comment requests by setting active update to true and exporting it

                        if (botisloggedin) { //if bot is already logged in we need to check for ongoing comment processes and log all bots out when finished

                            logger("", "", true)
                            logger("info", `Bot is logged in. Checking for active comment process...`, false, true)

                            var controller = require('./controller.js')
                            var bot = require('./bot.js')
                            if (bot.activecommentprocess.length != 0) {
                                logger("info", "Waiting for an active comment process to finish...")

                                if (responseSteamID) require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `/me Waiting for an active comment process to finish...`)
                            }

                            var activecommentinterval = setInterval(() => { //check if a comment request is being processed every 2.5 secs
                                if (bot.activecommentprocess.length == 0) { //start logging off accounts when no comment request is being processed anymore
                                    logger("info", "Active comment process finished. Starting to update...", true)
                                    if (responseSteamID) require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `/me Active comment process finished. Starting to update...`)

                                    controller.relogAfterDisconnect = false; //Prevents disconnect event (which will be called by logOff) to relog accounts

                                    Object.keys(controller.botobject).forEach((e) => {
                                        logger("info", `Logging off bot${e}...`, false, true)
                                        controller.botobject[e].logOff() //logging off each account
                                    })

                                    setTimeout(() => {
                                        botisloggedin = false

                                        downloadupdate(); //start update
                                        logger("info", `Starting to update...`, false, true)
                                        clearInterval(activecommentinterval);
                                    }, 2500) 
                                }
                            }, 2500);
                        } else {
                            downloadupdate();
                        } 
                    }

                    /* ------------------ Start updating files ------------------ */
                    function downloadupdate() {
                        const url = `https://github.com/HerrEurobeat/steam-comment-service-bot/archive/${releasemode}.zip`
                        const dontdelete = ["./.git", "./src/cache.json", "./src/lastcomment.db", "./accounts.txt", "./customlang.json", "./logininfo.json", "./output.txt", "./proxies.txt", "./quotes.txt"]

                        //Process dontdelete array in order to include parent folders of a dontdelete file in the array aswell
                        dontdelete.forEach((e) => {
                            var str = e.split("/")
                            str.splice(0, 1) //remove '.'
                        
                            str.forEach((k, j) => {
                                if (j == 0) return; //the path './' won't deleted either way so we can ignore it
                                
                                var pathtopush = "./" + str.slice(0, j).join("/")
                                if (!dontdelete.includes(pathtopush)) dontdelete.push(pathtopush) //construct path from first part of the path until this iteration
                            })
                        })

                        //Save config settings and extdata values by cloning them into a new object
                        const oldconfig = Object.assign(config)
                        const oldextdata = Object.assign(extdata)

                        //Start downloading new files
                        logger("", "", true)
                        logger("", "\x1b[33mDownloading new files...\x1b[0m", true)
                        download(url, "./", { extract: true }).then(() => { //the download library makes downloading and extracting easier
                            //Scan directory recursively to get an array of all paths in this directory
                            var scandir = function(dir) { //Credit for this function before I modified it: https://stackoverflow.com/a/16684530/12934162
                                var results = [];
                                var list = fs.readdirSync(dir);

                                list.forEach(function(file) {
                                    file = dir + '/' + file;

                                    var stat = fs.statSync(file);

                                    results.push(file); //push the file and folder in order to avoid an ENOTEMPTY error and push it before the recursive part in order to have the folder above its files in the array to avoid ENOENT error

                                    if (stat && stat.isDirectory()) results = results.concat(scandir(file)); //call this function recursively again if it is a directory
                                });
                                return results;
                            }

                            let files = scandir(".") //scan the directory of this installation
                            
                            //Delete old files except files and folders in dontdelete
                            logger("", "\x1b[33mDeleting old files...\x1b[0m", true)
                            files.forEach((e, i) => {
                                if (fs.existsSync(e) && !dontdelete.includes(e) && !e.includes(`./steam-comment-service-bot-${releasemode}`) && !e.includes("./node_modules")) { //respect dontdelete, the fresh downloaded files and the node_modules folder
                                    fs.rmSync(e, { recursive: true })
                                }
                        
                                //Continue if finished
                                if (files.length == i + 1) {
                                    //Move new files out of directory
                                    let newfiles = scandir(`./steam-comment-service-bot-${releasemode}`) //scan the directory of the new installation
                        
                                    logger("", "\x1b[33mMoving new files...\x1b[0m", true)
                                    newfiles.forEach((e, i) => {
                                        let eCut = e.replace(`steam-comment-service-bot-${releasemode}/`, "") //eCut should resemble the same path but how it would look like in the base directory

                                        if (fs.statSync(e).isDirectory() && !fs.existsSync(eCut)) fs.mkdirSync(eCut) //create directory if it doesn't exist         
                                        if (!fs.existsSync(eCut) || !fs.statSync(eCut).isDirectory() && !dontdelete.includes(eCut)) fs.renameSync(e, eCut) //only rename if not directory and not in dontdelete. We need to check first if it exists to avoid a file not found error with isDirectory()
                        
                                        //Continue if finished
                                        if (newfiles.length == i + 1) {
                                            fs.rmSync(`./steam-comment-service-bot-${releasemode}`, { recursive: true }) //remove the remains of the download folder

                                            //Custom update rules for a few files
                                            //config.json
                                            logger("", `\x1b[33mClearing cache of config.json...\x1b[0m`, true)

                                            delete require.cache[require.resolve("../config.json")] //delete cache
                                            let newconfig = require("../config.json")

                                            logger("", `\x1b[33mTransfering your changes to new config.json...\x1b[0m`, true)
                                            
                                            Object.keys(newconfig).forEach(e => {
                                                if (!Object.keys(oldconfig).includes(e)) return; //config value seems to be new so don't bother trying to set it to something (which would probably be undefined anyway)

                                                newconfig[e] = oldconfig[e] //transfer setting
                                            })

                                            logger("", `\x1b[33mWriting new data to config.json...\x1b[0m`, true)
                                            fs.writeFile("./config.json", JSON.stringify(newconfig, null, 4), err => { //write the changed file
                                                if (err) {
                                                    logger("error", `Error writing changes to config.json: ${err}`, true)
                                                }
                                            })

                                            //data.json
                                            logger("", `\x1b[33mClearing cache of data.json...\x1b[0m`, true)

                                            delete require.cache[require.resolve("./data.json")] //delete cache
                                            let newextdata = require("./data.json")

                                            logger("", "\x1b[33mTransfering changes to new data.json...\x1b[0m", true)

                                            if (Object.keys(extdata).length > 2) { //Only do this if the data.json update call originates from the updater and not from the integrity check
                                                if (compatibilityfeaturedone) newextdata.compatibilityfeaturedone = true

                                                newextdata.urlrequestsecretkey = oldextdata.urlrequestsecretkey
                                                newextdata.timesloggedin = oldextdata.timesloggedin
                                                newextdata.totallogintime = oldextdata.totallogintime
                                            }

                                            logger("", `\x1b[33mWriting new data to data.json...\x1b[0m`, true)
                                            fs.writeFile("./src/data.json", JSON.stringify(newextdata, null, 4), err => { //write the changed file
                                                if (err) {
                                                    logger("error", `Error writing changes to data.json: ${err}`, true)
                                                    logger("error", "\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true); 
                                                    return;
                                                }
                                            })

                                            
                                            //Update/Install new packages according to new package.json
                                            npmupdate();
                                        }
                                    })
                                } 
                            }) 
                        }).catch((err) => {
                            if (err) logger("error", "Error while trying to download and update: " + err.stack, true) 
                        })
                    }

                    //Code by: https://github.com/HerrEurobeat/

                    function npmupdate() {
                        try {
                            const { exec } = require('child_process'); //wanted to do it with the npm package but that didn't work out (BETA 2.8 b2)
   
                            logger("info", "\x1b[33mUpdating packages with npm...\x1b[0m", true)
                            exec('npm install', (err, stdout) => { //eslint-disable-line
                                if (err) {
                                    logger("error", "Error running the npm install command: " + err, true)
                                    return; 
                                }

                                //logger("info", `NPM Log:\n${stdout}`, true) //entire log (not using it rn to avoid possible confusion with vulnerabilities message)

                                logger("", "", true)
                                logger("", "\x1b[32mUpdate finished. Restarting myself in 5 seconds...\x1b[0m", true);
                                setTimeout(() => {
                                    module.exports.activeupdate = false
                                    require('../start.js').restart({ skippedaccounts: skippedaccounts, oldconfig: config }, true); //restart the bot and remember clone of oldconfig
                                }, 5000); 
                            })                                    
                        } catch (err) { 
                            logger("error", 'update npm packages Error: ' + err, true) 
                        }
                    }

                } else {
                    logger("info", `No available update found. (online: ${onlineversionstr} | local: ${extdata.versionstr})`, false, true)
                    if (botisloggedin == false) require('./controller.js'); botisloggedin = true //no update, start bot
                    if (responseSteamID) require('./controller.js').botobject[0].chat.sendFriendMessage(responseSteamID, `No available update in the ${releasemode} branch found.`)
                }
            }) 
        })

        lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms

        httpsrequest.on("error", function(err) {
            logger("warn", "\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't check for an available update because either GitHub is down or your internet isn't working.\n          Error: " + err, true)

            if (botisloggedin == false) {
                logger("info", "\nTrying to start the bot anyway in 5 seconds...", true)
                setTimeout(() => {
                    require('./controller.js'); 
                    botisloggedin = true //try to start bot anyway
                }, 5000);
            }
        })
    } catch (err) {
        logger("error", 'checkforupdate/update function Error: ' + err, true) 
    }
}



logger("", "\nBootup sequence started...", true, true) //mark new execution in output.txt
logger("info", `Using node.js version ${process.version}...`, false, true)
logger("info", `Running on ${process.platform}...`, false, true)

/* ------------ File integrity checks: ------------ */
//Check cache.json
logger("info", "Checking if cache.json is valid...", false, true)
try {
    cache = require("./cache.json")
} catch (err) {
    if (err) {
        logger("warn", "Your cache.json is broken/not existing. Trying to write/create...", false, true)

        fs.writeFile('./src/cache.json', "{}", (err) => { //write empty valid json
            if (err) {
                logger("error", "Error writing {} to cache.json.\nPlease do this manually: Go into 'src' folder, open 'cache.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                process.exit(0) //abort since writeFile was unable to write and any further execution would crash
            } else {
                logger("info", "Successfully cleared/created cache.json.\n", false, true)
                cache = require("./cache.json")
            }
        })
    }
} finally {
    datajsoncheck(); //Continue startup
}

//Check data.json
function datajsoncheck() {
    logger("info", "Checking if data.json is valid...", false, true)
    try {
        extdata = require("./data.json")
        releasemode = extdata.branch
    } catch (err) {
        if (err) { //Corrupted!
            logger("warn", "data.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)
    
            fs.writeFile('./src/data.json', JSON.stringify(cache.datajson, null, 2), (err) => { //write last backup to it from cache.json
                if (err) {
                    logger("error", "Error writing data to data.json.\nPlease do this manually: Visit https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/data.json, put everything into the file and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                    process.exit(0) //abort since writeFile was unable to write and any further execution would crash
    
                } else {
                    //Test backup:
                    logger("info", "Testing data.json backup...", false, true)
    
                    try { //Yes, this is a try catch inside a try catch please forgive me
                        extdata = require("./data.json")
                        releasemode = extdata.branch
                        logger("info", "Successfully restored backup and written it to data.json!\n", true)
                        compatibilityfeatures(); //Continue startup
    
                    } catch (err) { //Worst case, even the backup seems to be broken
                        logger("warn", "Backup seems to be broken/not available! Pulling file from GitHub...", true)
    
                        updatesinglefile("src/data.json", "data.json", function() {
                            logger("info", "Successfully pulled new data.json from GitHub.\n", true)
                            extdata = require("./data.json")
                            releasemode = extdata.branch 
                        }) 
                    }
                } 
            })
        }
    } finally {
        configjsoncheck(); //Continue startup
    }
}

//Check config.json
function configjsoncheck() {
    logger("info", "Checking if config.json is valid...", false, true)
    try {
        config = require("../config.json")
    } catch (err) {
        if (err) { //Corrupted!
            config = {} //Set this real quick to prevent a further error and it will be refreshed after restoring from the backup
            logger("warn", "config.json seems to have lost it's data/is corrupted. Trying to restore from backup...", true)

            fs.writeFile('./config.json', JSON.stringify(cache.configjson, null, 2), (err) => { //write last backup to it from cache.json
                if (err) {
                    logger("error", "Error writing data to config.json.\nPlease do this manually: Visit https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json, put everything into the file and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                    process.exit(0) //abort since writeFile was unable to write and any further execution would crash

                } else {
                    //Test backup:
                    logger("info", "Testing config.json backup...", false, true)

                    try { //Yes, this is a try catch inside a try catch please forgive me
                        config = require("../config.json")
                        logger("info", "Successfully restored backup and written it to config.json!\n", true)

                    } catch (err) { //Worst case, even the backup seems to be broken
                        logger("warn", "Backup seems to be broken/not available! Pulling file from GitHub...", true)

                        updatesinglefile("config.json", "config.json", function() {
                            logger("info", "Successfully pulled new config.json from GitHub. Please configure it again!\n", true)
                            config = require("../config.json") 
                        }) 
                    }
                } 
            })
        }
    } finally {
        compatibilityfeatures(); //Continue startup
    }
}

function compatibilityfeatures() {
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
}

//Export some stuff
module.exports={
    restartdata,
    skippedaccounts,
    checkforupdate,
    activeupdate,
    lastupdatecheckinterval
}

setInterval(() => { //update interval
    if (Date.now() > lastupdatecheckinterval) {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error", "error checking output for update notice: " + err)
            if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice
                checkforupdate() 
            } 
        })
    }
}, 300000); //5 min in ms

//Code by: https://github.com/HerrEurobeat/ 
