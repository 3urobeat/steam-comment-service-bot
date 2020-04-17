var fs = require('fs')
var logger = function logger(str, nodate) { //Custom logger
    if (nodate === true) { var string = str; } else {
        var string = `\x1b[96m[${(new Date(Date.now() - ((d()).getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m ${str}` }
    console.log(string)
    fs.appendFileSync('./output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Credit: https://github.com/Filirom1/stripcolorcodes
      if(err) logger('logger function appendFileSync error: ' + err) }) }
      
//Compatibility features when updating from version <2.6
if (!fs.existsSync('./src')){ //this has to trigger if user was on version <2.6
    fs.mkdirSync('./src') 

    botjs(); //update again!

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
                        datajson(); })}) });
        } catch (err) { logger('get bot.js function Error: ' + err, true) }}

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
                        logger("Update finished. Please restart the bot!", true); })}) });
        } catch (err) { logger('get controller.js function Error: ' + err, true) }}

} else { //second update seems to be done already
    require('./src/controller.js') //start the bot
}

