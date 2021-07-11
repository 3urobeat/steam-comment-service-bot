var i = 0;

module.exports.run = (callback) => { //eslint-disable-line
    var fs = require("fs")

    if (i == 1) return; //when automatically updating from 2.10.x to 2.11 the bot will be executed two times. In order to prevent this I added this really shitty check.
    i++

    //data.json
    try {
        var oldextdata = require("../../data.json")

        extdata.urlrequestsecretkey = oldextdata.urlrequestsecretkey
        extdata.timesloggedin = oldextdata.timesloggedin
        extdata.totallogintime = oldextdata.totallogintime

        fs.writeFile(srcdir + "/data/data.json", JSON.stringify(extdata, null, 4), err => { //write the changed file
            if (err) {
                logger("error", `error writing to data.json: ${err}`, true)            
            }

            fs.unlinkSync(srcdir + "/data.json")
        })
    } catch (err) {
        logger("error", "Failed to transfer urlrequestsecretkey, timesloggedin and totallogintime to new data.json: " + err)
    }


    //Move both data files to their new home
    fs.renameSync(srcdir + "/cache.json", srcdir + "/data/cache.json")
    fs.renameSync(srcdir + "/lastcomment.db", srcdir + "/data/lastcomment.db")


    //Run updater again
    logger("info", "I will now update again. Please wait a moment...")
    require("../updater").run(true, null, true, (done) => {
        if (done) require("../../../start.js").restart({ skippedaccounts: [] })
    })
}

module.exports.info = {
    "master": "21100",
    "beta-testing": "2110b4"
}