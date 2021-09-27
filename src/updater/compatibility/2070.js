module.exports.run = (callback) => { //eslint-disable-line
    if (config.botsgroupid != "") {
        var fs = require("fs")
        var https = require("https")
        var xml2js = require("xml2js")


        logger("info", "Applying 2.7 compatibility changes...")
        Object.keys(config).push("botsgroup") //add new key

        try {
            var output = ""

            https.get(`https://steamcommunity.com/gid/${config.botsgroupid}/memberslistxml/?xml=1`, function(res) { //get group64id from code to simplify config
                res.on('data', function (chunk) {
                    output += chunk });

                res.on('end', () => {
                    new xml2js.Parser().parseString(output, function(err, result) {
                        if (err) logger("error", "error parsing botsgroupid xml: " + err)
                        config.botsgroup = `https://steamcommunity.com/groups/${result.memberList.groupDetails.groupURL}` //assign old value to new key 

                        fs.writeFile("./config.json", JSON.stringify(output, null, 4), (err) => {
                            if (err) logger("error", 'error writing botsgroupid to botsgroup: ' + err, true)
                        })

                        logger("info", "I will now update again. Please wait a moment...") //force update so that config gets cleaned up
                        require("../updater").run(true, null, true, (done) => {
                            if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
                        }) 
                    }) 
                }) 
            })
        } catch (err) {
            if (err) logger("error", "error getting groupurl of botsgroupid or getting new config: " + err) 
        }
    } else {
        logger("info", "I will now update again. Please wait a moment...")

        var controller = require("../../controller/controller.js")

        require("../updater").run(true, null, true, (done) => {
            if (done) process.send(`restart(${JSON.stringify({ skippedaccounts: controller.skippedaccounts })})`) //send request to parent process
        })
    }
}

module.exports.info = {
    "master": "2.7",
    "beta-testing": "2.7"
}