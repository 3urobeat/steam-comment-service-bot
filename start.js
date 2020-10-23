//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Starting the updater.js and restarting the whole application without restarting the node process. Very cool!

//This file can't get refreshed automatically after an update. 
//It is designed to be modular and to start and restart the whole application. 
//To be able to change the file it is supposed to start on the fly it pulls the necessary file path from the data.json file

try { //Just try to require, if it should fail then the actual restoring process will be handled later
    extdata = require("./src/data.json")
} catch (err) {
    extdata = { filetostart: "./src/updater.js", filetostarturl: "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/beta-testing/src/updater.js" }
}
var fs = require("fs")

/* ------------------ Restart function ------------------ */
var restart = (args, nologOff) => { //Restart the application
    console.log("Restarting application...")
    var extdata = require('./src/data.json')

    if (!nologOff) {
        var controller = require(extdata.botobjectfile) //get the file we want from data.json

        if (typeof controller.server != "undefined") { //check if the server was exported instead of checking config.json to require less files
            console.log("Stopping URLToComment webserver...")
            controller.server.close() }

        Object.keys(controller.botobject).forEach((e) => { //log out all bots
            controller.botobject[e].logOff() }) }

    Object.keys(require.cache).forEach(function(key) { delete require.cache[key] }) //clear cache to include file changes

    setTimeout(() => {
        require(extdata.filetostart).restartdata(args) //start again after 2.5 sec
    }, 2500) }

/* ------------------ Stop function ------------------ */
var stop = () => {
    console.log("Stopping application...")
    process.exit(1) }

//Exporting functions to be able to call them
module.exports={
    restart,
    stop }


if (!fs.existsSync(extdata.filetostart)) { //Function that downloads filetostart if it doesn't exist (file location change etc.)
    output = ""
    try {
	    var https = require("https")
        https.get(extdata.filetostarturl, function(res){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                output += chunk });

            res.on('end', () => {
                fs.writeFile(extdata.filetostart, output, err => {
                    if (err) return logger(err, true)
                    require(extdata.filetostart) })}) }); //start
    } catch (err) { console.log('start.js get updater.js function Error: ' + err) }
} else {
    require(extdata.filetostart) } //Just passing startup to updater

//Code by: https://github.com/HerrEurobeat/ 