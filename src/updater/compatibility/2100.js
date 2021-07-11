module.exports.run = (callback) => { //eslint-disable-line
    var fs = require("fs")

    logger("info", "Applying 2.10 compatibility changes...")

    if (fs.existsSync('./src/lastcomment.json')) {     
        const nedb = require("@seald-io//nedb")
        const lastcomment = new nedb("./src/lastcomment.db")
        const lastcommentjson = require("./lastcomment.json")

        lastcomment.loadDatabase((err) => {
            if (err) return logger("error", "Error creating lastcomment.db database! Error: " + err, true)
            logger("info", "Successfully created lastcomment database.", false, true) 
        })

        Object.keys(lastcommentjson).forEach((e) => {
            lastcomment.insert({ id: e, time: lastcommentjson[e].time }, (err) => {
                if (err) logger("error", "Error adding lastcomment.json entries to new lastcomment database! This is not good.\nError: " + err, true)
            }) 
        })

        fs.unlink("./src/lastcomment.json", (err) => { //delete lastcomment.json
            if (err) logger("error", "error deleting lastcomment.json: " + err, true) 
        })
    }

    logger("info", "I will now update again. Please wait a moment...")

    var controller = require("../../controller/controller.js")

    require("../updater").run(true, null, true, (done) => {
        if (done) require("../../../start.js").restart({ skippedaccounts: controller.skippedaccounts })
    })
}

module.exports.info = {
    "master": "2100",
    "beta-testing": "BETA 2.10 b5"
}