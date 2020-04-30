//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file can't get updated automatically. 
//Therefore it is designed to be modular and to start and restart the whole application.

var fs = require('fs')
var https = require("https")

if (fs.existsSync('./src/data.json')) {
    var data = require('./src/data.json')
} else {
    var data = { filetostart: "./updater.js", filetostarturl: "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/updater.js" } //relevant for update from <2.6
}

var restart = (args, nologOff) => { //Restart the application
    console.log("Restarting application...")

    if (nologOff != true) {
        var data = require('./src/data.json')
        var controller = require(data.botobjectfile)

        Object.keys(controller.botobject).forEach((e) => { //log out all bots
            controller.botobject[e].logOff() })
    }

    Object.keys(require.cache).forEach(function(key) { delete require.cache[key] }) //clear cache to include file changes

    setTimeout(() => {
        require("./updater.js").restartdata(args) //start again after 2.5 sec
    }, 2500) }

var stop = () => {
    console.log("Stopping application...")
    process.exit(1) }

module.exports={
    restart,
    stop }

if (!fs.existsSync(data.filetostart)) {
    output = ""
    try {
        https.get(data.filetostarturl, function(res){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                output += chunk });

            res.on('end', () => {
                fs.writeFile(data.filetostart, output, err => {
                    if (err) return logger(err, true)
                    require(data.filetostart) })}) }); //start
    } catch (err) { logger('start.js get updater.js function Error: ' + err, true) }
} else {
    require(data.filetostart) //Just passing startup to updater
}
