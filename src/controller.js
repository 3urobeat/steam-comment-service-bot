//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Controlling bot.js instances, processing instance over-reaching requests, handling web comment requests and saving stuff in variables.

const fs = require('fs');
const https = require('https')
const readline = require("readline")

if (!fs.existsSync('./node_modules/steam-user') || !fs.existsSync('./node_modules/steamcommunity')) { //Quickly check if user forgot to run npm install and display custom error message
    console.log(`\n\n\x1b[31mIt seems like you haven't installed the needed npm packages yet.\nPlease run the following command in this terminal once: "npm install"\nAborting...\x1b[0m\n`)
    process.exit(0) }

const SteamID = require('steamid');
const SteamTotp = require('steam-totp');
const xml2js = require('xml2js')

var updater = require('./updater.js')
var b = require('./bot.js');
var logininfo = require('../logininfo.json');
var config = require('../config.json');
var extdata = require('./data.json');

var communityobject = {}
var botobject = {}
var readyafterlogs = []
var failedcomments = []
var accstoadd = []
var bootstart = 0
var bootstart = new Date();
var steamGuardInputTime = 0
var readyafter = 0
var activecommentprocess = []
var logindelay = 2500
var proxyShift = 0
skippednow = [] //array to track which accounts have been skipped
stoplogin = false;

if (process.platform == "win32") { //set node process name to find it in task manager etc.
    process.title = `${extdata.mestr}'s Steam Comment Service Bot v${extdata.version} | ${process.platform}` //Windows allows long terminal/process names
} else {
    process.title = `CommentBot` //sets process title in task manager etc.
    process.stdout.write(`${String.fromCharCode(27)}]0;${extdata.mestr}'s Steam Comment Service Bot v${extdata.version} | ${process.platform}${String.fromCharCode(7)}`) } //sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)

/* ------------ Functions: ------------ */
var logger = (str, nodate, remove) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` }

    if (nodate) {
        var string = str; 
    } else { //startup messages should have nodate enabled -> filter messages with date when bot is not started
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}`  
        if (readyafter == 0 && !str.toLowerCase().includes("error") && !str.includes('Logging in... Estimated wait time') && !str.includes("What's new:") && remove !== true) { readyafterlogs.push(string); return; }}
        
    if (remove) {
        readline.clearLine(process.stdout, 0) //0 clears entire line
        process.stdout.write(`${string}\r`)
    } else { 
        readline.clearLine(process.stdout, 0)
        console.log(`${string}`) }

    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Regex Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var steamGuardInputTimeFunc = (arg) => { steamGuardInputTime += arg } //small function to return new value from bot.js

process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection Error! Reason: ${reason.stack}`, true) });

var quotes = []
var quotes = fs.readFileSync('quotes.txt', 'utf8').split("\n") //get all quotes from the quotes.txt file into an array
var quotes = quotes.filter(str => str != "") //remove empty quotes as empty comments will not work/make no sense
quotes.forEach((e, i) => { quotes[i] = e.replace(/\\n/g, "\n").replace("\\n", "\n") }) //mult line strings that contain \n will get splitted to \\n -> remove second \ so that node-steamcommunity understands the quote when commenting

//Please don't change this message as it gives credit to me; the person who put really much of his free time into this project. The bot will still refer to you - the operator of this instance.
if (config.owner.length > 1) var ownertext = config.owner; else var ownertext = "anonymous (no owner link provided)"; 
const aboutstr = `${extdata.aboutstr} \n\nDisclaimer: I (the developer) am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.\nThis instance of the bot is used and operated by: ${ownertext}`;

var commenteverywhere = (steamID, numberofcomments, requesterSteamID, res) => { //function to let all bots comment
    function respondmethod(msg) { //we need a function to get each response back to the user (web request & steam chat)
        if (res) {
          logger("Web Comment Request: " + msg)
        } else {
          botobject[0].chat.sendFriendMessage(requesterSteamID, msg)
        } }

    failedcomments[requesterSteamID] = {}
    module.exports.activecommentprocess.push(requesterSteamID)

    function comment(k, i, j) {
        setTimeout(() => {
            if (Object.values(failedcomments[requesterSteamID]).includes("postUserComment error: Error: HTTP error 429")) {
                if (Object.keys(failedcomments[requesterSteamID]).length > 0) { failedcmdreference = "To get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems" 
                    } else { failedcmdreference = "" }
    
                if (!Object.values(failedcomments[requesterSteamID]).includes("postUserComment error: Skipped because of previous HTTP 429 error.")) { //send chat.sendFriendMessage only the first time
                    respondmethod(`Stopped comment process because of a HTTP 429 (cooldown) error. Please try again later. Failed: ${numberofcomments - i + 1}/${numberofcomments}\n\n${failedcmdreference}`) 

                    var m = 0;
                    for (var l = i + 1; l <= numberofcomments; l++) { //push all other comments to instanly complete the failedcomments obj
                        if (m + 1 > Object.keys(communityobject).length) {
                            m = 0; }

                        failedcomments[requesterSteamID][`Comment ${l} (bot${m})`] = `postUserComment error: Skipped because of previous HTTP 429 error.`
                        m++ //get bot number (for code comments see the for loop below that calls the comment() function)
                    } }
                return; }

            var comment = quotes[Math.floor(Math.random() * quotes.length)];

            communityobject[k].postUserComment(steamID, comment, (error) => {
                if (k == 0) var thisbot = `Main`; else var thisbot = `Bot ${k}`;
                if (error) {
                    logger(`[${thisbot}] postUserComment error: ${error}\nRequest info - noc: ${numberofcomments} - accs: ${Object.keys(botobject).length} - reciever: ${new SteamID(String(steamID)).getSteamID64()}`); 
                    failedcomments[requesterSteamID][`Comment ${i + 1} (bot${j})`] = `postUserComment error: ${error}`
                } else {
                    logger(`[${thisbot}] Comment on ${new SteamID(String(steamID)).getSteamID64()}: ${comment}`) 

                    if (botobject[k].myFriends[requesterSteamID] == 3) {
                        lastcomment[requesterSteamID.toString() + j] = { //add j to steamID to allow multiple entries for one steamID
                            time: Date.now(),
                            bot: botobject[k].steamID.accountid } } }


                if (i == numberofcomments - 1) { //last iteration
                    if (Object.keys(failedcomments[requesterSteamID]).length > 0) { failedcmdreference = "\nTo get detailed information why which comment failed please type '!failed'. You can read why your error was probably caused here: https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Errors,-FAQ-&-Common-problems" 
                        } else { failedcmdreference = "" }
                    respondmethod(`All comments have been sent. Failed: ${Object.keys(failedcomments[requesterSteamID]).length}/${numberofcomments}${failedcmdreference}`);

                    fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => { //write all lastcomment changes on last iteration
                        if (err) logger("add user to lastcomment.json from commenteverywhere() error: " + err) })

                    if (Object.values(failedcomments[requesterSteamID]).includes("Error: The settings on this account do not allow you to add comments.")) {
                        accstoadd[requesterSteamID] = []

                        for (i in botobject) {
                            if (!Object.keys(botobject[i].myFriends).includes(new SteamID(String(steamID)).getSteamID64())) {
                                accstoadd[requesterSteamID].push(`\n 'https://steamcommunity.com/profiles/${new SteamID(String(botobject[i].steamID)).getSteamID64()}'`) }

                            if (i == Object.keys(botobject).length - 1)
                                respondmethod("-----------------------------------\nIt seems like at least one of the requested comments could have failed because you/the recieving account aren't/isn't friend with the commenting bot account.\n\nPlease make sure that you have added these accounts in order to eventually avoid this error in the future: \n" + accstoadd[requesterSteamID] + "\n-----------------------------------")
                        } }

                    module.exports.activecommentprocess = activecommentprocess.filter(item => item !== requesterSteamID) 
                } })
            }, config.commentdelay * i); //delay every comment
        }

    var j = 0;

    for(let i = 0; i < numberofcomments; i++) {
        if (i == 0) continue; //first account already commented, skip this iteration

        j++ //j is for defining k without an error when repeatedComments should start from the beginning again
        if (j + 1 > Object.keys(communityobject).length) { //reset j if it is greater than the number of accounts
            j = 0; } //needed to get multiple comments from one account

        var k = Object.keys(communityobject)[j] //set key for this iteration

        comment(k, i, j) //run actual comment function because for loops are bitchy
    }}

const round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals) }

accisloggedin = true; //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account


/* ------------ Checks: ------------ */
logger("Checking config for 3urobeat's leftovers...", false, true)
if (!(process.env.COMPUTERNAME === 'HÖLLENMASCHINE' && process.env.USERNAME === 'tomgo') && !(process.env.USER === 'pi' && process.env.LOGNAME === 'pi') && !(process.env.USER === 'tom' && require('os').hostname() === 'Toms-Thinkpad')) { //remove myself from config on different computer
    let write = false;
    if (config.owner.includes("3urobeat")) { config.owner = ""; write = true } 
    if (config.ownerid.includes("76561198260031749")) { config.ownerid.splice(config.ownerid.indexOf("76561198260031749"), 1); write = true } 
    if (config.ownerid.includes("76561198982470768")) { config.ownerid.splice(config.ownerid.indexOf("76561198982470768"), 1); write = true }

    //Moin Tom, solltest du in der Zukunft noch einmal auf dieses Projekt zurückschauen, dann hoffe ich dass du etwas sinnvolles mit deinem Leben gemacht hast. (08.06.2020)
    //Dieses Projekt war das erste Projekt welches wirklich ein wenig Aufmerksamkeit bekommen hat. (1,5k Aufrufe in den letzten 14 Tagen auf GitHub, 1,3k Aufrufe auf mein YouTube Tutorial, 15k Aufrufe auf ein Tutorial zu meinem Bot von jemand fremden)
    //Das Projekt hat schon bis jetzt viel Zeit in Anspruch genommen, die ersten Klausuren nach der Corona Pandemie haben bisschen darunter gelitten. All der Code ist bis auf einzelne, markierte Schnipsel selbst geschrieben. Node Version zum aktuellen Zeitpunkt: v12.16.3

    if (write) {
        var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; },4)
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

        fs.writeFile("./config.json", stringifiedconfig, err => {
            if (err) logger("delete 3urobeat from config.json error: " + err, true) }) }}

if(updater.onlinemestr!==extdata.mestr||updater.onlineaboutstr!==extdata.aboutstr){extdata.mestr=updater.onlinemestr;extdata.aboutstr=updater.onlineaboutstr;fs.writeFile("./src/data.json",JSON.stringify(extdata,null,4),err=>{});checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<";logger("Modification detected. Restarting...",true,true);logger("",true);require('../start.js').restart([],true);stoplogin=true}else{checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"}

//Check config values:
if (stoplogin == true) return;
logger("Checking for invalid config values...", false, true)
if (config.allowcommentcmdusage === false && new SteamID(String(config.ownerid[0])).isValid() === false) {
    logger("\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m", true)
    process.exit(0); }
if (config.repeatedComments < 1) {
    logger("\x1b[31mYour repeatedComments value in config.json can't be smaller than 1! Automatically setting it to 1...\x1b[0m", true)
    config.repeatedComments = 1 }
if (config.repeatedComments > 2 && config.commentdelay == 5000) {
    logger("\x1b[0m[\x1b[31mWarning\x1b[0m]: \x1b[31mYou have raised repeatedComments but haven't increased the commentdelay. This can cause cooldown errors from Steam.\x1b[0m", true) }
if (logininfo.bot0 == undefined) { //check real quick if logininfo is empty
    logger("\x1b[31mYour logininfo doesn't contain a bot0 or is empty! Aborting...\x1b[0m", true); process.exit(0) }

//Check cache.json
logger("Checking if cache.json is valid...", false, true) //file can get broken regularly when exiting while the bot was writing etc
fs.readFile('./src/cache.json', function (err, data) {
    if (err) logger("error reading cache.json to check if it is valid: " + err, true)
    if (stoplogin == true) return;

    try {
        JSON.parse(data)
        cachefile = require("./cache.json")
    } catch (err) {
        if (err) {
            if (!extdata.firststart) logger("Your cache.json is broken. No worries I will apply duct tape.\nError: " + err + "\n", true);

            fs.writeFile('./src/cache.json', "{}", (err) => { //write empty valid json
                if (err) { 
                    logger("Error writing {} to cache.json.\nPlease do this manually: Go into 'src' folder, open 'cache.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                    process.exit(0) //abort since writeFile was unable to write and any further execution would crash
                } else {
                    logger("Successfully cleared/created cache.json.", false, true)
                    cachefile = require("./cache.json")
                } })
        }} })

//Check lastcomment.json
logger("Checking if lastcomment.json is valid...", false, true) //file can get broken regularly when exiting while the bot was writing etc
fs.readFile('./src/lastcomment.json', function (err, data) {
    if (err) logger("error reading lastcomment.json to check if it is valid: " + err, true)
    if (stoplogin == true) return;

    try {
        JSON.parse(data)
        lastcomment = require("./lastcomment.json")
        isSteamOnline(true, true); //Continue startup
    } catch (err) {
        if (err) {
            logger("\nYour lastcomment.json is broken and has lost it's data. This will mean that comment cooldowns are lost and the unfriend time has been reset.\nWriting {} to prevent error...\nError: " + err + "\n", true) 

            fs.writeFile('./src/lastcomment.json', "{}", (err) => { //write empty valid json
                if (err) { 
                    logger("Error writing {} to lastcomment.json.\nPlease do this manually: Go into 'src' folder, open 'lastcomment.json', write '{}' and save.\nOtherwise the bot will always crash.\nError: " + err + "\n\nAborting...", true); 
                    process.exit(0) //abort since writeFile was unable to write and any further execution would crash
                } else {
                    logger("Successfully cleared lastcomment.json.", false, true)
                    lastcomment = require("./lastcomment.json")
                    isSteamOnline(true, true); //Continue startup
                } })
        }} })

//Check proxies.txt
var proxies = [] //when the file is just created there can't be proxies in it (this bot doesn't support magic)

if (!fs.existsSync('./proxies.txt')){
    fs.writeFile("./proxies.txt", "", err => { 
        if (err) logger("error creating proxies.txt file: ") + err }) 
} else { //file does seem to exist so now we can try and read it
    var proxies = fs.readFileSync('./proxies.txt', 'utf8').split("\n");
    var proxies = proxies.filter(str => str != "") //remove empty lines
    proxies.unshift(null) } //add no proxy (default)


if(typeof checkm8 == "undefined"){logger("\n\n\x1b[31mYou removed needed parts from the code! Please redownload the application and not modify anything.\x1b[0m",true);process.exit(0)}
if(checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"){logger("\n\n\x1b[31mYou removed needed parts from the code! Please redownload the application and not modify anything.\x1b[0m",true);process.exit(0)}

//Generate urlrequestsecretkey if it is not created already
if (extdata.urlrequestsecretkey == "") {
    extdata.urlrequestsecretkey = Math.random().toString(36).slice(-10); //Credit: https://stackoverflow.com/a/9719815/12934162
    logger("Generated a secret key for comment requests via url. You can find the key in the 'data.json' file, located in the 'src' folder.", true)

    fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => {
        if (err) logger("error writing created urlrequestsecretkey to data.json: " + err) })
}

//Check if Steam is online:
var isSteamOnline = function isSteamOnline(continuewithlogin, stoponerr) {
    if (stoplogin == true) return;
    logger("Checking if Steam is reachable...", false, true)
    https.get('https://steamcommunity.com', function (res) {
        logger(`SteamCommunity is up! Status code: ${res.statusCode}`, false, true)
        if (continuewithlogin) startlogin();

    }).on('error', function(err) {
        logger(`\x1b[0m[\x1b[31mWarning\x1b[0m]: SteamCommunity seems to be down or your internet isn't working! Aborting...\n           Error: ` + err, true)
        if (stoponerr) process.exit(0) }) }


module.exports={
    bootstart,
    steamGuardInputTimeFunc,
    steamGuardInputTime,
    readyafter,
    logger,
    communityobject,
    botobject,
    checkm8,
    commenteverywhere,
    activecommentprocess,
    quotes,
    round,
    failedcomments,
    accisloggedin,
    aboutstr,
    round,
    isSteamOnline,
    skippednow,
    proxies,
    proxyShift,
    logininfo }


/* ------------ Startup & Login: ------------ */
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
        var estimatedlogintime = (extdata.totallogintime / extdata.timesloggedin) * (Object.keys(logininfo).length - updater.skippedaccounts.length) }

    var estimatedlogintimeunit = "seconds"
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "minutes" }
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "hours" }                                                                                                                                                                                                                                                                          //🥚!
    logger(`Logging in... Estimated wait time: ${round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`)

    if(checkm8!="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"){process.exit(0)}
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
                        if (logininfo[k][2] != "" && logininfo[k][2] != "shared_secret") { logOnOptions["twoFactorCode"] = SteamTotp.generateAuthCode(logininfo[k][2]) }

                        b.run(logOnOptions, i); //run bot.js with corresponding account
                    }, logindelay) }
            }, 250);
        }, 1500 * (i - skippednow.length)); //1.5 seconds before checking if next account can be logged in should be ok
    }) }

//Code by: https://github.com/HerrEurobeat/ 


/* ------------ Everything logged in: ------------ */
var readyinterval = setInterval(() => { //log startup to console
    if (Object.keys(communityobject).length + skippednow.length == Object.keys(logininfo).length && module.exports.accisloggedin == true) {
        clearInterval(readyinterval)

        logger(' ', true)
        logger('*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
        logger(`\x1b[95m>\x1b[0m \x1b[96m${logininfo.bot0[0]}\x1b[0m version \x1b[96m${extdata.version}\x1b[0m by ${extdata.mestr} logged in.`, true)
        if (config.repeatedComments > 3) { var repeatedComments = `\x1b[4m\x1b[31m${config.repeatedComments}\x1b[0m` } else { var repeatedComments = config.repeatedComments }
        logger(`\x1b[94m>\x1b[0m ${Object.keys(communityobject).length - 1} child accounts | User can request ${repeatedComments} comments per Acc`, true)

        //display amount of limited accounts and if automatic updates are turned off
        limitedaccs = 0
        failedtocheck = 0
        try {
            for (i = 0; i < Object.keys(botobject).length; i++) {
                if (botobject[Object.keys(botobject)[i]].limitations != undefined && botobject[Object.keys(botobject)[i]].limitations.limited != undefined) { //if it should be undefined for what ever reason then rather don't check instead of crash the bot
                    if (botobject[Object.keys(botobject)[i]] != undefined && botobject[Object.keys(botobject)[i]].limitations.limited == true) limitedaccs++ //yes, this way to get the botobject key by iteration looks stupid and is probably stupid but it works and is "compact" (not really but idk)
                } else { logger(`failed to check if bot${i} is limited. Showing account in startup message as unlimited...`, false, true); failedtocheck++ }

                if (Number(i) + 1 == Object.keys(botobject).length && limitedaccs > 0) {
                    if (failedtocheck > 0) { var failedtocheckmsg = `(Couldn't check ${failedtocheck} account(s))`; }
                        else { var failedtocheckmsg = ""; }
                    logger(`\x1b[92m>\x1b[0m ${limitedaccs}/${Object.keys(botobject).length} account(s) are \x1b[31mlimited\x1b[0m ${failedtocheckmsg}`, true) }}
        } catch (err) {
            logger(`Error in limited checker: ${err}`) }

        if (config.disableautoupdate) logger("\x1b[41m\x1b[30m>\x1b[0m Automatic updating is \x1b[4m\x1b[31mturned off\x1b[0m!", true)

        var playinggames = ""
        if (config.playinggames[1]) var playinggames = `(${config.playinggames.slice(1, config.playinggames.length)})`
        logger(`\x1b[93m>\x1b[0m Playing status: \x1b[32m${config.playinggames[0]}\x1b[0m ${playinggames}`, true)

        const bootend = (new Date() - bootstart) - steamGuardInputTime
        readyafter = bootend / 1000
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
                logger(`[\x1b[31mWarning\x1b[0m] ${e} is not a valid ownerid!`, true) } })
        
        //Check if owner link is correct
        logger(`Checking if owner link is valid...`, false, true)
        if (!config.owner.includes("steamcommunity.com")) { 
            logger("\x1b[0m[\x1b[31mNotice\x1b[0m] You haven't set a correct owner link to your profile in the config!\n         Please add this to refer to yourself as the owner and operator of this bot.", true) 
        } else {
            try {
                owneroutput = ""
                https.get(`${config.owner}?xml=1`, function(ownerres) { //get requesterSteamID of user to check if it is valid
                    ownerres.on('data', function (chunk) {
                        owneroutput += chunk });
    
                    ownerres.on('end', () => {
                        new xml2js.Parser().parseString(owneroutput, function(ownererr, ownerResult) {
                            if (ownererr) return logger("error parsing owner xml: " + ownererr, true)
                            if (ownerResult.response && ownerResult.response.error) return logger("\x1b[0m[\x1b[31mNotice\x1b[0m] You haven't set a correct owner link to your profile in the config!\n         Please add this to refer to yourself as the owner and operator of this bot.\n         Error: " + ownerResult.response.error, true)
                        }) }) })
            } catch (err) {
                if (err) { logger("error getting owner profile xml info: " + err, true); return; } }}

        logger(`Logging supressed logs...`, false, true)
        readyafterlogs.forEach(e => { logger(e, true) }) //log suppressed logs
        
        //Join botsgroup if not already joined
        try {
            if (config.botsgroup.length < 1) {
                logger('Skipping botsgroup because config.botsgroup is empty.', false, true);
            } else {
                logger(`Checking if all accounts are in botsgroup...`, false, true)
                botsgroupoutput = ""
                if (config.botsgroup == config.yourgroup) {
                    botsgroupid = botobject[0]["configgroup64id"]

                    Object.keys(botobject).forEach((e) => {
                        if (!Object.keys(botobject[e].myGroups).includes(String(botsgroupid))) {
                            communityobject[e].joinGroup(`${botsgroupid}`)
                            logger(`[Bot ${e}] Joined/Requested to join steam group that has been set in the config (botsgroup).`) } })
                } else {
                    if (cachefile.botsgroup == config.botsgroup) {

                    } else {
                        https.get(`${config.botsgroup}/memberslistxml/?xml=1`, function(botsgroupres) { //get group64id from code to simplify config
                            botsgroupres.on('data', function (chunk) {
                                botsgroupoutput += chunk });
                    
                            botsgroupres.on('end', () => {
                                if (!String(botsgroupoutput).includes("<?xml") || !String(botsgroupoutput).includes("<groupID64>")) { //Check if botsgroupoutput is steam group xml data before parsing it
                                    logger("\x1b[0m[\x1b[31mNotice\x1b[0m] Your bots group (botsgroup in config) doesn't seem to be valid!\n         Error: " + config.botsgroup + " contains no xml or groupID64 data", true); 
                                    botsgroupid = "" 
                                } else {
                                    new xml2js.Parser().parseString(botsgroupoutput, function(botsgrouperr, botsgroupResult) {
                                        if (botsgrouperr) return logger("error parsing botsgroup xml: " + botsgrouperr, true)

                                        botsgroupid = botsgroupResult.memberList.groupID64

                                        cachefile.botsgroup = config.botsgroup
                                        cachefile.botsgroupid = String(botsgroupResult.memberList.groupID64)
                                        fs.writeFile("./src/cache.json", JSON.stringify(cachefile, null, 4), err => { 
                                          if (err) logger(`[${thisbot}] error writing configgroup64id to cache.json: ${err}`) })
                            
                                        Object.keys(botobject).forEach((e) => {
                                            if (!Object.keys(botobject[e].myGroups).includes(String(botsgroupid))) {
                                                communityobject[e].joinGroup(`${botsgroupid}`)
                                                logger(`[Bot ${e}] Joined/Requested to join steam group that has been set in the config (botsgroup).`) }
                                        }) }) } })
                            }).on("error", function(err) {
                                logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get botsgroup 64id. Either Steam is down or your internet isn't working.\n          Error: " + err, true)
                                botsgroupid = ""
                        }) }} }
        } catch (err) {
            if (err) return logger("error getting botsgroup xml info: " + err, true) }

        //Unfriend stuff
        if (config.unfriendtime > 0) {
            logger(`Associating bot's accountids with botobject entries...`, false, true)
            var accountids = {}
            var lastcomment = require('./lastcomment.json')
            Object.keys(botobject).forEach((e, i) => {
                Object.keys(accountids).push(e)
                accountids[e] = botobject[e]['steamID']['accountid']
            })

            //Compatibility feature for updating from version <2.6
            for(let i in lastcomment) {
                if (String(lastcomment[i].bot).length < 10) {
                    if (accountids[lastcomment[i].bot]) {
                        lastcomment[i].bot = accountids[lastcomment[i].bot] //converts loginindex to accountid
                    } else {
                        delete lastcomment[i] }
                } }

            fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                if (err) logger("lastcomment compatibility error: " + err) })

            //Unfriend checker
            setInterval(() => {
                for(let i in lastcomment) {
                    if (Date.now() > (lastcomment[i].time + (config.unfriendtime * 86400000))) {
                        var iminusid = i.toString().slice(0, -1);

                        var targetkey = Object.keys(accountids).find(key => accountids[key] === lastcomment[i].bot) //convert bot accountid to corresponding id in botobject
                        var targetbot = botobject[targetkey] //grab the targeted bot

                        if (targetbot === undefined) { //this bot account does not seem to be in logininfo.json anymore
                            delete lastcomment[i] //delete entry
                            
                        } else { //bot does seem to be logged in

                            if (targetbot.myFriends[iminusid] === 3 && !config.ownerid.includes(iminusid)) { //check if the targeted user is still friend and not the owner
                                targetbot.chat.sendFriendMessage(new SteamID(iminusid), `You have been unfriended for being inactive for ${config.unfriendtime} days.\nIf you need me again, feel free to add me again!`)
                                targetbot.removeFriend(new SteamID(iminusid)); //unfriend user
                                logger(`[Bot ${targetkey}] Unfriended ${iminusid} after ${config.unfriendtime} days of inactivity.`) } 

                            if (!config.ownerid.includes(iminusid)) delete lastcomment[i]; } //entry gets removed no matter what but we are nice and let the owner stay. Thank me later! <3
                    } }
                fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => { //write changes
                    if (err) logger("delete user from lastcomment.json error: " + err) })
            }, 30000) 
        }

        //Write logintime stuff to data.json
        logger(`Writing logintime...`, false, true)
        extdata.totallogintime = round(extdata.totallogintime, 2)
        extdata.firststart = false
        fs.writeFile("./src/data.json", JSON.stringify(extdata, null, 4), err => { //write changes
            if (err) logger("change extdata to false error: " + err) 

            logger('Startup complete!', false, true) })

        if (config.enableurltocomment) {
            var express = require("express")
            var app = express()
            
            app.get('/', (req, res) => {
                res.status(200).send("<title>Comment Bot Web Request</title><b>3urobeat's Comment Bot | Comment Web Request</b></br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br></br>Visit /output to see the complete output.txt in your browser!</b></br></br>https://github.com/HerrEurobeat/steam-comment-service-bot") })
            
            app.get('/comment', (req, res) => {
                logger("Web Comment Request recieved by: " + req.ip)
            
                if (req.query.n == undefined) {
                    logger("Web Request denied. Reason: numberofcomments (n) is not specified.")
                    return res.status(400).send("You have to provide an amount of comments.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.") }
            
                if (req.query.id == undefined) {
                    logger("Web Request denied. Reason: Steam profileid (id) is not specified.")
                    return res.status(400).send("You have to provide a profile id where I should comment.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.") }
            
                if (req.query.key == undefined || req.query.key != extdata.urlrequestsecretkey) {
                    logger("Web Request denied. Reason: Invalid secret key.")
                    return res.status(403).send("Your secret key is not defined or invalid. Request denied.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.") }
            
                if (isNaN(config.ownerid[0]) || new SteamID(String(config.ownerid[0])).isValid() == false) {
                    logger("Web Request denied. Reason: Config's first ownerid is invalid.")
                    return res.status(403).send("You can't use the web request feature unless you provided a valid ownerid in your config!") }
                
                logger(`Web Comment Request accepted. Amount: ${req.query.n} | Profile: ${req.query.id}`)
                botobject[0].commentcmd(new SteamID(String(config.ownerid[0])), [req.query.n, req.query.id], res) //steamID: Make the bot owner responsible for request
            });
            
            app.get('/output', (req, res) => { //Show output
                fs.readFile("./output.txt", (err, data) => {
                    if(err) logger("urltocomment: error reading output.txt: " + err)
                
                    res.write(String(data))
                    res.status(200)
                    res.end()
                }) })
            
            app.use((req, res) => { //Show idk page thanks
                res.status(404).send("404: Page not Found.</br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.") });
            
            module.exports.server = app.listen(3034, () => {
                logger('EnableURLToComment is on: Server is listening on port 3034.\nVisit it on: localhost:3034\n', true) });
        }

        setTimeout(() => {
            //Startup is done, clean up
            delete readyafterlogs; //delete var as the logs got logged by now
            delete skippednow;
            logger(` `, true, true) //clear out last remove message
        }, 5000); }
}, 500);

//Code by: https://github.com/HerrEurobeat/

hellothereascii =
` _   _      _ _         _   _                   
| | | |    | | |       | | | |                  
| |_| | ___| | | ___   | |_| |__   ___ _ __ ___ 
|  _  |/ _ | | |/ _ \\  | __| '_ \\ / _ | '__/ _ \\
| | | |  __| | | (_) | | |_| | | |  __| | |  __/
\\_| |_/\\___|_|_|\\___/   \\__|_| |_|\\___|_|  \\___|
                                                
General Kenobi `

binaryascii = "01000011 01101111 01101101 01101101 01100101 01101110 01110100  01000010 01101111 01110100"

ascii = ascii = [`
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