//Code by: https://github.com/HerrEurobeat/ 
//If you are here, you are wrong. Open config.json and configure everything there!

//This file contains: Starting the updater.js and restarting the whole application without restarting the node process. Very cool!

//This file can't get refreshed automatically after an update. 
//It is designed to be modular and to start and restart the whole application. 
//To be able to change the file it is supposed to start on the fly it pulls the necessary file path from the data.json file

try { //Just try to require, if it should fail then the actual restoring process will be handled later
    var extdata = require("./src/data/data.json")
} catch (err) {
    var extdata = { filetostart: "./src/starter.js", filetostarturl: "https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/beta-testing/src/starter.js" }
}

/* ------------------ Restart function ------------------ */
module.exports.restart = (args, nologOff) => {
    try {
        delete require.cache[__dirname + extdata.filetostart.slice(1, extdata.filetostart.length)] //clear cache of starter file to include file changes
    } catch (err) {
        console.log("start.js: Failed to delete cache of filetostart. If the file contains changes then they are not loaded.\nI will try to start anyway but please restart the bot manually if you see this message.\nError: " + err)
    }

    require(extdata.filetostart).restart(args, nologOff) 
}

/* ------------------- Stop function ------------------- */
module.exports.stop = () => { require(extdata.filetostart).stop() }


/* ---------- Get filetostart if it doesn't exist ---------- */
var fs = require("fs")

if (!fs.existsSync(extdata.filetostart)) { //Function that downloads filetostart if it doesn't exist (file location change etc.)
    var output = ""

    try {
        var https = require("https")

        https.get(extdata.filetostarturl, function (res) {
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk 
            });

            res.on('end', () => {
                fs.writeFile(extdata.filetostart, output, (err) => {
                    if (err) return console.log(err)

                    require(extdata.filetostart).run() //start
                })
            }) 
        });
    } catch (err) { 
        console.log('start.js get starter.js function Error: ' + err)
    }
} else {
    require(extdata.filetostart).run() //Start application
}

//Code by: https://github.com/HerrEurobeat/ 