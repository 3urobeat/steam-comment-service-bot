//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Controlling bot.js instances, processing instance over-reaching requests, handling web comment requests and saving stuff in variables.

const fs = require('fs');
const https = require('https')
const readline = require("readline")

if (!fs.existsSync('./node_modules/steam-user') || !fs.existsSync('./node_modules/steamcommunity')) { //Quickly check if user forgot to run npm install and display custom error message
    console.log(`\n\n\x1b[31mIt seems like you haven't installed the needed npm packages yet.\nPlease run the following command in this terminal once: "npm install"\nAborting...\x1b[0m\n`)
    process.exit(0) 
}

const SteamID = require('steamid');
const SteamTotp = require('steam-totp');
const xml2js = require('xml2js')
const nedb = require("nedb")

var updater = require('./updater.js')
var b = require('./bot.js');
var logininfo = require('../logininfo.json');
var config = require('../config.json');
var extdata = require('./data.json');
var cache = require('./cache.json')

var communityobject = {}
var botobject = {}
var readyafterlogs = []
var bootstart = 0
var bootstart = new Date();
var steamGuardInputTime = 0
var readyafter = 0
var logindelay = 2500
var proxyShift = 0
var skippednow = [] //array to track which accounts have been skipped
var stoplogin = false;

if (process.platform == "win32") { //set node process name to find it in task manager etc.
    process.title = `${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}` //Windows allows long terminal/process names
} else {
    process.stdout.write(`${String.fromCharCode(27)}]0;${extdata.mestr}'s Steam Comment Service Bot v${extdata.versionstr} | ${process.platform}${String.fromCharCode(7)}`) //sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)
    process.title = `CommentBot` //sets process title in task manager etc.
}

/* ------------ Functions: ------------ */
/**
  * Logs text to the terminal and appends it to the output.txt file.
  * @param {String} str The text to log into the terminal
  * @param {Boolean} nodate Setting to true will hide date and time in the message
  * @param {Boolean} remove Setting to true will remove this message with the next one
  */
var logger = (str, nodate, remove) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) var str = `\x1b[31m${str}\x1b[0m`

    if (nodate) {
        var string = str; 
    } else { //startup messages should have nodate enabled -> filter messages with date when bot is not started
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}`  

        if (readyafter == 0 && !str.toLowerCase().includes("error") && !str.includes('Logging in... Estimated wait time') && !str.includes("What's new:") && remove !== true) { 
            readyafterlogs.push(string); return; 
        }
    }
        
    if (remove) {
        readline.clearLine(process.stdout, 0) //0 clears entire line
        process.stdout.write(`${string}\r`)
    } else { 
        readline.clearLine(process.stdout, 0)
        console.log(`${string}`) 
    }

    //eslint-disable-next-line
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Regex Credit: https://github.com/Filirom1/stripcolorcodes
        if (err) logger('logger function appendFileSync error: ' + err) 
    }) 
}

var steamGuardInputTimeFunc = (arg) => { steamGuardInputTime += arg } //small function to return new value from bot.js

//Either use logininfo.json or accounts.txt:
if (fs.existsSync("./accounts.txt")) {
    var data = fs.readFileSync("./accounts.txt", "utf8").split("\n")

    if (data != "") {
        logger("Accounts.txt does exist and is not empty - using it instead of logininfo.json.", false, true)

        logininfo = {} //Empty other object
        data.forEach((e, i) => {
            e = e.split(":")
            e[e.length - 1] = e[e.length - 1].replace("\r", "") //remove Windows next line character from last index (which has to be the end of the line)
            logininfo["bot" + i] = [e[0], e[1], e[2]]
        }) 
    }
}

//Get quotes
var quotes = []
var quotes = fs.readFileSync('quotes.txt', 'utf8').split("\n") //get all quotes from the quotes.txt file into an array
var quotes = quotes.filter(str => str != "") //remove empty quotes as empty comments will not work/make no sense
quotes.forEach((e, i) => { quotes[i] = e.replace(/\\n/g, "\n").replace("\\n", "\n") }) //multi line strings that contain \n will get splitted to \\n -> remove second \ so that node-steamcommunity understands the quote when commenting
logger(`${quotes.length} quotes found.`, false, true)

if (quotes.length == 0) { //check if quotes.txt is empty to avoid errors further down when trying to comment
    logger("\x1b[31mYou haven't put any comment quote into the quotes.txt file! Aborting...\x1b[0m", true)
    process.exit(0);
}

/**
 * Rounds a number with x decimals
 * @param {Number} value Number to round 
 * @param {Number} decimals Amount of decimals
 * @returns {Number} Rounded number
 */
const round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
}

/**
 * Checks the remaining space on the friendlist of a bot account and sends a warning message if it is less than 10.
 * @param {Number} botindex The index of the bot account to be checked
 */
var friendlistcapacitycheck = (botindex) => {
    try {
        botobject[0].getSteamLevels([botobject[botindex].steamID], (err, users) => {
            if (users == undefined || users == null) return; //users was undefined one time (I hope this will (hopefully) supress an error?)

            let friendlistlimit = Object.values(users)[0] * 5 + 250 //Profile Level * 5 + 250
            let friends = Object.values(botobject[botindex].myFriends)
            let friendsamount = friends.length - friends.filter(val => val == 0).length - friends.filter(val => val == 5).length //Subtract friend enums 0 & 5

            let remaining = friendlistlimit - friendsamount
            if (remaining < 0) return; //stop if number is negative somehow - maybe when bot profile is private?
            if (remaining < 25) {
                logger(`The friendlist space of bot${botindex} is running low! (${remaining} remaining)`)
            }
        })
    } catch (err) {
        logger(`Failed to check friendlist space for bot${botindex}. Error: ${err}`) 
    }
}

var accisloggedin = true; //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account

//Check if Steam is online:
/**
  * Checks if Steam is online and proceeds with the startup.
  * @param {Boolean} continuewithlogin If true, the function will call startlogin() if Steam is online
  * @param {Boolean} stoponerr If true, the function will stop the bot if Steam seems to be offline
  * @param {Boolean} throwtimeout If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
  */
var isSteamOnline = function isSteamOnline(continuewithlogin, stoponerr, throwtimeout) {
    if (stoplogin == true) return;
    logger("Checking if Steam is reachable...", false, true)
    
    //Start a 20 sec timeout to display an error when Steam can't be reached but also doesn't throw an error
    if (throwtimeout) {
        var timeoutTimeout = setTimeout(() => { //phenomenal name I know
            logger(`\x1b[0m[\x1b[31mWarning\x1b[0m]: I can't reach SteamCommunity! Is your internet source maybe blocking it?\n           Error: Timeout after 20 seconds`, true)
            if (stoponerr) process.exit(0)
        }, 20000)
    }

    https.get('https://steamcommunity.com', function (res) {
        logger(`SteamCommunity is up! Status code: ${res.statusCode}`, false, true)

        if (continuewithlogin) {
            if (throwtimeout) clearTimeout(timeoutTimeout)
            startlogin() 
        }
    }).on('error', function(err) {
        logger(`\x1b[0m[\x1b[31mWarning\x1b[0m]: SteamCommunity seems to be down or your internet isn't working! Check: https://steamstat.us \n           Error: ` + err, true)
        if (throwtimeout) clearTimeout(throwtimeout)
        if (stoponerr) process.exit(0)
    }) 
}

/* ------------ Checks & co: ------------ */
logger("Checking config for 3urobeat's leftovers...", false, true)
if ((process.env.LOGNAME !== 'tomg' && process.env.LOGNAME !== 'pi' && process.env.USER !== 'tom') || (require('os').hostname() !== 'Toms-Hoellenmaschine' && require('os').hostname() !== 'raspberrypi' && require('os').hostname() !== 'Toms-Thinkpad')) { //remove myself from config on different computer
    let write = false;
    if (config.owner.includes(extdata.mestr)) { config.owner = ""; write = true } 
    if (config.ownerid.includes("76561198260031749")) { config.ownerid.splice(config.ownerid.indexOf("76561198260031749"), 1); write = true } 
    if (config.ownerid.includes("76561198982470768")) { config.ownerid.splice(config.ownerid.indexOf("76561198982470768"), 1); write = true }

    //Moin Tom, solltest du in der Zukunft noch einmal auf dieses Projekt zurückschauen, dann hoffe ich dass du etwas sinnvolles mit deinem Leben gemacht hast. (08.06.2020)
    //Dieses Projekt war das erste Projekt welches wirklich ein wenig Aufmerksamkeit bekommen hat. (1,5k Aufrufe in den letzten 14 Tagen auf GitHub, 1,3k Aufrufe auf mein YouTube Tutorial, 15k Aufrufe auf ein Tutorial zu meinem Bot von jemand fremden)
    //Das Projekt hat schon bis jetzt viel Zeit in Anspruch genommen, die ersten Klausuren nach der Corona Pandemie haben bisschen darunter gelitten. All der Code ist bis auf einzelne, markierte Schnipsel selbst geschrieben. Node Version zum aktuellen Zeitpunkt: v12.16.3

    if (write) {
        //Get arrays on one line
        var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; 
        }, 4)
            .replace(/"\[/g, '[')
            .replace(/\]"/g, ']')
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        fs.writeFile("./config.json", stringifiedconfig, err => {
            if (err) logger("delete 3urobeat from config.json error: " + err, true) 
        }) 
    }
}

if(updater.onlinemestr!==extdata.mestr||updater.onlineaboutstr!==extdata.aboutstr){extdata.mestr=updater.onlinemestr;extdata.aboutstr=updater.onlineaboutstr;fs.writeFile("./src/data.json",JSON.stringify(extdata,null,4),()=>{});var checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<";logger("Modification detected. Restarting...",true,true);logger("",true);require('../start.js').restart([],true);stoplogin=true}else{var checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"}

//Check config values:
if (stoplogin == true) return;
logger("Checking for invalid config values...", false, true)

if (config.allowcommentcmdusage === false && new SteamID(String(config.ownerid[0])).isValid() === false) {
    logger("\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m", true)
    process.exit(0); 
}
if (config.repeatedComments < 1) {
    logger("\x1b[31mYour repeatedComments value in config.json can't be smaller than 1! Automatically setting it to 1...\x1b[0m", true)
    config.repeatedComments = 1 
}
if (config.commentdelay / (config.repeatedComments * Object.keys(logininfo).length / 2) < 1250) {
    logger("\x1b[0m[\x1b[31mWarning\x1b[0m]: \x1b[31mYou have raised repeatedComments but I would recommend to raise the commentdelay further. Not increasing the commentdelay further raises the probability to get cooldown errors from Steam.\x1b[0m", true) 
}
if (logininfo.bot0 == undefined) { //check real quick if logininfo is empty
    logger("\x1b[31mYour logininfo doesn't contain a bot0 or is empty! Aborting...\x1b[0m", true); 
    process.exit(0) 
}
if (config.commentdelay * config.repeatedComments * Object.keys(logininfo).length > 2147483647) { //check for 32-bit integer limit for commentcmd timeout
    logger("\x1b[31mYour repeatedComments and/or commentdelay value in the config are too high.\nPlease lower these values so that 'commentdelay * repeatedComments * amount_of_accounts' is not bigger than 2147483647.\n\nThis will otherwise cause an error when trying to comment (32-bit integer limit). Aborting...\x1b[0m\n", true)
    process.exit(0) 
}
if (config.randomizeAccounts && Object.keys(logininfo).length <= 5 && config.repeatedComments > 1) {
    logger("\x1b[0m[\x1b[31mWarning\x1b[0m]: \x1b[31mI wouldn't recommend using randomizeAccounts with 5 or less accounts when repeatedComments is greater than 1. The chance of an account getting a cooldown could be higher. Please make sure your commentdelay is set a adequately to reduce the chance of this happening.\x1b[0m", true) 
}

if (stoplogin == true) return;


//Load lastcomment database
const lastcomment = new nedb("./src/lastcomment.db")
lastcomment.loadDatabase((err) => {
    if (err) return logger("Error loading lastcomment.db database! Error: " + err, true)
    logger("Successfully loaded lastcomment database.", false, true) 
    isSteamOnline(true, true, true); //Continue startup
})

//Check proxies.txt
var proxies = [] //when the file is just created there can't be proxies in it (this bot doesn't support magic)

if (!fs.existsSync('./proxies.txt')) {
    fs.writeFile("./proxies.txt", "", err => { 
        if (err) logger("error creating proxies.txt file: ") + err 
    }) 
} else { //file does seem to exist so now we can try and read it
    var proxies = fs.readFileSync('./proxies.txt', 'utf8').split("\n");
    var proxies = proxies.filter(str => str != "") //remove empty lines
    proxies.unshift(null) //add no proxy (default)
}


if(typeof checkm8 == "undefined"){process.stdout.write("\x07");logger("\n\n\x1b[31mYou removed needed parts from the code! Please redownload the application and not modify anything.\x1b[0m",true);process.exit(0)}
if(checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"){process.stdout.write("\x07");logger("\n\n\x1b[31mYou removed needed parts from the code! Please redownload the application and not modify anything.\x1b[0m",true);process.exit(0)}

//Generate urlrequestsecretkey if it is not created already
if (extdata.urlrequestsecretkey == "") {
    extdata.urlrequestsecretkey = Math.random().toString(36).slice(-10); //Credit: https://stackoverflow.com/a/9719815/12934162
    logger("Generated a secret key for comment requests via url. You can find the key in the 'data.json' file, located in the 'src' folder.", true)

    fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => {
        if (err) logger("error writing created urlrequestsecretkey to data.json: " + err) 
    })
}

//Get default language and overwrite keys if some are set in the customlang.json
logger("Loading defaultlang.json and customlang.json...", false, true)
var lang = require("./defaultlang.json")
if (fs.existsSync("./customlang.json")) {
    try {
        var customlang = require("../customlang.json")
    } catch (err) {
        return logger("It seems like you made a mistake (probably Syntax) in your customlang.json! I will not use any custom message.\nError: " + err)
    }
    
    Object.keys(customlang).forEach((e) => {
        if (e == "") return; //skip empty value
        lang[e] = customlang[e] //overwrite each defaultlang key with a corresponding customlang key if one is set
    })
}

//Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
if (config.owner.length > 1) var ownertext = config.owner; else var ownertext = "anonymous (no owner link provided)"; 
const aboutstr = `${extdata.aboutstr} \n\nDisclaimer: I (the developer) am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.\nThis instance of the bot is used and operated by: ${ownertext}`;

module.exports={
    bootstart,
    steamGuardInputTimeFunc,
    steamGuardInputTime,
    readyafter,
    logger,
    communityobject,
    botobject,
    checkm8,
    quotes,
    round,
    friendlistcapacitycheck,
    accisloggedin,
    aboutstr,
    lastcomment,
    isSteamOnline,
    skippednow,
    proxies,
    proxyShift,
    logininfo,
    lang 
}


/* ------------ Startup & Login: ------------ */
/**
  * Prints an ASCII Art and starts to login all bot accounts
  */
function startlogin() { //function will be called when steamcommunity status check is done
    logger("", true)
    if (Math.floor(Math.random() * 100) <= 2) logger(hellothereascii + "\n", true)
        else if (Math.floor(Math.random() * 100) <= 10) logger(binaryascii + "\n", true)
        else logger(ascii[Math.floor(Math.random() * ascii.length)] + "\n", true)
    logger("", true) //put one line above everything that will come to make the output cleaner

    if (extdata.firststart) logger("\x1b[0mWhat's new: " + extdata.whatsnew + "\n")

    //Evaluate estimated wait time for login:
    logger("Evaluating estimated login time...", false, true)
    if (extdata.timesloggedin < 5) { //only use new evaluation method when the bot was started more than 5 times
        var estimatedlogintime = ((logindelay * (Object.keys(logininfo).length - 1 - updater.skippedaccounts.length)) / 1000) + 10 //10 seconds tolerance
    } else {
        var estimatedlogintime = (extdata.totallogintime / extdata.timesloggedin) * (Object.keys(logininfo).length - updater.skippedaccounts.length) 
    }

    var estimatedlogintimeunit = "seconds"
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "minutes" }
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "hours" }                                                                                                                                                                                                                                                                          //🥚!
    logger(`Logging in... Estimated wait time: ${round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`)

    if(checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"){process.stdout.write("\x07");process.exit(0)}
    logger("Loading logininfo for each account...", false, true)

    Object.keys(logininfo).forEach((k, i) => { //log all accounts in with the logindelay             
        setTimeout(() => { //wait before interval to reduce ram usage on startup
            var startnextinterval = setInterval(() => { //check if previous account is logged in
                if (module.exports.accisloggedin == true && i == Object.keys(botobject).length + skippednow.length || module.exports.accisloggedin == true && skippednow.includes(i - 1)) { //i is being counted from 0, length from 1 -> checks if last iteration is as long as botobject
                    clearInterval(startnextinterval)
                    if (updater.skippedaccounts.includes(i)) { logger(`[skippedaccounts] Automatically skipped ${k}!`, false, true); skippednow.push(i); return; } //if this iteration exists in the skippedaccounts array, automatically skip acc again

                    if (i > 0) logger(`Waiting ${logindelay / 1000} seconds... (config logindelay)`, false, true) //first iteration doesn't need to wait duh

                    setTimeout(() => { //wait logindelay
                        logger(`Starting bot.js for ${k}...`, false, true)
                        var logOnOptions = {
                            accountName: logininfo[k][0],
                            password: logininfo[k][1],
                            promptSteamGuardCode: false,
                            machineName: `${extdata.mestr}'s Comment Bot`
                        };

                        //If a shared secret was provided in the logininfo then add it to logOnOptions object
                        if (logininfo[k][2] && logininfo[k][2] != "" && logininfo[k][2] != "shared_secret") { 
                            logOnOptions["twoFactorCode"] = SteamTotp.generateAuthCode(logininfo[k][2]) }

                        b.run(logOnOptions, i); //run bot.js with corresponding account
                    }, logindelay) 
                }
            }, 250);
        }, 1500 * (i - skippednow.length)); //1.5 seconds before checking if next account can be logged in should be ok
    }) 
}

//Code by: https://github.com/HerrEurobeat/ 


/* ------------ Everything logged in: ------------ */
var readyinterval = setInterval(() => { //log startup to console
    if (Object.keys(communityobject).length + skippednow.length == Object.keys(logininfo).length && module.exports.accisloggedin == true) {
        clearInterval(readyinterval)

        logger(' ', true)
        logger('*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
        logger(`\x1b[95m>\x1b[0m \x1b[96m${logininfo.bot0[0]}\x1b[0m version \x1b[96m${extdata.versionstr}\x1b[0m by ${extdata.mestr} logged in.`, true)

        if (config.repeatedComments > 3) var repeatedComments = `\x1b[4m\x1b[31m${config.repeatedComments}\x1b[0m` 
            else var repeatedComments = config.repeatedComments
        logger(`\x1b[94m>\x1b[0m ${Object.keys(communityobject).length - 1} child accounts | User can request ${repeatedComments} comments per Acc`, true)

        //display amount of limited accounts and if automatic updates are turned off
        var limitedaccs = 0
        var failedtocheck = 0
        try {
            for (var i = 0; i < Object.keys(botobject).length; i++) {
                if (botobject[Object.keys(botobject)[i]].limitations != undefined && botobject[Object.keys(botobject)[i]].limitations.limited != undefined) { //if it should be undefined for what ever reason then rather don't check instead of crash the bot
                    if (botobject[Object.keys(botobject)[i]] != undefined && botobject[Object.keys(botobject)[i]].limitations.limited == true) limitedaccs++ //yes, this way to get the botobject key by iteration looks stupid and is probably stupid but it works and is "compact" (not really but idk)
                } else { 
                    logger(`failed to check if bot${i} is limited. Showing account in startup message as unlimited...`, false, true); 
                    failedtocheck++ 
                }

                if (Number(i) + 1 == Object.keys(botobject).length && limitedaccs > 0) {
                    if (failedtocheck > 0) var failedtocheckmsg = `(Couldn't check ${failedtocheck} account(s))`;
                        else var failedtocheckmsg = "";
                    
                    logger(`\x1b[92m>\x1b[0m ${limitedaccs}/${Object.keys(botobject).length} account(s) are \x1b[31mlimited\x1b[0m ${failedtocheckmsg}`, true) 
                }
            }
        } catch (err) {
            logger(`Error in limited checker: ${err}`) 
        }

        if (config.disableautoupdate) logger("\x1b[41m\x1b[30m>\x1b[0m Automatic updating is \x1b[4m\x1b[31mturned off\x1b[0m!", true)

        var playinggames = ""
        if (config.playinggames[1]) var playinggames = `(${config.playinggames.slice(1, config.playinggames.length)})`
        logger(`\x1b[93m>\x1b[0m Playing status: \x1b[32m${config.playinggames[0]}\x1b[0m ${playinggames}`, true)

        const bootend = Date.now()
        readyafter = ((bootend - bootstart) - steamGuardInputTime) / 1000
        module.exports.readyafter = readyafter //refresh exported variable to now allow cmd usage

        var readyafterunit = "seconds"
        if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "minutes" }
        if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "hours" }
        
        logger(`\x1b[91m>\x1b[0m Ready after ${round(readyafter, 2)} ${readyafterunit}!`, true)
        extdata.timesloggedin++
        extdata.totallogintime += readyafter / Object.keys(communityobject).length //get rough logintime of only one account

        logger('*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
        logger(' ', true)

        if (updater.skippedaccounts.length > 0) logger(`Skipped Accounts: ${updater.skippedaccounts.length}/${Object.keys(logininfo).length}\n`, true)
        if (extdata.firststart) logger(`If you like my work please consider giving my repository a star! I would really appreciate it!\nhttps://github.com/HerrEurobeat/steam-comment-service-bot\n`, true)

        //Check if ownerids are correct:
        logger(`Checking for invalid ownerids...`, false, true)
        config.ownerid.forEach((e) => {
            if (isNaN(e) || new SteamID(String(e)).isValid() == false) { 
                logger(`[\x1b[31mWarning\x1b[0m] ${e} is not a valid ownerid!`, true) 
            }
        })
        
        //Check if owner link is correct
        logger(`Checking if owner link is valid...`, false, true)
        if (!config.owner.includes("steamcommunity.com")) { 
            logger("\x1b[0m[\x1b[31mNotice\x1b[0m] You haven't set a correct owner link to your profile in the config!\n         Please add this to refer to yourself as the owner and operator of this bot.", true) 
        } else {
            try {
                var owneroutput = ""

                https.get(`${config.owner}?xml=1`, function(ownerres) { //get requesterSteamID of user to check if it is valid
                    ownerres.on('data', function (chunk) {
                        owneroutput += chunk });
    
                    ownerres.on('end', () => {
                        new xml2js.Parser().parseString(owneroutput, function(ownererr, ownerResult) {
                            if (ownererr) return logger("error parsing owner xml: " + ownererr, true)
                            if (ownerResult.response && ownerResult.response.error) return logger("\x1b[0m[\x1b[31mNotice\x1b[0m] You haven't set a correct owner link to your profile in the config!\n         Please add this to refer to yourself as the owner and operator of this bot.\n         Error: " + ownerResult.response.error, true)
                        })
                    }) 
                })
            } catch (err) {
                if (err) { 
                    logger("error getting owner profile xml info: " + err, true); 
                    return; 
                } 
            }
        }

        logger(`Logging supressed logs...`, false, true)
        readyafterlogs.forEach(e => { logger(e, true) }) //log suppressed logs

        //Add backups to cache.json
        logger("Writing backups to cache.json...", false, true)
        cache["configjson"] = config
        cache["datajson"] = extdata

        fs.writeFile('./src/cache.json', JSON.stringify(cache, null, 2), err => {
            if (err) logger("error writing file backups to cache.json: " + err) 
        }) 
        
        //Join botsgroup if not already joined
        function joinbotsgroup(botsgroupid) { //eslint-disable-line no-inner-declarations
            if (!botsgroupid) return logger("joinbotsgroup() got called without a botsgroupid parameter. This shouldn't happen. 3urobeat, pls fix.")

            Object.keys(botobject).forEach((e) => {
                if (!Object.keys(botobject[e].myGroups).includes(String(botsgroupid))) {
                    communityobject[e].joinGroup(`${botsgroupid}`)
                    logger(`[Bot ${e}] Joined/Requested to join steam group that has been set in the config (botsgroup).`) 
                } 
            })
        }

        if (config.botsgroup.length < 1) {
            logger('Skipping botsgroup because config.botsgroup is empty.', false, true);
        } else {
            logger(`Checking if all bot accounts are in botsgroup...`, false, true)
            var botsgroupoutput = ""

            if (config.botsgroup == config.yourgroup) {
                var botsgroupid = botobject[0]["configgroup64id"]

                joinbotsgroup(botsgroupid)
            } else {
                if (cache.botsgroup != config.botsgroup) { //check if botsgroupid has never been acquired or the url has been changed in the config
                    https.get(`${config.botsgroup}/memberslistxml/?xml=1`, function(botsgroupres) { //get group64id from code to simplify config
                        botsgroupres.on('data', function (chunk) {
                            botsgroupoutput += chunk });
                
                        botsgroupres.on('end', () => {
                            if (!String(botsgroupoutput).includes("<?xml") || !String(botsgroupoutput).includes("<groupID64>")) { //Check if botsgroupoutput is steam group xml data before parsing it
                                logger("\x1b[0m[\x1b[31mNotice\x1b[0m] Your bots group (botsgroup in config) doesn't seem to be valid!\n         Error: " + config.botsgroup + " contains no xml or groupID64 data", true); 
                            } else {
                                new xml2js.Parser().parseString(botsgroupoutput, function(botsgrouperr, botsgroupResult) {
                                    if (botsgrouperr) return logger("error parsing botsgroup xml: " + botsgrouperr, true)

                                    var botsgroupid = botsgroupResult.memberList.groupID64

                                    //Write botsgroupid to cache so that we won't have to check this every time unless the user changes the botsgroup url
                                    cache.botsgroup = config.botsgroup
                                    cache.botsgroupid = String(botsgroupid)
                                    fs.writeFile("./src/cache.json", JSON.stringify(cache, null, 4), err => { 
                                        if (err) logger(`error writing botsgroupid to cache.json: ${err}`) 
                                    })
                        
                                    joinbotsgroup(botsgroupid)
                                })
                            }
                        })
                    }).on("error", function(err) {
                        logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get botsgroup 64id. Either Steam is down or your internet isn't working.\n          Error: " + err, true)
                    })
                } else { //url hasn't been changed and id was already acquired so just check if all accounts are in that group
                    if (!cache.botsgroupid) logger("cache's botsgroupid is undefined even though the last check didn't trigger. Huh, how can that happen?", true) //check just to be sure
                    joinbotsgroup(cache.botsgroupid)
                }
            }
        }
        
        //Friendlist capacity check
        Object.keys(botobject).forEach((e, i) => {
            friendlistcapacitycheck(i) 
        })
        
        //Message owners if firststart is true that the bot just updated itself
        if (extdata.firststart) {
            config.ownerid.forEach(e => {
                botobject[0].chat.sendFriendMessage(e, `I have updated myself to version ${extdata.versionstr}!\nWhat's new: ${extdata.whatsnew}`) 
            }) 
        }
       
        //Unfriend check loop
        let lastcommentUnfriendCheck = Date.now() //this is useful because intervals can get unprecise over time

        var unfriendloop = setInterval(() => { //eslint-disable-line
            if (lastcommentUnfriendCheck + 30000 > Date.now()) return; //last check is more recent than 30 seconds

            lastcomment.find({ time: { $lte: Date.now() - (config.unfriendtime * 86400000) } }, (err, docs) => { //until is a date in ms, so we check if it is less than right now
                lastcommentUnfriendCheck = Date.now()
                if (docs.length < 1) return; //nothing found

                docs.forEach((e) => { //take action for all results
                    Object.keys(botobject).forEach((f, j) => {
                        if (botobject[f].myFriends[e.id] == 3 && !config.ownerid.includes(e.id)) { //check if the targeted user is still friend
                            if (j == 0) botobject[0].chat.sendFriendMessage(new SteamID(e.id), `You have been unfriended for being inactive for ${config.unfriendtime} days.\nIf you need me again, feel free to add me again!`)

                            botobject[f].removeFriend(new SteamID(e.id)) //unfriend user with each bot
                            logger(`Unfriended ${e.id} after ${config.unfriendtime} days of inactivity.`)
                        }
                        
                        if (!config.ownerid.includes(e.id)) lastcomment.remove({ id: e.id }) //entry gets removed no matter what but we are nice and let the owner stay. Thank me later! <3
                    })
                })                
            })
        }, 30000); //30 seconds

        
        //Write logintime stuff to data.json
        logger(`Writing logintime...`, false, true)
        extdata.totallogintime = round(extdata.totallogintime, 2)
        extdata.firststart = false

        fs.writeFile("./src/data.json", JSON.stringify(extdata, null, 4), err => { //write changes
            if (err) logger("change extdata to false error: " + err) 
            logger('Startup complete!', false, true) 
        })


        //start enableurltocomment webserver
        if (config.enableurltocomment) {
            var express = require("express")
            var app = express()
            
            app.get('/', (req, res) => {
                res.status(200).send(`<title>Comment Bot Web Request</title><b>${extdata.mestr}'s Comment Bot | Comment Web Request</b></br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br></br>Visit /output to see the complete output.txt in your browser!</b></br></br>https://github.com/HerrEurobeat/steam-comment-service-bot`) 
            })
            
            app.get('/comment', (req, res) => {
                let ip = String(req.headers['x-forwarded-for'] || req.connection.remoteAddress).replace("::ffff:", "") //get IP of visitor

                if (req.query.n == undefined) {
                    logger(`Web Request by ${ip} denied. Reason: numberofcomments (n) is not specified.`)
                    return res.status(400).send("You have to provide an amount of comments.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.") 
                }
            
                if (req.query.id == undefined) {
                    logger(`Web Request by ${ip} denied. Reason: Steam profileid (id) is not specified.`)
                    return res.status(400).send("You have to provide a profile id where I should comment.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.") 
                }
            
                if (req.query.key == undefined || req.query.key != extdata.urlrequestsecretkey) {
                    logger(`Web Request by ${ip} denied. Reason: Invalid secret key.`)
                    return res.status(403).send("Your secret key is not defined or invalid. Request denied.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.") 
                }
            
                if (isNaN(config.ownerid[0]) || new SteamID(String(config.ownerid[0])).isValid() == false) {
                    logger(`Web Request by ${ip} denied. Reason: Config's first ownerid is invalid.`)
                    return res.status(403).send("You can't use the web request feature unless you provided a valid ownerid in your config!") 
                }
                
                logger(`Web Comment Request from ${ip} accepted. Amount: ${req.query.n} | Profile: ${req.query.id}`)
                botobject[0].commentcmd(new SteamID(String(config.ownerid[0])), [req.query.n, req.query.id], res) //steamID: Make the bot owner responsible for request
            });
            
            app.get('/output', (req, res) => { //Show output
                fs.readFile("./output.txt", (err, data) => {
                    if(err) logger("urltocomment: error reading output.txt: " + err)
                
                    res.write(String(data))
                    res.status(200)
                    res.end()
                }) 
            })
            
            app.use((req, res) => { //Show idk page thanks
                res.status(404).send("404: Page not Found.</br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.") 
            });
            
            module.exports.server = app.listen(3034, () => {
                logger('EnableURLToComment is on: Server is listening on port 3034.\nVisit it on: localhost:3034\n', true) 
            });

            module.exports.server.on("error", (err) => {
                //Don't show date if error occurs on startup (like port in use error)
                if (Date.now() - bootend < 5000) logger('An error occured trying to start the EnableURLToComment server. ' + err, true)
                    else logger('An error occured trying to start the EnableURLToComment server. ' + err) 
            })
        }

        setTimeout(() => {
            logger(` `, true, true) //clear out last remove message
        }, 5000); 
    }
}, 500);

//Code by: https://github.com/HerrEurobeat/

/* eslint-disable */
var hellothereascii =
` _   _      _ _         _   _                   
| | | |    | | |       | | | |                  
| |_| | ___| | | ___   | |_| |__   ___ _ __ ___ 
|  _  |/ _ | | |/ _ \\  | __| '_ \\ / _ | '__/ _ \\
| | | |  __| | | (_) | | |_| | | |  __| | |  __/
\\_| |_/\\___|_|_|\\___/   \\__|_| |_|\\___|_|  \\___|
                                                
General Kenobi `

var binaryascii = "01000011 01101111 01101101 01101101 01100101 01101110 01110100  01000010 01101111 01110100"

var ascii = [`
 ______     ______     __    __     __    __     ______     __   __     ______      ______     ______     ______  
/\\  ___\\\   /\\  __ \\   /\\ "-./  \\   /\\ "-./  \\   /\\  ___\\   /\\ "-.\\ \\   /\\\__  _\\    /\\  == \\   /\\  __ \\   /\\\__  _\\ 
\\ \\ \\____  \\ \\ \\/\\ \\  \\ \\ \\-./\\ \\  \\ \\ \\-./\\ \\  \\ \\  __\\   \\ \\ \\-.  \\  \\/_/\\ \\/    \\ \\  __<   \\ \\ \\/\\ \\  \\/_/\\ \\/ 
 \\ \\_____\\\  \\ \\_____\\  \\ \\_\\ \\ \\_\\  \\ \\_\\ \\ \\_\\  \\ \\_____\\  \\ \\_\\\\"\\_\\    \\ \\_\\     \\ \\_____\\  \\ \\_____\\    \\ \\_\\ 
  \\\/_____/   \\/_____/   \\/_/  \\/_/   \\/_/  \\/_/   \\/_____/   \\/_/ \\/_/     \\/_/      \\/_____/   \\/_____/     \\/_/ `,
`
_________                                       __    __________        __   
\\_   ___ \\  ____   _____   _____   ____   _____/  |_  \\______   \\ _____/  |_ 
/    \\  \\/ /  _ \\ /     \\ /     \\_/ __ \\ /    \\   __\\  |    |  _//  _ \\   __\\
\\     \\___(  <_> )  Y Y  \\  Y Y  \\  ___/|   |  \\  |    |    |   (  <_> )  |  
 \\______  /\\\____/|__|_|  /__|_|  /\\\___  >___|  /__|    |______  /\\\____/|__|  
        \\/             \\/      \\/     \\/     \\/               \\/             `,
`
  ___  _____  __  __  __  __  ____  _  _  ____    ____  _____  ____ 
 / __)(  _  )(  \\/  )(  \\/  )( ___)( \\( )(_  _)  (  _ \\(  _  )(_  _)
( (__  )(_)(  )    (  )    (  )__)  )  (   )(     ) _ < )(_)(   )(  
 \\___)(_____)(_/\\\/\\\_)(_/\\\/\\\_)(____)(_)\\_) (__)   (____/(_____) (__) `,
`
     ___           ___           ___           ___           ___           ___           ___                    ___           ___           ___     
    /\\  \\         /\\  \\         /\\\__\\         /\\\__\\         /\\  \\         /\\\__\\         /\\  \\                  /\\  \\         /\\  \\         /\\  \\    
   /::\\  \\       /::\\  \\       /::|  |       /::|  |       /::\\  \\       /::|  |        \\:\\\  \\                /::\\  \\       /::\\  \\        \\:\\\  \\   
  /:/\\\:\\\  \\     /:/\\\:\\\  \\     /:|:|  |      /:|:|  |      /:/\\\:\\\  \\     /:|:|  |         \\:\\\  \\              /:/\\\:\\\  \\     /:/\\\:\\\  \\        \\:\\\  \\  
 /:/  \\:\\\  \\   /:/  \\:\\\  \\   /:/|:|__|__   /:/|:|__|__   /::\\~\\:\\\  \\   /:/|:|  |__       /::\\  \\            /::\\~\\:\\\__\\   /:/  \\:\\\  \\       /::\\  \\ 
/:/__/ \\:\\\__\\ /:/__/ \\:\\\__\\ /:/ |::::\\\__\\ /:/ |::::\\\__\\ /:/\\\:\\\ \\:\\\__\\ /:/ |:| /\\\__\\     /:/\\\:\\\__\\          /:/\\\:\\\ \\:|__| /:/__/ \\:\\\__\\     /:/\\\:\\\__\\
\\:\\\  \\  \\/__/ \\:\\\  \\ /:/  / \\/__/~~/:/  / \\/__/~~/:/  / \\:\\\~\\:\\\ \\/__/ \\/__|:|/:/  /    /:/  \\/__/          \\:\\\~\\:\\\/:/  / \\:\\\  \\ /:/  /    /:/  \\/__/
 \\:\\\  \\        \\:\\\  /:/  /        /:/  /        /:/  /   \\:\\\ \\:\\\__\\       |:/:/  /    /:/  /                \\:\\\ \\::/  /   \\:\\\  /:/  /    /:/  /     
  \\:\\\  \\        \\:\\\/:/  /        /:/  /        /:/  /     \\:\\\ \\/__/       |::/  /     \\/__/                  \\:\\\/:/  /     \\:\\\/:/  /     \\/__/      
   \\:\\\__\\        \\::/  /        /:/  /        /:/  /       \\:\\\__\\         /:/  /                              \\::/__/       \\::/  /                 
    \\/__/         \\/__/         \\/__/         \\/__/         \\/__/         \\/__/                                ~~            \\/__/                  `,
`
   ______                                     __     ____        __ 
  / ____/___  ____ ___  ____ ___  ___  ____  / /_   / __ )____  / /_
 / /   / __ \\/ __  __ \\/ __  __ \\/ _ \\/ __ \\/ __/  / __  / __ \\/ __/
/ /___/ /_/ / / / / / / / / / / /  __/ / / / /_   / /_/ / /_/ / /_  
\\____/\\\____/_/ /_/ /_/_/ /_/ /_/\\\___/_/ /_/\\\__/  /_____/\\\____/\\\__/  `,
`
▄████▄   ▒█████   ███▄ ▄███▓ ███▄ ▄███▓▓█████  ███▄    █ ▄▄▄█████▓    ▄▄▄▄    ▒█████  ▄▄▄█████▓
▒██▀ ▀█  ▒██▒  ██▒▓██▒▀█▀ ██▒▓██▒▀█▀ ██▒▓█   ▀  ██ ▀█   █ ▓  ██▒ ▓▒   ▓█████▄ ▒██▒  ██▒▓  ██▒ ▓▒
▒▓█    ▄ ▒██░  ██▒▓██    ▓██░▓██    ▓██░▒███   ▓██  ▀█ ██▒▒ ▓██░ ▒░   ▒██▒ ▄██▒██░  ██▒▒ ▓██░ ▒░
▒▓▓▄ ▄██▒▒██   ██░▒██    ▒██ ▒██    ▒██ ▒▓█  ▄ ▓██▒  ▐▌██▒░ ▓██▓ ░    ▒██░█▀  ▒██   ██░░ ▓██▓ ░ 
▒ ▓███▀ ░░ ████▓▒░▒██▒   ░██▒▒██▒   ░██▒░▒████▒▒██░   ▓██░  ▒██▒ ░    ░▓█  ▀█▓░ ████▓▒░  ▒██▒ ░ 
░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒░   ░  ░░ ▒░   ░  ░░░ ▒░ ░░ ▒░   ▒ ▒   ▒ ░░      ░▒▓███▀▒░ ▒░▒░▒░   ▒ ░░   
 ░  ▒     ░ ▒ ▒░ ░  ░      ░░  ░      ░ ░ ░  ░░ ░░   ░ ▒░    ░       ▒░▒   ░   ░ ▒ ▒░     ░    
░        ░ ░ ░ ▒  ░      ░   ░      ░      ░      ░   ░ ░   ░          ░    ░ ░ ░ ░ ▒    ░      
░ ░          ░ ░         ░          ░      ░  ░         ░              ░          ░ ░           
░                                                                           ░                   `,

`  ██████╗ ██████╗ ███╗   ███╗███╗   ███╗███████╗███╗   ██╗████████╗    ██████╗  ██████╗ ████████╗
 ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝    ██╔══██╗██╔═══██╗╚══██╔══╝
 ██║     ██║   ██║██╔████╔██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║       ██████╔╝██║   ██║   ██║   
 ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║       ██╔══██╗██║   ██║   ██║   
 ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║ ╚████║   ██║       ██████╔╝╚██████╔╝   ██║   
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═════╝  ╚═════╝    ╚═╝   `,

`    (                                        )     (           )  
    )\\           )       )      (         ( /(   ( )\\       ( /(  
  (((_)   (     (       (      ))\\  (     )\\())  )((_)  (   )\\()) 
  )\\___   )\\    )\\  '   )\\  ' /((_) )\\ ) (_))/  ((_)_   )\\ (_))/  
 ((/ __| ((_) _((_))  _((_)) (_))  _(_/( | |_    | _ ) ((_)| |_   
  | (__ / _ \\| '  \\()| '  \\()/ -_)| ' \\))|  _|   | _ \\/ _ \\|  _|  
   \\___|\\___/|_|_|_| |_|_|_| \\___||_||_|  \\__|   |___/\\___/ \\__| `,

`      _____           _____         ______  _______        ______  _______        ______  _____   ______   _________________             _____          _____   _________________ 
  ___|\\    \\     ____|\\    \\       |      \\/       \\      |      \\/       \\   ___|\\     \\|\\    \\ |\\     \\ /                 \\       ___|\\     \\    ____|\\    \\ /                 \\
/    /\\    \\   /     /\\    \\     /          /\\     \\    /          /\\     \\ |     \\     \\\\\\    \\| \\     \\\\______     ______/      |    |\\     \\  /     /\\    \\\\______     ______/
|    |  |    | /     /  \\    \\   /     /\\   / /\\     |  /     /\\   / /\\     ||     ,_____/|\\|    \\  \\     |  \\( /    /  )/         |    | |     |/     /  \\    \\  \\( /    /  )/   
|    |  |____||     |    |    | /     /\\ \\_/ / /    /| /     /\\ \\_/ / /    /||     \\--'\\_|/ |     \\  |    |   ' |   |   '          |    | /_ _ /|     |    |    |  ' |   |   '    
|    |   ____ |     |    |    ||     |  \\|_|/ /    / ||     |  \\|_|/ /    / ||     /___/|   |      \\ |    |     |   |              |    |\\    \\ |     |    |    |    |   |        
|    |  |    ||\\     \\  /    /||     |       |    |  ||     |       |    |  ||     \\____|\\  |    |\\ \\|    |    /   //              |    | |    ||\\     \\  /    /|   /   //        
|\\ ___\\/    /|| \\_____\\/____/ ||\\____\\       |____|  /|\\____\\       |____|  /|____ '     /| |____||\\_____/|   /___//               |____|/____/|| \\_____\\/____/ |  /___//         
| |   /____/ | \\ |    ||    | /| |    |      |    | / | |    |      |    | / |    /_____/ | |    |/ \\|   ||  |\`   |                |    /     || \\ |    ||    | / |\`   |          
\\|___|    | /  \\|____||____|/  \\|____|      |____|/   \\|____|      |____|/  |____|     | / |____|   |___|/  |____|                |____|_____|/  \\|____||____|/  |____|          
  \\( |____|/      \\(    )/        \\(          )/         \\(          )/       \\( |_____|/    \\(       )/      \\(                    \\(    )/        \\(    )/       \\(            
    '   )/          '    '          '          '           '          '         '    )/        '       '        '                     '    '          '    '         '            
        '                                                                            '                                                                                            `,

` .d8888b.                                                         888         888888b.            888    
d88P  Y88b                                                        888         888  "88b           888    
888    888                                                        888         888  .88P           888    
888         .d88b.  88888b.d88b.  88888b.d88b.   .d88b.  88888b.  888888      8888888K.   .d88b.  888888 
888        d88""88b 888 "888 "88b 888 "888 "88b d8P  Y8b 888 "88b 888         888  "Y88b d88""88b 888    
888    888 888  888 888  888  888 888  888  888 88888888 888  888 888         888    888 888  888 888    
Y88b  d88P Y88..88P 888  888  888 888  888  888 Y8b.     888  888 Y88b.       888   d88P Y88..88P Y88b.  
 "Y8888P"   "Y88P"  888  888  888 888  888  888  "Y8888  888  888  "Y888      8888888P"   "Y88P"   "Y888 `,

`    /$$$$$$                                                              /$$           /$$$$$$$              /$$    
   /$$__  $$                                                            | $$          | $$__  $$            | $$    
  | $$  \\__/  /$$$$$$  /$$$$$$/$$$$  /$$$$$$/$$$$   /$$$$$$  /$$$$$$$  /$$$$$$        | $$  \\ $$  /$$$$$$  /$$$$$$  
  | $$       /$$__  $$| $$_  $$_  $$| $$_  $$_  $$ /$$__  $$| $$__  $$|_  $$_/        | $$$$$$$  /$$__  $$|_  $$_/  
  | $$      | $$  \\ $$| $$ \\ $$ \\ $$| $$ \\ $$ \\ $$| $$$$$$$$| $$  \\ $$  | $$          | $$__  $$| $$  \\ $$  | $$    
  | $$    $$| $$  | $$| $$ | $$ | $$| $$ | $$ | $$| $$_____/| $$  | $$  | $$ /$$      | $$  \\ $$| $$  | $$  | $$ /$$
  |  $$$$$$/|  $$$$$$/| $$ | $$ | $$| $$ | $$ | $$|  $$$$$$$| $$  | $$  |  $$$$/      | $$$$$$$/|  $$$$$$/  |  $$$$/
   \\______/  \\______/ |__/ |__/ |__/|__/ |__/ |__/ \\_______/|__/  |__/   \\___/        |_______/  \\______/    \\___/  `,

  `      ::::::::   ::::::::    :::   :::     :::   :::   :::::::::: ::::    ::: :::::::::::          :::::::::   :::::::: ::::::::::: 
    :+:    :+: :+:    :+:  :+:+: :+:+:   :+:+: :+:+:  :+:        :+:+:   :+:     :+:              :+:    :+: :+:    :+:    :+:      
   +:+        +:+    +:+ +:+ +:+:+ +:+ +:+ +:+:+ +:+ +:+        :+:+:+  +:+     +:+              +:+    +:+ +:+    +:+    +:+       
  +#+        +#+    +:+ +#+  +:+  +#+ +#+  +:+  +#+ +#++:++#   +#+ +:+ +#+     +#+              +#++:++#+  +#+    +:+    +#+        
 +#+        +#+    +#+ +#+       +#+ +#+       +#+ +#+        +#+  +#+#+#     +#+              +#+    +#+ +#+    +#+    +#+         
#+#    #+# #+#    #+# #+#       #+# #+#       #+# #+#        #+#   #+#+#     #+#              #+#    #+# #+#    #+#    #+#          
########   ########  ###       ### ###       ### ########## ###    ####     ###              #########   ########     ###           `,

`  _____                                     _     ____        _   
 / ____|                                   | |   |  _ \\      | |  
| |     ___  _ __ ___  _ __ ___   ___ _ __ | |_  | |_) | ___ | |_ 
| |    / _ \\| '_ \` _ \\| '_ \` _ \\ / _ \\ '_ \\| __| |  _ < / _ \\| __|
| |___| (_) | | | | | | | | | | |  __/ | | | |_  | |_) | (_) | |_ 
 \\_____\\___/|_| |_| |_|_| |_| |_|\\___|_| |_|\\__| |____/ \\___/ \\__|`,

`  _|_|_|                                                                  _|          _|_|_|                _|      
_|          _|_|    _|_|_|  _|_|    _|_|_|  _|_|      _|_|    _|_|_|    _|_|_|_|      _|    _|    _|_|    _|_|_|_|  
_|        _|    _|  _|    _|    _|  _|    _|    _|  _|_|_|_|  _|    _|    _|          _|_|_|    _|    _|    _|      
_|        _|    _|  _|    _|    _|  _|    _|    _|  _|        _|    _|    _|          _|    _|  _|    _|    _|      
  _|_|_|    _|_|    _|    _|    _|  _|    _|    _|    _|_|_|  _|    _|      _|_|      _|_|_|      _|_|        _|_|  `]