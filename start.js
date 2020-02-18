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
        if (d().getMonth() < 10) { var month = `0${d().getMonth()}` } else { var month = d().getMonth() } //make 1 digit numbers prettier
        if (d().getDay() < 10) { var day = `0${d().getDay()}` } else { var day = d().getDay() }
        if (d().getHours() < 10) { var hours = `0${d().getHours()}` } else { var hours = d().getHours() }
        if (d().getMinutes() < 10) { var minutes = `0${d().getMinutes()}` } else { var minutes = d().getMinutes() }
        if (d().getSeconds() < 10) { var seconds = `0${d().getSeconds()}` } else { var seconds = d().getSeconds() }
        var string = `\x1b[34m[${d().getFullYear()}-${month}-${day} ${hours}:${minutes}:${seconds}]\x1b[0m ${str}` }
    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection! Reason: ${reason.stack}`) });

var quotes = new Array();
var quotes = fs.readFileSync('quotes.txt', 'utf8').split("\n"); //get all quotes from the quotes.txt file into an array

var commenteverywhere = function commenteverywhere(steamID) { //function to let all bots comment
    var failedcomments = new Array();
    Object.keys(communityobject).forEach((k, i) => {
        if (i < 1) return; //first account already commented

        communityobject[k].getSteamUser(botobject[k].steamID, (err, user) => { //check if acc is limited and if yes if requester is on friendlist
            if(user.isLimitedAccount && !Object.keys(botobject[k].myFriends).includes(new SteamID(steamID.getSteam3RenderedID()).getSteamID64())) return failedcomments.push(botobject[k].steamID.getSteam3RenderedID())})
        communityobject[k].getSteamUser(steamID, (err, user) => { //check if profile is private
            if(user.privacyState !== "public") return failedcomments.push(botobject[k].steamID.getSteam3RenderedID())});

        var randomstring = arr => arr[Math.floor(Math.random() * arr.length)];
        var comment = randomstring(quotes);
        setTimeout(() => {
            communityobject[k].postUserComment(steamID, comment, (error) => {
                if(error !== null) { logger(`[Bot ${k}] postUserComment error: ${error}`); failedcomments.push(botobject[k].steamID.getSteam3RenderedID()); return; }
                logger(`[Bot ${k}] Comment on ${new SteamID(steamID.getSteam3RenderedID()).getSteamID64()}: ${comment}`) })

            if (Object.keys(communityobject).length === i+1) { botobject[0].chatMessage(steamID, `All comments have been sent. Failed: ${failedcomments.length}/${i+1}`) }

            if (config.unfriendtime > 0) { //add user to lastcomment list if the unfriendtime is > 0 days
                if (botobject[i].myFriends[new SteamID(steamID.getSteam3RenderedID()).getSteamID64()] === 3) {
                    lastcomment[new SteamID(steamID.getSteam3RenderedID()).getSteamID64().toString() + i] = { //add i to steamID to allow multiple entries for one steamID
                        time: Date.now(),
                        bot: i }
                fs.writeFile("./lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                    if (err) logger("delete user from lastcomment.json error: " + err) }) }}

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
              logger(`\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${config.version}\x1b[0m | New version: \x1b[32m${onlineversion}\x1b[0m\nUpdate now: https://github.com/HerrEurobeat/steam-comment-service-bot`, true)}
        });
      });
    } catch (err) {
      logger('checkforupdate function Error: ' + err)
    }
}

accisloggedin = true; //var to check if previous acc is logged on (in case steamGuard event gets fired) -> set to true for first account

module.exports={
    logger,
    communityobject,
    botobject, 
    commenteverywhere,
    quotes,
    accisloggedin }


/* ------------ Login: ------------ */
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


/* ------------ Everything logged in: ------------ */
var readyinterval = setInterval(() => { //log startup to console
    if (Object.keys(communityobject).length === Object.keys(logininfo).length) {
        logger(' ', true)
        logger('*------------------------------------------*', true)
        if (config.mode === 2) logger(`\x1b[34m${logininfo.bot1[0]}\x1b[0m version ${config.version} with ${Object.keys(communityobject).length - 1} child accounts logged in.`, true); 
            else logger(`Started ${Object.keys(logininfo).length} accounts version ${config.version}.`, true);

        communityobject[0].getSteamUser(botobject[0].steamID, (err, user) => { //display warning if account is limited
            if(user.isLimitedAccount) var limitedacc = "Leader Bot has a \x1b[31mlimited account\x1b[0m!"; 
                else var limitedacc = ""
            logger(`Using Mode ${config.mode}. ${limitedacc}`, true)
            const bootend = d() - bootstart
            logger('Ready after ' + (Number(Math.round((bootend / 1000)+'e'+2)+'e-'+2)) + 'sec!', true)
            logger('*------------------------------------------*', true)
            logger(' ', true)
            checkforupdate();

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

                        var iminusid = i.toString().slice(0, -1); 
                        if (botobject[lastcomment[i].bot].myFriends[i] === 3 && !config.ownerid.includes(iminusid)) {
                            botobject[lastcomment[i].bot].removeFriend(iminusid);
                            logger(`Unfriended ${i} from Bot ${lastcomment[i].bot} after ${config.unfriendtime} days of inactivity.`) }
                            
                        delete lastcomment[i];
                        fs.writeFile("./lastcomment.json", JSON.stringify(lastcomment, null, 4), err => {
                            if (err) logger("delete user from lastcomment.json error: " + err) }) }}
                }, 5000) }
        })
        clearInterval(readyinterval)
    }
}, 100);