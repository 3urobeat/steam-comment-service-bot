var i = 0;

module.exports.run = (callback) => { //eslint-disable-line
    var fs = require("fs")

    if (i == 1) return; //when automatically updating from 2.10.x to 2.11 the bot will be executed two times. In order to prevent this I added this really shitty check.
    i++

    //data.json
    try {
        if (fs.existsSync(srcdir + "/data.json")) {
            var oldextdata = require("../../data.json")

            //Check if this file still contains the 3 values to transfer in order to ensure ./src/data/data.json doesn't loose this data
            if (Object.keys(oldextdata).includes("urlrequestsecretkey") && Object.keys(oldextdata).includes("timesloggedin") && Object.keys(oldextdata).includes("totallogintime")) {
                extdata.urlrequestsecretkey = oldextdata.urlrequestsecretkey
                extdata.timesloggedin = oldextdata.timesloggedin
                extdata.totallogintime = oldextdata.totallogintime
        
                fs.writeFile(srcdir + "/data/data.json", JSON.stringify(extdata, null, 4), err => { //write the changed file
                    if (err) {
                        logger("error", `error writing to data.json: ${err}`, true)            
                    }
                })
            }
        }
    } catch (err) {
        logger("error", "Failed to transfer urlrequestsecretkey, timesloggedin and totallogintime to new data.json: " + err)
    }


    //Move both data files to their new home
    if (fs.existsSync(srcdir + "/cache.json")) fs.renameSync(srcdir + "/cache.json", srcdir + "/data/cache.json")
    if (fs.existsSync(srcdir + "/lastcomment.db")) fs.renameSync(srcdir + "/lastcomment.db", srcdir + "/data/lastcomment.db")


    //Run updater again
    logger("info", "I will now update again. Please wait a moment...")

    var controller = require("../../controller/controller.js")

    require("../updater").run(true, null, true, (done) => {
        if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
    })
}

module.exports.info = {
    "master": "21100",
    "beta-testing": "2110b4"
}