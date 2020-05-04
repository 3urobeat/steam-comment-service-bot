//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

var fs = require('fs')
var https = require("https")
var skippedaccounts = []
var botisloggedin = false
var activeupdate = false
var lastupdatecheckinterval = Date.now()

var logger = (str, nodate) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` }

    if (nodate === true) { var string = str; } else {
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}` }
    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var restartdata = (data) => {
    module.exports.skippedaccounts = data }

var checkforupdate = (forceupdate) => {
    try {
        var extdata = require('./src/data.json')

        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/data.json", function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            var onlineversion= JSON.parse(chunk).version
            if (onlineversion > extdata.version || forceupdate == true) {
                logger("", true)
                logger(`\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${extdata.version}\x1b[0m | New version: \x1b[32m${onlineversion}\x1b[0m\nUpdate now: https://github.com/HerrEurobeat/steam-comment-service-bot`, true)
                logger("", true)

                logger('Starting the automatic updater...')
                module.exports.activeupdate = true
                let output = '';

                if (botisloggedin == true) { //if bot is already logged in we need to check for ongoing comment processes and log all bots out when finished

                    var activecommentinterval = setInterval(() => {
                        var controller = require('./src/controller.js')

                        if (controller.activecommentprocess == false) { 
                            logger("Logging off your accounts...", true)
                            Object.keys(controller.botobject).forEach((e, i) => {
                                controller.botobject[e].logOff() }) }

                            setTimeout(() => {
                                botisloggedin = false

                                updaterjs();
                                clearInterval(activecommentinterval);
                            }, 2500);
                    }, 2500) 
                } else {
                    updaterjs();
                }

                function updaterjs() { //update updater first to fix issues in updater
                    output = ""
                    try {
                        logger("Updating updater.js...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/updater.js", function(res){
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                output += chunk });

                            res.on('end', () => {
                                fs.writeFile("./updater.js", output, err => {
                                    if (err) logger(err, true)
                                    botjs();
                                })}) });
                    } catch (err) { logger('get updater.js function Error: ' + err, true) }}

                function botjs() {
                    output = ""
                    try {
                        logger("Updating bot.js...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/bot.js", function(res){
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                output += chunk });

                            res.on('end', () => {
                                fs.writeFile("./src/bot.js", output, err => {
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

                function packagejson() {
                    output = ""
                    fs.writeFile("./package.json", "{}", err => {
                        if (err) logger(err, true) })
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

                function packagelockjson() {
                    output = ""
                    fs.writeFile("./package-lock.json", "{}", err => {
                        if (err) logger(err, true) })
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
                                var config = require("./config.json")
                                output = JSON.parse(output)
                                extdata.version = output.version
                
                                Object.keys(output).forEach(e => {
                                    if (!Object.keys(config).includes(e)) {
                                        config[e] = output[e] } });

                                fs.writeFile("./config.json", JSON.stringify(config, null, 4), err => {
                                    if (err) logger(err, true) 
                                    controllerjs(); })
                            })})
                    } catch (err) { logger('get config.json function Error: ' + err, true) }} 

                function controllerjs() {
                    output = ""
                    try {
                        logger("Updating controller.js...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/controller.js", function(res){
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                output += chunk });

                            res.on('end', () => {
                                fs.writeFile("./src/controller.js", output, err => {
                                    if (err) logger(err, true);

                                    datajson(); })}) });
                    } catch (err) { logger('get controller.js function Error: ' + err, true) }}

                function datajson() {
                    output = ""
                    try {
                        logger("Updating data.json...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/src/data.json", function(res){
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                output += chunk });

                            res.on('end', () => {
                                output = JSON.parse(output)

                                fs.writeFile("./src/data.json", JSON.stringify(output, null, 4), err => {
                                    if (err) logger(err, true) 
                                    logger("Update finished. Restarting myself in 5 seconds...", true);
                                    setTimeout(() => {
                                        module.exports.activeupdate = false
                                        require('./start').restart(skippedaccounts, true);
                                    }, 5000); })}) }); //restart the bot
                    } catch (err) { logger('get data.json function Error: ' + err, true) }}
            } else {
                if (botisloggedin == false) require('./src/controller.js'); botisloggedin = true //no update, start bot
            }
        }) });
        lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms
    } catch (err) {
        logger('checkforupdate/update function Error: ' + err, true) }}
      

//Compatibility features when updating from version <2.6
if (!fs.existsSync('./src')){ //this has to trigger if user was on version <2.6
    try {
        fs.mkdirSync('./src') 

        fs.writeFile('./src/data.json', '{ "version": 0 }', (err) => { //create data.json to avoid errors
            if (err) logger("error creating data.json: " + err, true) })
        fs.unlink("./bot.js", (err) => { //delete bot.js
            if (err) logger("error deleting bot.js: " + err, true) }) 
        fs.rename("./lastcomment.json", "./src/lastcomment.json", (err) => { //move lastcomment.json
            if (err) logger("error moving lastcomment.json: " + err, true) })

        var logininfo = require('./logininfo.json')
        var config = require("./config.json")

        if (Object.keys(logininfo)[0] == "bot1") {
            Object.keys(logininfo).forEach((e, i) => {      
                Object.defineProperty(logininfo, `bot${i}`, //Credit: https://stackoverflow.com/a/14592469 
                    Object.getOwnPropertyDescriptor(logininfo, e));
                delete logininfo[e]; })
            
            fs.writeFile("./logininfo.json", JSON.stringify(logininfo, null, 4), err => {
                if(err) logger(err, true) }) }

        if (config.globalcommentcooldown == 5000) { //if the user uses default settings
            config.globalcommentcooldown = 10000
            fs.writeFile('./config.json', JSON.stringify(config, null, 4), (err) => {
                if (err) logger('error changing default globalcommentcooldown value: ' + err, true) }) }

        setTimeout(() => {
            checkforupdate(true) //force to update again to get files from new structure
        }, 1000);
    } catch(err) {
        logger("\n\n\x1b[31m*------------------------------------------*\x1b[0m\nI have problems updating your bot to the new filesystem.\nPlease restart the bot. If you still encounter issues:\n\nPlease either download and setup the bot manually again (https://github.com/HerrEurobeat/steam-comment-service-bot/)\nor open an issue (https://github.com/HerrEurobeat/steam-comment-service-bot/issues) and include the errors\n(*only* if you have no GitHub account message 3urobeat#0975 on Discord).\n\x1b[31m*------------------------------------------*\x1b[0m\n\nError: \n" + err + "\n", true) }
} else {
    checkforupdate() //check will start the bot afterwards
}

module.exports={
    restartdata,
    skippedaccounts,
    checkforupdate,
    activeupdate,
    botisloggedin,
    lastupdatecheckinterval
}

setInterval(() => { //update interval
    if (Date.now() > lastupdatecheckinterval) {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error checking output for update notice: " + err)
            if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice
                checkforupdate() } }) }
}, 300000); //5 min in ms