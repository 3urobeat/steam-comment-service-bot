//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

const SteamID = require('steamid');
const fs = require("fs");

var updater = require('../updater.js')
var b = require('./bot.js');
var logininfo = require('../logininfo.json');
var config = require('../config.json');
var extdata = require('./data.json');
lastcomment = require("./lastcomment.json")

var communityobject = new Object();
var botobject = new Object();
var readyafterlogs = new Array();
var bootstart = 0;
var bootstart = new Date();
var steamGuardInputTime = 0;
var readyafter = 0
var activecommentprocess = new Array();
process.title = `3urobeat's Steam Comment Service Bot v${extdata.version} | ${process.platform}` //set node process name to find it in task manager etc.


/* ------------ Functions: ------------ */
var logger = (str, nodate) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` }

    if (nodate === true) {
        var string = str; 
    } else { //startup messages should have nodate enabled -> filter messages with date when bot is not started
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}`  
        if (readyafter == 0 && !str.toLowerCase().includes("error") && !str.includes('Logging in... Estimated wait time') && !str.includes("What's new:")) { readyafterlogs.push(string); return; }}

    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Regex Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var steamGuardInputTimeFunc = (arg) => { steamGuardInputTime += arg } //small function to return new value from bot.js

process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection Error! Reason: ${reason.stack}`, true) });

var quotes = new Array();
var quotes = fs.readFileSync('quotes.txt', 'utf8').split("\n"); //get all quotes from the quotes.txt file into an array

var commenteverywhere = (steamID, numberofcomments, requesterSteamID) => { //function to let all bots comment
    var failedcomments = []
    module.exports.activecommentprocess.push(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())

    function comment(k, i, j) {
        setTimeout(() => {
            communityobject[k].getSteamUser(botobject[k].steamID, (err, user) => { //check if acc is limited and if yes if requester is on friendlist
                if (err) { return logger("comment check acc is limited and friend error: " + err) }
                if (user.isLimitedAccount && !Object.keys(botobject[k].myFriends).includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return failedcomments.push(botobject[i].steamID.getSteam3RenderedID())})
            communityobject[k].getSteamUser(steamID, (err, user) => { //check if profile is private
                if (err) { return logger("comment check for private account error: " + err) }
                if (user.privacyState !== "public") return failedcomments.push(botobject[k].steamID.getSteam3RenderedID())});

            var comment = quotes[Math.floor(Math.random() * quotes.length)];

            communityobject[k].postUserComment(steamID, comment, (error) => {
                if (k == 0) var thisbot = `Main`; else var thisbot = `Bot ${k}`;
                if(error) { 
                    logger(`[${thisbot}] postUserComment error: ${error}`); failedcomments.push(botobject[k].steamID.getSteam3RenderedID());
                } else {
                    logger(`[${thisbot}] Comment on ${new SteamID(steamID.getSteam3RenderedID()).getSteamID64()}: ${comment}`) 

                    if (botobject[k].myFriends[requesterSteamID] === 3) {
                        lastcomment[requesterSteamID.toString() + j] = { //add j to steamID to allow multiple entries for one steamID
                            time: Date.now(),
                            bot: botobject[k].steamID.accountid } } }

                if (i == numberofcomments - 1) {
                    fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                        if (err) logger("add user to lastcomment.json from updateeverywhere() error: " + err) })

                    botobject[0].chatMessage(requesterSteamID, `All comments have been sent. Failed: ${failedcomments.length}/${numberofcomments}`); //stop if this execution is more than wanted -> stop loop
                    let value = String(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())
                    module.exports.activecommentprocess = activecommentprocess.filter(item => item !== value) }
            })
        }, config.commentdelay * i); //delay every comment
    }

    var j = 0;

    for(let i = 0; i < numberofcomments; i++) {
        if (i == 0) continue; //first account already commented, skip this iteration

        j++
        if (j + 1 > Object.keys(communityobject).length) { //reset j if it is greater than the number of accounts
            j = 0; } //needed to get multiple comments from one account

        var k = Object.keys(communityobject)[j] //set key for this iteration

        comment(k, i, j) //run actual comment function because for loops are bitchy
    }}

const round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals) }

accisloggedin = true; //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account

if (!(process.env.COMPUTERNAME === 'HÖLLENMASCHINE' && process.env.USERNAME === 'tomgo') && !(process.env.USER === 'pi' && process.env.LOGNAME === 'pi') && !(process.env.USER === 'tom' && require('os').hostname() === 'Toms-Thinkpad')) { //remove myself from config on different computer
    let write = false;
    if (config.owner.includes("3urobeat")) { config.owner = ""; write = true } 
    if (config.ownerid.includes("76561198260031749")) { config.ownerid.splice(config.ownerid.indexOf("76561198260031749"), 1); write = true } 
    if (config.ownerid.includes("76561198982470768")) { config.ownerid.splice(config.ownerid.indexOf("76561198982470768"), 1); write = true }

    if (write == true) {
        var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; },4)
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')                                                                                                                                                                                                                                                                          //🥚!
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

        fs.writeFile("./config.json", stringifiedconfig, err => {
            if (err) logger("delete myself from config.json error: " + err) }) }}


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
    accisloggedin,
    round }


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

logger("\n" + ascii[Math.floor(Math.random() * ascii.length)] + "\n", true)

logger("", true) //put one line above everything that will come to make the output cleaner
if (config.allowcommentcmdusage === false && new SteamID(config.ownerid[0]).isValid() === false) {
    logger("\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m", true)
    process.exit(0); }
if (config.repeatedComments < 1) {
    logger("\x1b[31mYour repeatedComments value in config.json can't be smaller than 1! Automatically setting it to 1...\x1b[0m", true)
    config.repeatedComments = 1 }
if (config.repeatedComments > 2 && config.commentdelay == 5000) {
    logger("\x1b[31mYou have raised repeatedComments but haven't increased the commentdelay. This can cause cooldown errors from Steam.\x1b[0m", true) }

if (extdata.firststart === true) logger("What's new: " + extdata.whatsnew + "\n")

if (extdata.timesloggedin < 5) { //only use new evaluation method when the bot was started more than 5 times
    var estimatedlogintime = ((config.logindelay * (Object.keys(logininfo).length - 1 - updater.skippedaccounts.length)) / 1000) + 3
} else {
    var estimatedlogintime = (extdata.totallogintime / extdata.timesloggedin) * (Object.keys(logininfo).length - updater.skippedaccounts.length) }

var estimatedlogintimeunit = "seconds"
if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "minutes" }
if (estimatedlogintime > 60) { var estimatedlogintime = estimatedlogintime / 60; var estimatedlogintimeunit = "hours" }

logger(`Logging in... Estimated wait time: ${round(estimatedlogintime, 2)} ${estimatedlogintimeunit}.`)

Object.keys(logininfo).forEach((k, i) => { //log all accounts in with the logindelay
    if (updater.skippedaccounts.includes(i)) return; //if this iteration exists in the skippedaccounts array, automatically skip acc again
    setTimeout(() => {
        var logOnOptions = {
            accountName: logininfo[k][0],
            password: logininfo[k][1],
            promptSteamGuardCode: false,
            machineName: "3urobeat's Commment Bot"
        };
        b.run(logOnOptions, i);
    }, config.logindelay * (i - updater.skippedaccounts.length));
})

//Code by: https://github.com/HerrEurobeat/ 


/* ------------ Everything logged in: ------------ */
var readyinterval = setInterval(() => { //log startup to console
    if (Object.keys(communityobject).length === Object.keys(logininfo).length - updater.skippedaccounts.length) {       
        logger(' ', true)
        logger('*------------------------------------------*', true)
        logger(`\x1b[96m${logininfo.bot0[0]}\x1b[0m version \x1b[96m${extdata.version}\x1b[0m by 3urobeat logged in.`, true)
        if (config.repeatedComments > 3) var repeatedComments = `\x1b[31m${config.repeatedComments}\x1b[0m`; else var repeatedComments = config.repeatedComments;
        logger(`${Object.keys(communityobject).length - 1} child accounts | User can request ${repeatedComments} comments per Acc`, true)

        communityobject[0].getSteamUser(botobject[0].steamID, (err, user) => { //display warning if account is limited
            if(user.isLimitedAccount) logger("Leader Bot has a \x1b[31mlimited account\x1b[0m!", true); 

            var playinggames = ""
            if(config.playinggames[1]) var playinggames = "("+config.playinggames.slice(1, config.playinggames.length)+")"
            logger(`Playing status: \x1b[32m${config.playinggames[0]}\x1b[0m ${playinggames}`, true)

            const bootend = (new Date() - bootstart) - steamGuardInputTime
            readyafter = bootend / 1000

            var readyafterunit = "seconds"
            if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "minutes" }
            if (readyafter > 60) { readyafter = readyafter / 60; var readyafterunit = "hours" }
            
            logger(`Ready after ${round(readyafter, 2)} ${readyafterunit}!`, true)
            extdata.timesloggedin++
            extdata.totallogintime += readyafter / Object.keys(communityobject).length //get rough logintime of only one account
            logger('*------------------------------------------*', true)
            logger(' ', true)
            if (updater.skippedaccounts.length > 0) logger(`Skipped Accounts: ${updater.skippedaccounts.length}/${Object.keys(logininfo).length}`, true)

            if (isNaN(config.ownerid[0]) || new SteamID(config.ownerid[0]).isValid() === false) { 
                logger("[\x1b[31mWarning\x1b[0m] You haven't set an correct ownerid in the config!", true) }
            if (!config.owner.includes("steamcommunity.com")) { 
                logger("[\x1b[31mNotice\x1b[0m] You haven't set an correct owner link to your profile in the config!\nPlease add this to refer to yourself as the owner and operator of this bot.", true) }

            readyafterlogs.forEach(e => { logger(e, true) }) //log suppressed logs

            if (config.unfriendtime > 0) {
                var accountids = {}
                Object.keys(botobject).forEach((e, i) => {
                    Object.keys(accountids).push(e)
                    accountids[e] = botobject[e]['steamID']['accountid']
                })

                //Compatibility feature for updating from version <2.6
                for(let i in lastcomment) {
                    if (String(lastcomment[i].bot).length < 10) {
                        if (accountids[lastcomment[i].bot]) {
                            lastcomment[i].bot = accountids[lastcomment[i].bot]
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

                                delete lastcomment[i]; } //entry gets removed no matter what
                        } }
                    fs.writeFile("./src/lastcomment.json", JSON.stringify(lastcomment, null, 4), err => { //write changes
                        if (err) logger("delete user from lastcomment.json error: " + err) })
                }, 5000) 
            }

            extdata.totallogintime = round(extdata.totallogintime, 2)
            extdata.firststart = false
            fs.writeFile("./src/data.json", JSON.stringify(extdata, null, 4), err => { //write changes
                if (err) logger("change extdata to false error: " + err) })
        })
        clearInterval(readyinterval)
    }
}, 250);

//Code by: https://github.com/HerrEurobeat/ 