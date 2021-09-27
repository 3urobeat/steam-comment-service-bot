module.exports.run = (callback) => { //eslint-disable-line
    var fs = require("fs")

    var controller = require("../../controller/controller.js")

    if (fs.existsSync('./updater.js')) {
        logger("info", "Applying 2.8 compatibility changes...")

        fs.unlink("./updater.js", (err) => { //delete old updater.js
            if (err) logger("error", "error deleting old updater.js: " + err, true) 
            
            logger("info", "I will now update again. Please wait a moment...")
            require("../updater").run(true, null, true, (done) => {
                if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
            })
        }) 
    } else {
        logger("info", "I will now update again. Please wait a moment...")
        require("../updater").run(true, null, true, (done) => {
            if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
        })
    }
}

module.exports.info = {
    "master": "2.8",
    "beta-testing": "BETA 2.8 b3"
}