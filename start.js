var fs = require('fs')
var https = require("https")
botisloggedin = false
var lastupdatecheckinterval = Date.now()

var logger = function logger(str, nodate) { //Custom logger
    if (nodate === true) { var string = str; } else {
        var string = `\x1b[96m[${(new Date(Date.now() - ((d()).getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}` }
    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var checkforupdate = function checkforupdate(forceupdate) {
    try {
        var extdata = require('./src/data.json')

        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/config.json", function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            var onlineversion= JSON.parse(chunk).version
            if (onlineversion > extdata.version || forceupdate == true) {
                logger("", true)
                logger(`\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${extdata.version}\x1b[0m | New version: \x1b[32m${onlineversion}\x1b[0m\nUpdate now: https://github.com/HerrEurobeat/steam-comment-service-bot`, true)
                logger("", true)

                let output = '';

                logger('Starting the automatic updater...')

                if (botisloggedin == true) {
                    var controller = require('./src/controller.js')
                    Object.keys(controller.botobject).forEach((e) => {
                        controller.botobject[e].logOff() }) 

                    var controller = require.resolve('./src/controller.js')
                    delete require.cache[controller]
                    var bot = require.resolve('./src/bot.js')
                    delete require.cache[bot]

                    botisloggedin = false
                }
                botjs();

                function botjs() {
                    output = ""
                    try {
                        logger("Updating bot.js...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/tree/master/src/bot.js", function(res){
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
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/tree/master/src/start.js", function(res){
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
                                extdata.version = output.version
                
                                Object.keys(output).forEach(e => {
                                    if (!Object.keys(config).includes(e)) {
                                        config[e] = output[e] }
                                        
                                    fs.writeFile("./config.json", JSON.stringify(config, null, 4), err => {
                                        if (err) logger(err, true) 
                                        datajson(); }) });
                            })})
                    } catch (err) { logger('get config.json function Error: ' + err, true) }} 

                function datajson() {
                    output = ""
                    try {
                        logger("Updating data.json...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/tree/master/src/data.json", function(res){
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                output += chunk });

                            res.on('end', () => {
                                output = JSON.parse(output)

                                fs.writeFile("./src/data.json", JSON.stringify(output, null, 4), err => {
                                    if (err) logger(err, true) 
                                    controllerjs(); })}) });
                    } catch (err) { logger('get data.json function Error: ' + err, true) }}
                
                function controllerjs() {
                    output = ""
                    try {
                        logger("Updating controller.js...", true)
                        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/tree/master/src/controller.json", function(res){
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                output += chunk });

                            res.on('end', () => {
                                output = JSON.parse(output)

                                fs.writeFile("./src/controller.js", JSON.stringify(output, null, 4), err => {
                                    if (err) logger(err, true) 
                                    logger("Update finished. Starting the bot...", true); 
                                    require('./src/controller.js'); })}) }); //start the bot

                    } catch (err) { logger('get controller.js function Error: ' + err, true) }} 
            } else {
                console.log("bili in updater from start.js: " + botisloggedin)
                if (botisloggedin == false) require('./src/controller.js'); //no update, start bot
            }
        }) });
        //lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms
        lastupdatecheckinterval = Date.now() + 2500 //12 hours in ms
        console.log("update from start: " + lastupdatecheckinterval)
    } catch (err) {
        logger('checkforupdate/update function Error: ' + err, true) }}
      

//Compatibility features when updating from version <2.6
if (!fs.existsSync('./src')){ //this has to trigger if user was on version <2.6
    fs.mkdirSync('./src') 

    fs.writeFile('./src/data.json', '{ "version": 0 }', err => { //create data.json to avoid errors
        if (err) logger("error creating data.json: " + err, true) })
    fs.unlinkSync("./bot.js", err => { //delete bot.js
        if (err) logger("error deleting bot.js: " + err, true) }) 
    fs.renameSync("./lastcomment.json", "./src/lastcomment.json", err => { //move lastcomment.json
        if (err) logger("error moving lastcomment.json: " + err + "\nPlease download the newest version manually! https://github.com/HerrEurobeat/steam-comment-service-bot", true) })

/*     var logininfo = "./logininfo.json" //logininfo now starts with bot0 instead of bot1
    Object.keys(logininfo).forEach((e, i) => {
        
    })
    fs.writeFile("./logininfo.json") */

    checkforupdate(true) //force to update again to get files from new structure
}

checkforupdate() //check will start the bot afterwards

module.exports={
    checkforupdate,
    botisloggedin,
    lastupdatecheckinterval
}