module.exports.run = (callback) => { //eslint-disable-line
    try {
        var fs = require("fs")


        logger("info", "Applying 2.6 compatibility changes...", false, true)
        fs.mkdirSync('./src') 

        fs.writeFile('./src/data.json', '{ "version": 0 }', (err) => { //create data.json to avoid errors
            if (err) logger("error", "error creating data.json: " + err, true) 
        })
        fs.unlink("./bot.js", (err) => { //delete bot.js
            if (err) logger("error", "error deleting bot.js: " + err, true) 
        }) 
        fs.rename("./lastcomment.json", "./src/lastcomment.json", (err) => { //move lastcomment.json
            if (err) logger("error", "error moving lastcomment.json: " + err, true) 
        })

        var logininfo = require('../logininfo.json')

        if (Object.keys(logininfo)[0] == "bot1") { //check if first bot is 1 (old) and not 0
            Object.keys(logininfo).forEach((e, i) => {      
                Object.defineProperty(logininfo, `bot${i}`, //Credit: https://stackoverflow.com/a/14592469 
                    Object.getOwnPropertyDescriptor(logininfo, e));
                delete logininfo[e]; 
            })
            
            fs.writeFile("./logininfo.json", JSON.stringify(logininfo, null, 4), (err) => {
                if (err) logger("error", "error writing changes to logininfo.json: " + err, true) 
            }) 
        }

        if (config.globalcommentcooldown == 5000) { //check if the user uses default settings and raise 5 to 10 sec
            config.globalcommentcooldown = 10000
            fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
                if (err) logger("error", 'error changing default globalcommentcooldown value: ' + err, true) 
            }) 
        }

        setTimeout(() => {
            logger("info", "I will now update again. Please wait a moment...")

            var controller = require("../../controller/controller.js")

            require("../updater").run(true, null, true, (done) => {
                if (done) require("../../../start.js").restart({ skippedaccounts: controller.skippedaccounts })
            }) //force to update again to get files from new structure
        }, 1000);
    } catch(err) {
        logger("", `\n\n\x1b[31m*------------------------------------------*\x1b[0m\nI have problems updating your bot to the new filesystem.\nPlease restart the bot. If you still encounter issues:\n\nPlease either download and setup the bot manually again (https://github.com/HerrEurobeat/steam-comment-service-bot/)\nor open an issue (https://github.com/HerrEurobeat/steam-comment-service-bot/issues) and include the errors\n(*only* if you have no GitHub account message ${extdata.mestr}#0975 on Discord).\n\x1b[31m*------------------------------------------*\x1b[0m\n\nError: \n${err}\n`, true) 
    }
}

module.exports.info = {
    "master": "2.6",
    "beta-testing": "2.6"
}