//Code by: https://github.com/HerrEurobeat/ 

var b           = require('./bot.js')
var commentjs   = require('./comment.js')
const logininfo = require('./logininfo.json');
const config    = require('./config.json');

botcount = 0;
var readyarray = []
const d = function d() { return new Date(); }
var bootstart = 0;
var bootstart = d()


//Functions:
var logger = function logger(string) { //Custom logger
    console.log(string)
    require('fs').appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger(LOGERR + 'Error: ' + err) }) }

process.on('unhandledRejection', (reason, p) => {
    logger(`Unhandled Rejection! Reason: ${reason.stack}`) });

var commenteverywhere = function commenteverywhere(steamID) {
    Object.keys(logininfo).forEach((k, i) => {
        if (i < 1) return;
        var logOnOptions = {
            accountName: logininfo[k][0],
            password: logininfo[k][1],
            machineName: "3urobeat's Commment Bot"
        };
        commentjs.run(logOnOptions, steamID, `Bot ${i}`); 
    })}  

module.exports={
    logger,
    readyarray, 
    commenteverywhere
}


//Logging in:
if (config.mode === 1) {
    Object.keys(logininfo).forEach((k) => {
        var logOnOptions = {
            accountName: logininfo[k][0],
            password: logininfo[k][1],
            machineName: "3urobeat's Commment Bot"
        };
        b.run(logOnOptions);
        botcount++
    })
} else if (config.mode === 2) {
    var logOnOptions = {
        accountName: logininfo.bot1[0],
        password: logininfo.bot1[1],
        machineName: "3urobeat's Commment Bot"
    };
    b.run(logOnOptions);
    botcount++

} else {
    logger("\x1b[31mThe mode you provided is invalid! Please choose between 1 or 2. Aborting...\x1b[0m")
    process.exit(0); }


var readyinterval = setInterval(() => {
    if (readyarray.length == botcount) {
        logger(' ')
        logger('*---------------------*')
        if (botcount == 1) logger(`\x1b[34m${logininfo.bot1[0]}\x1b[0m version ${config.version} successfully logged in.`); else logger(`Started ${botcount} accounts version ${config.version}.`);
        logger(`Using Mode ${config.mode}`)
        const bootend = d() - bootstart
        logger('Ready after ' + bootend + 'ms!')
        logger('*---------------------*')
        logger(' ')
        clearInterval(readyinterval)
    }
}, 100);