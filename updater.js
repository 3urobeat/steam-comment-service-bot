//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

var fs = require('fs')
var https = require("https")
var config = require("./config.json")
var extdata = require('./src/data.json')
var skippedaccounts = []
var botisloggedin = false
var activeupdate = false
var lastupdatecheckinterval = Date.now()
var releasemode = extdata.branch

var logger = (str, nodate, remove) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` } //make errors red in console
    if (str.toLowerCase().includes("updating")) { var str = `\x1b[33m${str}\x1b[0m` } //make errors red in console

    if (nodate) { var string = str; } else {
        var string = `\x1b[96m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}` }

    if (remove) {
        process.stdout.clearLine()
        process.stdout.write(`${string}\r`) //probably dirty solution but these spaces clear up previous lines that were longer
    } else { 
        process.stdout.clearLine()
        console.log(`${string}`) }

    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }

var restartdata = (data) => {
    module.exports.skippedaccounts = data }

var checkforupdate = (forceupdate) => {
    try {
        /* ------------------ Check for new version ------------------ */
        var httpsrequest = https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/data.json`, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                var onlineversion = JSON.parse(chunk).version //parse version number from get request
                module.exports.onlinemestr = JSON.parse(chunk).mestr //get mestr and aboutstr from GitHub to check for modification
                module.exports.onlineaboutstr = JSON.parse(chunk).aboutstr
                if (onlineversion > extdata.version || forceupdate == true || releasemode == "beta-testing" && !onlineversion.includes("BETA") && extdata.version.includes("BETA")) { //version number greater or forceupdate is true?
                    logger("", true)
                    logger(`\x1b[32mUpdate available!\x1b[0m Your version: \x1b[31m${extdata.version}\x1b[0m | New version: \x1b[32m${onlineversion}\x1b[0m`, true)
                    logger("", true)

                    /* ------------------ Check for permission to update ------------------ */
                    var config = require("./config.json")

                    if (config.disableautoupdate == false) { //check if the user has disabled the automatic updater
                        logger('Starting the automatic updater...')
                        startupdate();
                    } else { //user has it disabled, ask for confirmation
                        if (botisloggedin == false) { //only ask on start, otherwise this will annoy the user
                            process.stdout.write(`You have disabled the automatic updater.\nWould you like to update now? [y/n] `)
                            var stdin = process.openStdin();

                            stdin.addListener('data', text => {
                            var response = text.toString().trim()
                            if (response == "y") startupdate();
                                else { require('./src/controller.js'); botisloggedin = true } //start bot or do nothing

                            stdin.pause() }) //stop reading
                        }
                    }

                    /* ------------------ Check stuff & Initiate updater & log out ------------------ */
                    function startupdate() {
                        module.exports.activeupdate = true //block new comment requests by setting active update to true and exporting it

                        if (botisloggedin) { //if bot is already logged in we need to check for ongoing comment processes and log all bots out when finished

                            logger(`Bot is logged in. Checking for active comment process...`, false, true)
                            var activecommentinterval = setInterval(() => { //check if a comment request is being processed every 2.5 secs
                                var controller = require('./src/controller.js')

                                if (controller.activecommentprocess.length == 0) { //start logging off accounts when no comment request is being processed anymore
                                    logger("Logging off your accounts...", true)
                                    Object.keys(controller.botobject).forEach((e, i) => {
                                        logger(`Logging off bot${e}...`, false, true)
                                        controller.botobject[e].logOff() }) } //logging off each account

                                setTimeout(() => {
                                    botisloggedin = false

                                    updaterjs(); //start update
                                    logger(`Starting update...`, false, true)
                                    clearInterval(activecommentinterval);
                                }, 2500);
                            }, 2500) 
                        } else {
                            updaterjs();
                        } }

                    /* ------------------ Start updating files ------------------ */
                    function updaterjs() { //update updater first to fix issues in updater
                        output = ""
                        try {
                            logger("Updating updater.js...", true)
                            logger(`Getting updater.js code from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/updater.js`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Writing new code to updater.js...`, false, true)
                                    fs.writeFile("./updater.js", output, err => {
                                        if (err) logger("error writing updater.js: " + err, true)
                                        botjs();
                                    })}) });
                        } catch (err) { logger('get updater.js function Error: ' + err, true) }}

                    function botjs() {
                        output = ""
                        try {
                            logger("Updating bot.js...", true)
                            logger(`Getting updater.js code from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/bot.js`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Writing new code to bot.js...`, false, true)
                                    fs.writeFile("./src/bot.js", output, err => {
                                        if (err) logger("error writing bot.js: " + err, true)
                                        startjs(); })}) });
                        } catch (err) { logger('get bot.js function Error: ' + err, true) }}

                    function startjs() {
                        output = ""
                        try {
                            logger("Updating start.js...", true)
                            logger(`Getting start.js code from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/start.js`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Writing new code to start.js...`, false, true)
                                    fs.writeFile("./start.js", output, err => {
                                        if (err) logger("error writing start.js: " + err, true)
                                        packagejson(); })}) });
                        } catch (err) { logger('get start.js function Error: ' + err, true) }}

                    function packagejson() {
                        output = ""
                        logger(`Clearing package.json data...`, false, true)
                        fs.writeFile("./package.json", "{}", err => {
                            if (err) logger(err, true) })
                        try {
                            logger("Updating package.json...", true)
                            logger(`Getting package.json data from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/package.json`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Parsing new json data...`, false, true)
                                    output = JSON.parse(output)

                                    logger(`Writing new data to package.json...`, false, true)
                                    fs.writeFile("./package.json", JSON.stringify(output, null, 4), err => {
                                        if (err) logger("error writing package.json: " + err, true)
                                        packagelockjson(); })}) });
                        } catch (err) { logger('get package.json function Error: ' + err, true) }}

                    function packagelockjson() {
                        output = ""
                        logger(`Clearing package-lock.json data...`, false, true)
                        fs.writeFile("./package-lock.json", "{}", err => {
                            if (err) logger(err, true) })
                        try {
                            logger("Updating package-lock.json...", true)
                            logger(`Getting package-lock.json data from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/package-lock.json`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Parsing new json data...`, false, true)
                                    output = JSON.parse(output)

                                    logger(`Writing new data to package-lock.json...`, false, true)
                                    fs.writeFile("./package-lock.json", JSON.stringify(output, null, 4), err => {
                                        if (err) logger("error writing package-lock.json" + err, true) 
                                        configjson(); })}) });
                        } catch (err) { logger('get package-lock.json function Error: ' + err, true) }}

                    //Code by: https://github.com/HerrEurobeat/

                    function configjson() {
                        output = ""
                        try {
                            logger("Updating config.json...", true)
                            logger(`Getting config.json data from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/config.json`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });
                    
                                res.on('end', () => {
                                    logger(`Parsing new json data...`, false, true)
                                    output = JSON.parse(output)
                                    extdata.version = output.version //refresh version in data.json

                                    logger(`Transfering your changes to new config...`, false, true)
                                    Object.keys(output).forEach(e => {
                                        if (!Object.keys(config).includes(e)) return; //config value seems to have gotten deleted
                                        output[e] = config[e]
                                    });

                                    logger(`Writing new data to package.json...`, false, true)
                                    fs.writeFile("./config.json", JSON.stringify(output, null, 4), err => {
                                        if (err) logger("error writing config.json: " + err, true) 
                                        controllerjs(); })
                                })})
                        } catch (err) { logger('get config.json function Error: ' + err, true) }} 

                    function controllerjs() {
                        output = ""
                        try {
                            logger("Updating controller.js...", true)
                            logger(`Getting controller.js code from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/controller.js`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Writing new code to updater.js...`, false, true)
                                    fs.writeFile("./src/controller.js", output, err => {
                                        if (err) logger("error writing controller.js: " + err, true);
                                        datajson(); })
                                    })});
                        } catch (err) { logger('get controller.js function Error: ' + err, true) }}

                    function datajson() {
                        output = ""
                        try {
                            logger("Updating data.json...", true)
                            logger(`Getting data.json data from GitHub...`, false, true)
                            https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/data.json`, function(res){
                                res.setEncoding('utf8');
                                res.on('data', function (chunk) {
                                    output += chunk });

                                res.on('end', () => {
                                    logger(`Parsing new json data...`, false, true)
                                    output = JSON.parse(output)

                                    logger(`Writing new data to data.json...`, false, true)
                                    fs.writeFile("./src/data.json", JSON.stringify(output, null, 4), err => {
                                        if (err) logger("error writing data.json: " + err, true) 
                                        logger("\x1b[32mUpdate finished. Restarting myself in 5 seconds...\x1b[0m", true);
                                        setTimeout(() => {
                                            module.exports.activeupdate = false
                                            require('./start.js').restart(skippedaccounts, true);
                                        }, 5000); })}) }); //restart the bot
                        } catch (err) { logger('get data.json function Error: ' + err, true) }}
                } else {
                    if (botisloggedin == false) require('./src/controller.js'); botisloggedin = true //no update, start bot
                }
            }) }).on("error", function(err) {
                logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't check the newest version on GitHub. You can ignore this error.\n          Error: " + err, true) })

            lastupdatecheckinterval = Date.now() + 43200000 //12 hours in ms

            httpsrequest.on("error", function(err) {
                logger("\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't check for an available update because either GitHub is down or your internet isn't working.\n          Error: " + err, true)
                if (botisloggedin == false) {
                    logger("\nTrying to start the bot anyway in 5 seconds...", true)
                    setTimeout(() => {
                        require('./src/controller.js'); 
                        botisloggedin = true //try to start bot anyway
                    }, 5000);
            } })
        } catch (err) {
            logger('checkforupdate/update function Error: ' + err, true) }}

logger("\nBootup sequence started...", true, true) //mark new execution in output.txt
        
//Compatibility features
if (!fs.existsSync('./src')){ //this has to trigger if user was on version <2.6
    try {
        logger("Applying 2.6 compatibility changes...", false, true)
        fs.mkdirSync('./src') 

        fs.writeFile('./src/data.json', '{ "version": 0 }', (err) => { //create data.json to avoid errors
            if (err) logger("error creating data.json: " + err, true) })
        fs.unlink("./bot.js", (err) => { //delete bot.js
            if (err) logger("error deleting bot.js: " + err, true) }) 
        fs.rename("./lastcomment.json", "./src/lastcomment.json", (err) => { //move lastcomment.json
            if (err) logger("error moving lastcomment.json: " + err, true) })

        var logininfo = require('./logininfo.json')

        if (Object.keys(logininfo)[0] == "bot1") { //check if first bot is 1 (old) and not 0
            Object.keys(logininfo).forEach((e, i) => {      
                Object.defineProperty(logininfo, `bot${i}`, //Credit: https://stackoverflow.com/a/14592469 
                    Object.getOwnPropertyDescriptor(logininfo, e));
                delete logininfo[e]; })
            
            fs.writeFile("./logininfo.json", JSON.stringify(logininfo, null, 4), err => {
                if(err) logger("error writing changes to logininfo.json: " + err, true) }) }

        if (config.globalcommentcooldown == 5000) { //check if the user uses default settings and raise 5 to 10 sec
            config.globalcommentcooldown = 10000
            fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                if (err) logger('error changing default globalcommentcooldown value: ' + err, true) }) }

        setTimeout(() => {
            checkforupdate(true) //force to update again to get files from new structure
        }, 1000);
    } catch(err) {
        logger("\n\n\x1b[31m*------------------------------------------*\x1b[0m\nI have problems updating your bot to the new filesystem.\nPlease restart the bot. If you still encounter issues:\n\nPlease either download and setup the bot manually again (https://github.com/HerrEurobeat/steam-comment-service-bot/)\nor open an issue (https://github.com/HerrEurobeat/steam-comment-service-bot/issues) and include the errors\n(*only* if you have no GitHub account message 3urobeat#0975 on Discord).\n\x1b[31m*------------------------------------------*\x1b[0m\n\nError: \n" + err + "\n", true) }

} else if (Object.keys(config).includes("botsgroupid")) { //this has to trigger if user was on version <2.7
    if (config.botsgroupid != "") {
        logger("Applying 2.7 compatibility changes...", false, true)
        const xml2js = require("xml2js")
        Object.keys(config).push("botsgroup") //add new key

        try {
            output = ""
            https.get(`https://steamcommunity.com/gid/${config.botsgroupid}/memberslistxml/?xml=1`, function(res) { //get group64id from code to simplify config
                res.on('data', function (chunk) {
                    output += chunk });

                res.on('end', () => {
                    new xml2js.Parser().parseString(output, function(err, result) {
                        if (err) logger("error parsing botsgroupid xml: " + err)
                        config.botsgroup = `https://steamcommunity.com/groups/${result.memberList.groupDetails.groupURL}` //assign old value to new key 

                        fs.writeFile("./config.json", JSON.stringify(output, null, 4), (err) => {
                            if (err) logger('error writing botsgroupid to botsgroup: ' + err, true) })
                            checkforupdate(true) //force update so that config gets cleaned up
                    }) }) })
        } catch (err) {
            if (err) logger("error getting groupurl of botsgroupid or getting new config: " + err) } 
    } else {
        checkforupdate(true) }

} else {
    logger("Checking for update...", false, true)
    if (releasemode == "beta-testing") logger("\x1b[0m[\x1b[31mNotice\x1b[0m] Your updater is running in beta mode. These versions could be more unstable than master versions.\nIf you find an error or bug please report it: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose\n", true)
    checkforupdate() //check will start the bot afterwards
}

module.exports={
    restartdata,
    skippedaccounts,
    checkforupdate,
    activeupdate,
    releasemode,
    lastupdatecheckinterval
}

setInterval(() => { //update interval
    if (Date.now() > lastupdatecheckinterval) {
        fs.readFile("./output.txt", function (err, data) {
            if (err) logger("error checking output for update notice: " + err)
            if (!data.toString().split('\n').slice(data.toString().split('\n').length - 21).join('\n').includes("Update available!")) { //check last 20 lines of output.txt for update notice
                checkforupdate() } }) }
}, 300000); //5 min in ms

//Code by: https://github.com/HerrEurobeat/ 