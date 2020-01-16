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


/* ------------ Functions: ------------ */
var logger = function logger(string) { //Custom logger
    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger(LOGERR + 'Error: ' + err) }) }

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
                logger(`[Bot ${k}] Comment on ${steamID.getSteam3RenderedID()}: ${comment}`) })

        if (Object.keys(communityobject).length === i+1) { botobject[0].chatMessage(steamID, `All comments have been sent. Failed: ${failedcomments.length}/${i+1}`) }
        }, config.commentdelay * i); //delay every comment
    })}  

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
if (config.allowcommentcmdusage === false && new SteamID(config.ownerid).isValid() === false) {
    logger("\x1b[31mYou set allowcommentcmdusage to false but didn't specify an ownerid! Aborting...\x1b[0m")
    process.exit(0); }
   
//Size of accounts - 1 (first acc logs in instantly) * logindelay -> wait time / 100 -> ms to seconds + 2 tolerance second
logger(`\x1b[34m[${bootstart}]\x1b[0m Logging in... Estimated wait time: ${((config.logindelay * (Object.keys(logininfo).length - 1)) / 1000) + 2} seconds.`)

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
        logger(' ')
        logger('*------------------------------------------*')
        if (config.mode === 2) logger(`\x1b[34m${logininfo.bot1[0]}\x1b[0m version ${config.version} with ${Object.keys(communityobject).length - 1} child accounts logged in.`); 
            else logger(`Started ${Object.keys(logininfo).length} accounts version ${config.version}.`);

        communityobject[0].getSteamUser(botobject[0].steamID, (err, user) => { //display warning if account is limited
            if(user.isLimitedAccount) var limitedacc = "Leader Bot has a \x1b[31mlimited account\x1b[0m!"; 
                else var limitedacc = ""
            logger(`Using Mode ${config.mode}. ${limitedacc}`)
            const bootend = d() - bootstart
            logger('Ready after ' + bootend + 'ms!')
            logger('*------------------------------------------*')
            logger(' ')
        })
        clearInterval(readyinterval)
    }
}, 100);