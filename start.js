//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!


var b = require('./bot.js');
const logininfo = require('./logininfo.json');
const config = require('./config.json');
const SteamID = require('steamid');
var fs = require("fs");

var communityobject = new Object();
var botobject = new Object();
const d = function d() { return new Date(); }
var bootstart = 0;
var bootstart = d();
lastcomment = require("./lastcomment.json")


/* ------------ Functions: ------------ */
var logger = function logger(str, nodate) { //Custom logger
    if (nodate === true) { var string = str; } else {
        var string = `\x1b[96m[${(new Date(Date.now() - ((d()).getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}` }
    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection! Reason: ${reason.stack}`) });

var quotes = new Array();
var quotes = fs.readFileSync('quotes.txt', 'utf8').split("\n"); //get all quotes from the quotes.txt file into an array

var commenteverywhere = function commenteverywhere(steamID, numberofcomments) { //function to let all bots comment
    var failedcomments = new Array();
    Object.keys(communityobject).forEach((i) => {
        setTimeout(() => {
            if (i < 1) return; //first account already commented
            if (i >= parseInt(numberofcomments)) return botobject[0].chatMessage(steamID, `All comments have been sent. Failed: ${failedcomments.length}/${numberofcomments}`); //stop if this execution is more than wanted -> maybe dirty solution but it worked best in testing

            communityobject[i].getSteamUser(botobject[i].steamID, (err, user) => { //check if acc is limited and if yes if requester is on friendlist
                if (err) { return logger("comment check acc is limited and friend error: " + err) }
                if (user.isLimitedAccount && !Object.keys(botobject[i].myFriends).includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return failedcomments.push(botobject[i].steamID.getSteam3RenderedID())})
            communityobject[i].getSteamUser(steamID, (err, user) => { //check if profile is private
                if (err) { return logger("comment check for private account error: " + err) }
                if (user.privacyState !== "public") return failedcomments.push(botobject[i].steamID.getSteam3RenderedID())});

            var randomstring = arr => arr[Math.floor(Math.random() * arr.length)];
            var comment = randomstring(quotes);

            communityobject[i].postUserComment(steamID, comment, (error) => {
                if(error) { logger(`[Bot ${i}] postUserComment error: ${error}`); failedcomments.push(botobject[i].steamID.getSteam3RenderedID()); return; }
                logger(`[Bot ${i}] Comment on ${new SteamID(steamID.getSteam3RenderedID()).getSteamID64()}: ${comment}`) 

                if (config.unfriendtime > 0) { //add user to lastcomment list if the unfriendtime is > 0 days
                    if (botobject[i].myFriends[new SteamID(steamID.getSteam3RenderedID()).getSteamID64()] === 3) {
                        lastcomment[new SteamID(steamID.getSteam3RenderedID()).getSteamID64().toString() + i] = { //add i to steamID to allow multiple entries for one steamID
                            time: Date.now(),
                            bot: i }
                    fs.writeFile("./lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                        if (err) logger("delete user from lastcomment.json error: " + err) }) }}
            })
        }, config.commentdelay * i); //delay every comment
    })}

function checkforupdate() {
    var https = require("https")

    try {
        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json", function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            var onlineversion= JSON.parse(chunk).version
            if (onlineversion > config.version) {
            logger(`\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${config.version}\x1b[0m | New version: \x1b[32m${onlineversion}\x1b[0m\nUpdate now: https://github.com/HerrEurobeat/steam-comment-service-bot`, true)
            logger("", true)

            var https = require("https")
            let output = '';

            process.stdout.write(`Would you like to start the automatic updater? (\x1b[31mExperimental feature\x1b[0m, please verify that the update completed successfully) [y/n] `)
                var stdin = process.openStdin();

                stdin.addListener('data', text => {
                var response = text.toString().trim()
                if (response == "y") botjs();

                stdin.pause() }) //stop reading

            function botjs() {
                output = ""
                try {
                    logger("Updating bot.js...", true)
                    https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/bot.js", function(res){
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            output += chunk });

                        res.on('end', () => {
                            fs.writeFile("./bot.js", output, err => {
                                if (err) logger(err, true)
                                startjs(); })}) });
                } catch (err) { logger('get bot.js function Error: ' + err, true) }}

            function startjs() {
                output = ""
                try {
                    logger("Updating start.js...", true)
                    https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/start.js", function(res){
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            output += chunk });

                        res.on('end', () => {
                            fs.writeFile("./start.js", output, err => {
                                if (err) logger(err, true)
                                packagejson(); })}) });
                } catch (err) { logger('get start.js function Error: ' + err, true) }}

            fs.writeFile("./package.json", "{}", err => {
                if (err) logger(err, true) })

            function packagejson() {
                output = ""
                try {
                    logger("Updating package.json...", true)
                    https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/package.json", function(res){
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            output += chunk });

                        res.on('end', () => {
                            output = JSON.parse(output)

                            fs.writeFile("./package.json", JSON.stringify(output, null, 4), err => {
                                if (err) logger(err, true)
                                packagelockjson(); })}) });
                } catch (err) { logger('get package.json function Error: ' + err, true) }}


            fs.writeFile("./package-lock.json", "{}", err => {
                if (err) logger(err, true) })

            function packagelockjson() {
                output = ""
                try {
                    logger("Updating package-lock.json...", true)
                    https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/package-lock.json", function(res){
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            output += chunk });

                        res.on('end', () => {
                            output = JSON.parse(output)

                            fs.writeFile("./package-lock.json", JSON.stringify(output, null, 4), err => {
                                if (err) logger(err, true) 
                                configjson(); })}) });
                } catch (err) { logger('get package-lock.json function Error: ' + err, true) }}


            function configjson() {
                output = ""
                try {
                    logger("Updating config.json...", true)
                    https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json", function(res){
                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            output += chunk });
            
                        res.on('end', () => {
                            output = JSON.parse(output)
                            config.version = output.version
            
                            Object.keys(output).forEach(e => {
                                if (!Object.keys(config).includes(e)) {
                                    config[e] = output[e] }
                                    
                                fs.writeFile("./config.json", JSON.stringify(config, null, 4), err => {
                                    if (err) logger(err, true) }) });
                            logger("Update finished. Please restart the bot!", true)
                        })})
                } catch (err) { logger('get config.json function Error: ' + err, true) }} }
        }) });
        lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms
    } catch (err) {
        logger('checkforupdate/update function Error: ' + err, true) }}

accisloggedin = true; //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account

module.exports={
    logger,
    communityobject,
    botobject, 
    commenteverywhere,
    quotes,
    accisloggedin }


/* ------------ Login: ------------ */
logger("", true) //put one line above everything that will come to make the output cleaner
if (config.mode !== 1 && config.mode !== 2) { //wrong mode? abort.
    logger("\x1b[31mThe mode you provided is invalid! Please choose between 1 or 2. Aborting...\x1b[0m")
    process.exit(0); }
if (config.allowcommentcmdusage === false && new SteamID(config.ownerid[0]).isValid() === false) {
    logger("\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m")
    process.exit(0); }
   
//Size of accounts - 1 (first acc logs in instantly) * logindelay -> wait time / 100 -> ms to seconds + 2 tolerance second
logger(`Logging in... Estimated wait time: ${((config.logindelay * (Object.keys(logininfo).length - 1)) / 1000) + 3} seconds.`)

Object.keys(logininfo).forEach((k, i) => { //log all accounts in with the logindelay
    setTimeout(() => {
        var logOnOptions = {
            accountName: logininfo[k][0],
            password: logininfo[k][1],
            promptSteamGuardCode: false,
            machineName: "3urobeat's Commment Bot"
        };
        b.run(logOnOptions, i);
    }, config.logindelay * i);
})

if (!(process.env.COMPUTERNAME === 'HÖLLENMASCHINE' || process.env.LOGNAME === 'pi') && !(process.env.USERNAME === 'tomgo' || process.env.LOGNAME === 'pi')) { //remove myself from config on different computer
    if (config.owner.includes("3urobeat")) { config.owner = "" }
    if (config.ownerid.includes("76561198260031749")) { config.ownerid.splice(config.ownerid.indexOf("76561198260031749"), 1) }
    if (config.ownerid.includes("76561198982470768")) { config.ownerid.splice(config.ownerid.indexOf("76561198982470768"), 1) }
    
    var stringifiedconfig = JSON.stringify(config,function(k,v){ //Credit: https://stackoverflow.com/a/46217335/12934162
        if(v instanceof Array)
           return JSON.stringify(v);
        return v;
     },4)
     .replace(/"\[/g, '[')
     .replace(/\]"/g, ']')
     .replace(/\\"/g, '"')
     .replace(/""/g, '""');

    fs.writeFile("./config.json", stringifiedconfig, err => {
        if (err) logger("delete myself from config.json error: " + err) }) }

/* ------------ Everything logged in: ------------ */
var readyinterval = setInterval(() => { //log startup to console
    if (Object.keys(communityobject).length === Object.keys(logininfo).length) {
        logger(' ', true)
        logger('*------------------------------------------*', true)
        logger(`\x1b[96m${logininfo.bot1[0]}\x1b[0m version ${config.version} by 3urobeat logged in.`, true)
        if (config.mode === 2) logger(`Using Mode 2: ${Object.keys(communityobject).length - 1} child accounts logged in.`, true); 
            else logger(`Using Mode 1: ${Object.keys(logininfo).length} account(s) logged in.`, true);

        communityobject[0].getSteamUser(botobject[0].steamID, (err, user) => { //display warning if account is limited
            if(user.isLimitedAccount) logger("Leader Bot has a \x1b[31mlimited account\x1b[0m!", true); 
            logger(`Playing status: \x1b[32m${config.playinggames[0]}\x1b[0m (${config.playinggames.slice(1, config.playinggames.length)})`, true)
            const bootend = d() - bootstart
            logger('Ready after ' + (Number(Math.round((bootend / 1000)+'e'+2)+'e-'+2)) + 'sec!', true)
            logger('*------------------------------------------*', true)
            logger(' ', true)

            if (isNaN(config.ownerid[0]) || new SteamID(config.ownerid[0]).isValid() === false) { 
                logger("[\x1b[31mWarning\x1b[0m] You haven't set an correct ownerid in the config!", true) }
            if (!config.owner.includes("steamcommunity.com")) { 
                logger("[\x1b[31mNotice\x1b[0m] You haven't set an correct owner link to your profile in the config!\nPlease add this to refer to yourself as the owner and operator of this bot.", true) }

            checkforupdate();
            setInterval(() => {
                if (Date.now() > lastupdatecheckinterval) {
                    fs.readFile("./output.txt", function (err, data) {
                        if (err) logger("error checking output for update notice: " + err)
                        if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice
                            checkforupdate() } }) }
            }, 300000); //5 min in ms

            if (config.botsgroupid.length > 1 && !isNaN(config.botsgroupid) && new SteamID(config.botsgroupid).isValid()) { //check if botsgroupid is set, a number and a valid id
                Object.keys(botobject).forEach((i) => {
                    if (config.botsgroupid.length < 1) return; //if error occured before this will now stop another execution
                    if (![1,2,3].includes(botobject[i].myGroups[config.botsgroupid])) { //check if bots are not in the group
                        if (user.isLimitedAccount) { logger("Error inviting a bot to the group: The main bot is has a limited account and can't send group invites!", true); clearInterval(readyinterval); config.botsgroupid = ""; return; } //limited accounts can't invite others to groups
                        if (!Object.keys(botobject[0].myGroups).includes(config.botsgroupid)) { logger("Error inviting all bots to the group: The main bot is not in the specified botsgroupid group!", true); clearInterval(readyinterval); config.botsgroupid = ""; return; } //check if main bot is in the group
                        if (i > 0) { botobject[0].inviteToGroup(botobject[i].steamID, config.botsgroupid); logger(`Invited Bot ${i} to the group.`, true) }} //main bot invites the other bot
            }) }

            if (config.unfriendtime > 0) {
                setInterval(() => {
                    for(let i in lastcomment) {
                        if (Date.now() > (lastcomment[i].time + (config.unfriendtime * 86400000))) {
                            if (lastcomment[i].bot == 0) var iminusid = i.toString() 
                                else var iminusid = i.toString().slice(0, -1); 

                            if (botobject[lastcomment[i].bot].myFriends[i] === 3 && !config.ownerid.includes(iminusid)) {
                                botobject[lastcomment[i].bot].chatMessage(new SteamID(iminusid), `You have been unfriended for being inactive for ${config.unfriendtime} days.\nIf you need me again, feel free to add me again!`)
                                botobject[lastcomment[i].bot].removeFriend(new SteamID(iminusid));
                                logger(`[Bot ${lastcomment[i].bot}] Unfriended ${i} after ${config.unfriendtime} days of inactivity.`) 
                                
                                delete lastcomment[i];
                                fs.writeFile("./lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                                    if (err) logger("delete user from lastcomment.json error: " + err) }) }}
                            }
                }, 5000) }
        })
        clearInterval(readyinterval)
    }
}, 100);