module.exports.run = (callback) => {
    var fs        = require("fs")

    var logininfo = require("../../../logininfo.json")

        
    config.maxComments = Object.keys(logininfo).length * config.repeatedComments //calculate new value which is just amount_of_accounts * repeatedComments
    config.maxOwnerComments = config.maxComments //set max comments allowed for owners to the same value - user can configure it differently later if he/she/it wishes to
    delete config.repeatedComments //remove value from config as it got removed with 2.10.4

    var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
        if(v instanceof Array)
        return JSON.stringify(v);
        return v; 
    }, 4)
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    fs.writeFile('./config.json', stringifiedconfig, (err) => { 
        if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true)
    })

    extdata.compatibilityfeaturedone = true //set compatibilityfeaturedone to true here because we don't need to make another force update through checkforupdate() which would be necessary in order to set it to true from there

    fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => { 
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true)
    })

    callback(true)
}

module.exports.info = {
    "master": "2104",
    "beta-testing": "2104"
}