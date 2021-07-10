module.exports.run = (callback) => {
    var fs = require("fs")


    config.globalcommentcooldown = config.globalcommentcooldown / 60000

    fs.writeFile('./config.json', JSON.stringify(config, null, 4), (err) => { 
        if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true)
    })

    extdata.compatibilityfeaturedone = true

    fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => { 
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true)
    })

    callback(true)
}

module.exports.info = {
    "master": "2103",
    "beta-testing": "2103"
}