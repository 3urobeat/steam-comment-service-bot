//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

const SteamID = require('steamid');
const fs = require('fs');
const https = require('https')
const xml2js = require('xml2js')

var updater = require('../updater.js')
var b = require('./bot.js');
var logininfo = require('../logininfo.json');
var config = require('../config.json');
var extdata = require('./data.json');

var communityobject = new Object();
var botobject = new Object();
var readyafterlogs = new Array();
var failedcomments = new Array();
var accstoadd = new Array();
var bootstart = 0;
var bootstart = new Date();
var steamGuardInputTime = 0;
var readyafter = 0
var activecommentprocess = new Array();
process.title = `3urobeat's Steam Comment Service Bot v${extdata.version} | ${process.platform}` //set node process name to find it in task manager etc.


/* ------------ Functions: ------------ */
var logger = (str, nodate, remove) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` }

    if (nodate === true) {
        var string = str; 
    } else { //startup messages should have nodate enabled -> filter messages with date when bot is not started
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}`  
        if (readyafter == 0 && !str.toLowerCase().includes("error") && !str.includes('Logging in... Estimated wait time') && !str.includes("What's new:") && remove !== true) { readyafterlogs.push(string); return; }}
        
    if (remove == true) {
        process.stdout.clearLine()
        process.stdout.write(`${string}\r`) //probably dirty solution but these spaces clear up previous lines that were longer
    } else { 
        process.stdout.clearLine()
        console.log(`${string}`) }

    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Regex Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var steamGuardInputTimeFunc = (arg) => { steamGuardInputTime += arg } //small function to return new value from bot.js

process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection Error! Reason: ${reason.stack}`, true) });

var quotes = new Array();
var quotes = fs.readFileSync('quotes.txt', 'utf8').split("\n"); //get all quotes from the quotes.txt file into an array

var commenteverywhere = (steamID, numberofcomments, requesterSteamID) => { //function to let all bots comment
    failedcomments[requesterSteamID] = {}
    module.exports.activecommentprocess.push(requesterSteamID)

    function comment(k, i, j) {
        setTimeout(() => {
            var comment = quotes[Math.floor(Math.random() * quotes.length)];

            communityobject[k].postUserComment(steamID, comment, (error) => {
                if (k == 0) var thisbot = `Main`; else var thisbot = `Bot ${k}`;
                if(error) { 
                    logger(`[${thisbot}] postUserComment error: ${error}`); 
                    failedcomments[requesterSteamID][`Comment ${i} (bot${j})`] = `postUserComment error: ${error}`
                } else {
                    logger(`[${thisbot}] Comment on ${new SteamID(String(steamID)).getSteamID64()}: ${comment}`) 

                    if (botobject[k].myFriends[requesterSteamID] === 3) {
                        lastcomment[requesterSteamID.toString() + j] = { //add j to steamID to allow multiple entries for one steamID
                            time: Date.now(),
                            bot: botobject[k].steamID.accountid } } }

                if (i == numberofcomments - 1) { //last iteration
                    botobject[0].chatMessage(requesterSteamID, `All comments have been sent. Failed: ${Object.keys(failedcomments[requesterSteamID]).length}/${numberofcomments}`); //stop if this execution is more than wanted -> stop loop

                    fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => { //write all lastcomment changes on last iteration
                        if (err) logger("add user to lastcomment.json from updateeverywhere() error: " + err) })

                    if (Object.values(failedcomments[requesterSteamID]).includes("Error: The settings on this account do not allow you to add comments.")) {
                        accstoadd[requesterSteamID] = []

                        for (i in botobject) {
                            if (!Object.keys(botobject[i].myFriends).includes(new SteamID(String(steamID)).getSteamID64())) {
                                accstoadd[requesterSteamID].push(`\n 'https://steamcommunity.com/profiles/${new SteamID(String(botobject[i].steamID)).getSteamID64()}'`) }

                            if (i == Object.keys(botobject).length - 1)
                                botobject[0].chatMessage(requesterSteamID, "-----------------------------------\nIt seems like at least one of the requested comments could have failed because you/the recieving account aren't/isn't friend with the commenting bot account.\n\nPlease make sure that you have added these accounts in order to eventually avoid this error in the future: \n" + accstoadd[requesterSteamID] + "\n-----------------------------------")
                        } }

                    module.exports.activecommentprocess = activecommentprocess.filter(item => item !== requesterSteamID) 
                }
            })
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

    if (write == true) {
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

//Check config values:
logger("Checking for invalid config values...", false, true)
if (config.allowcommentcmdusage === false && new SteamID(config.ownerid[0]).isValid() === false) {
    logger("\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m", true)
    process.exit(0); }
if (config.repeatedComments < 1) {
    logger("\x1b[31mYour repeatedComments value in config.json can't be smaller than 1! Automatically setting it to 1...\x1b[0m", true)
    config.repeatedComments = 1 }
if (config.repeatedComments > 2 && config.commentdelay == 5000) {
    logger("\x1b[31mYou have raised repeatedComments but haven't increased the commentdelay. This can cause cooldown errors from Steam.\x1b[0m", true) }

//Check lastcomment.json
logger("Checking if lastcomment.json is valid...", false, true) //file can get broken regularly when exiting while the bot was writing etc
fs.readFile('./src/lastcomment.json', function (err, data) {
    if (err) logger("error reading lastcomment.json to check if it is valid: " + err, true)

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
                    logger("Successfully cleared logininfo.json.", false, true)
                    lastcomment = require("./lastcomment.json")
                    isSteamOnline(true, true); //Continue startup
                } })
        }} })

//Check if Steam is online:
var isSteamOnline = function isSteamOnline(continuewithlogin, stoponerr) {
    logger("Checking if Steam is reachable...", false, true)
    https.get('https://steamcommunity.com', function (res) {
        logger(`SteamCommunity is up! Status code: ${res.statusCode}`, false, true)
        if (continuewithlogin == true) startlogin();

    }).on('error', function(err) {
        logger(`\x1b[0m[\x1b[31mWarning\x1b[0m]: SteamCommunity seems to be down or your internet isn't working! Aborting...\n           Error: ` + err, true)
        if (stoponerr == true) process.exit(0) }) }


module.exports={
    bootstart,
    steamGuardInputTimeFunc,
    steamGuardInputTime,
    logger,
    communityobject,
    botobject,
    commenteverywhere,
    activecommentprocess,
    quotes,
    round,
    failedcomments,
    accisloggedin,
    round,
    isSteamOnline }


/* ------------ Startup & Login: ------------ */
module.exports.ascii = ascii = [`
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
░                                                                           ░                   `
]

function startlogin() { //function will be called when steamcommunity status check is done
    logger("", true)
    logger(ascii[Math.floor(Math.random() * ascii.length)] + "\n", true)
    logger("", true) //put one line above everything that will come to make the output cleaner

    if (extdata.firststart === true) logger("What's new: " + extdata.whatsnew + "\n")

    //Evaluate estimated wait time for login:
    logger("Evaluating estimated login time...", false, true)
    if (extdata.timesloggedin < 5) { //only use new evaluation method when the bot was started more than 5 times
        var estimatedlogintime = ((config.logindelay * (Object.keys(logininfo).length - 1 - updater.skippedaccounts.length)) / 1000) + 10 //10 seconds tolerance
    } else {
        var estimatedlogintime = (extdata.totallogintime / extdata.timesloggedin) * (Object.keys(logininfo).length - updater.skippedaccounts.length) }

    var estimatedlogintimeunit = "seconds"
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "minutes" }
    if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "hours" }                                                                                                                                                                                                                                                                          //🥚!
    logger(`Logging in... Estimated wait time: ${round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`)

    logger("Loading logininfo for each account...", false, true)
    skippednow = [] //array to track which accounts have been skipped

    Object.keys(logininfo).forEach((k, i) => { //log all accounts in with the logindelay             
        setTimeout(() => { //wait before interval to reduce ram usage on startup
            var startnextinterval = setInterval(() => { //check if previous account is logged in
                if (module.exports.accisloggedin == true && i == Object.keys(botobject).length || module.exports.accisloggedin == true && skippednow.includes(i - 1)) { //i is being counted from 0, length from 1 -> checks if last iteration is as long as botobject
                    clearInterval(startnextinterval)
                    if (updater.skippedaccounts.includes(i)) { logger(`[skippedaccounts] Automatically skipped ${k}!`, false, true); skippednow.push(i); return; } //if this iteration exists in the skippedaccounts array, automatically skip acc again

                    if (i > 0) logger(`Waiting ${config.logindelay / 1000} seconds... (config logindelay)`, false, true) //first iteration doesn't need to wait duh

                    setTimeout(() => { //wait logindelay
                        logger(`Starting bot.js for ${k}...`, false, true)
                        var logOnOptions = {
                            accountName: logininfo[k][0],
                            password: logininfo[k][1],
                            promptSteamGuardCode: false,
                            machineName: "3urobeat's Comment Bot"
                        };
                        b.run(logOnOptions, i); //run bot.js with corresponding account
                    }, config.logindelay) }
            }, 250);
        }, 1500 * (i - skippednow.length)); //1.5 seconds before checking if next account can be logged in should be ok
    }) }

//Code by: https://github.com/HerrEurobeat/ 


/* ------------ Everything logged in: ------------ */
var readyinterval = setInterval(() => { //log startup to console
    if (Object.keys(communityobject).length == (Object.keys(logininfo).length - updater.skippedaccounts.length) && botobject[Object.keys(logininfo).length - 1].limitations != undefined && module.exports.accisloggedin == true) {
        clearInterval(readyinterval)

        logger(' ', true)
        logger('*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
        logger(`> \x1b[96m${logininfo.bot0[0]}\x1b[0m version \x1b[96m${extdata.version}\x1b[0m by 3urobeat logged in.`, true)
        if (config.repeatedComments > 3) { var repeatedComments = `\x1b[31m${config.repeatedComments}\x1b[0m` } else { var repeatedComments = config.repeatedComments }
        logger(`> ${Object.keys(communityobject).length - 1} child accounts | User can request ${repeatedComments} comments per Acc`, true)

        //display amount of limited accounts and if automatic updates are turned off
        limitedaccs = 0
        for (i = 0; i < Object.keys(botobject).length; i++) {
            if (botobject[Object.keys(botobject)[i]].limitations != undefined && botobject[Object.keys(botobject)[i]].limitations.limited != undefined) { //if it should be undefined for what ever reason then rather don't check instead of crash the bot
                if (botobject[Object.keys(botobject)[i]] != undefined && botobject[Object.keys(botobject)[i]].limitations.limited == true) limitedaccs++ //yes, this way to get the botobject key by iteration looks stupid and is probably stupid but it works and is "compact" (not really but idk)
                if (Number(i) + 1 == Object.keys(botobject).length && limitedaccs > 0)
                    logger(`> ${limitedaccs}/${Object.keys(botobject).length} account(s) are \x1b[31mlimited\x1b[0m`, true)
            } else {
                logger(`failed to check if bot${i} is limited. Showing account in startup message as unlimited...`, false, true) } }

        if (config.disableautoupdate == true) logger("> Automatic updating is \x1b[31mturned off\x1b[0m!", true)

        var playinggames = ""
        if (config.playinggames[1]) var playinggames = `(${config.playinggames.slice(1, config.playinggames.length)})`
        logger(`> Playing status: \x1b[32m${config.playinggames[0]}\x1b[0m ${playinggames}`, true)

        const bootend = (new Date() - bootstart) - steamGuardInputTime
        readyafter = bootend / 1000

        var readyafterunit = "seconds"
        if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "minutes" }
        if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "hours" }
        
        logger(`> Ready after ${round(readyafter, 2)} ${readyafterunit}!`, true)
        extdata.timesloggedin++
        extdata.totallogintime += readyafter / Object.keys(communityobject).length //get rough logintime of only one account
        logger('*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*', true)
        logger(' ', true)
        if (updater.skippedaccounts.length > 0) logger(`Skipped Accounts: ${updater.skippedaccounts.length}/${Object.keys(logininfo).length}`, true)

        //Check if ownerids are correct:
        logger(`Checking for invalid ownerids...`, false, true)
        config.ownerid.forEach((e) => {
            if (isNaN(e) || new SteamID(e).isValid() === false) { 
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
                        
                                    Object.keys(botobject).forEach((e) => {
                                        if (!Object.keys(botobject[e].myGroups).includes(String(botsgroupid))) {
                                            communityobject[e].joinGroup(`${botsgroupid}`)
                                            logger(`[Bot ${e}] Joined/Requested to join steam group that has been set in the config (botsgroup).`) }
                                    }) }) } })
                        }).on("error", function(err) {
                            logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't get botsgroup 64id. Either Steam is down or your internet isn't working.\n          Error: " + err, true)
                            botsgroupid = ""
                    }) } }
        } catch (err) {
            if (err) return logger("error getting botsgroup xml info: " + err, true) }

        //Unfriend stuff
        if (config.unfriendtime > 0) {
            logger(`Associating bot's accountids with botobject entries...`, false, true)
            var accountids = {}
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
                                targetbot.chatMessage(new SteamID(iminusid), `You have been unfriended for being inactive for ${config.unfriendtime} days.\nIf you need me again, feel free to add me again!`)
                                targetbot.removeFriend(new SteamID(iminusid)); //unfriend user
                                logger(`[Bot ${targetkey}] Unfriended ${iminusid} after ${config.unfriendtime} days of inactivity.`) } 

                            if (!config.ownerid.includes(iminusid)) delete lastcomment[i]; } //entry gets removed no matter what but we are nice and let the owner stay. Thank me later! <3
                    } }
                fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => { //write changes
                    if (err) logger("delete user from lastcomment.json error: " + err) })
            }, 5000) 
        }

        //Write logintime stuff to data.json
        logger(`Writing logintime...`, false, true)
        extdata.totallogintime = round(extdata.totallogintime, 2)
        extdata.firststart = false
        fs.writeFile("./src/data.json", JSON.stringify(extdata, null, 4), err => { //write changes
            if (err) logger("change extdata to false error: " + err) 

            //Startup is done, clean up
            delete readyafterlogs; //delete var as the logs got logged by now
            delete skippednow;
            logger('Startup complete!', false, true) })

        setTimeout(() => {
            logger(` `, true, true) //clear out last remove message
        }, 5000); }
}, 500);

//Code by: https://github.com/HerrEurobeat/