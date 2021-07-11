//File to help starting application and making start.js more dynamic.

/**
 * Checks if the needed file exists and gets it if it doesn't
 * @param {String} file The file path (from project root) to check and get
 * @param {function} [callback] Called with `ready` (Boolean) on completion.
 */
module.exports.checkAndGetFile = (file, callback) => {
    if (!file) {
        console.log("checkAndGetFile() error: file parameter is undefined!")
        callback(undefined)
        return;
    }

    var fs = require("fs")
    

    if (!fs.existsSync(file)) { //Function that downloads filetostart if it doesn't exist (file location change etc.)
        //Determine branch
        var branch = "master" //Default to master
        try { 
            branch = require("./data/data.json").branch //Try to read from data.json (which will when user is coming from <2.11)
        } catch (err) {
            try {
                var otherdata = require("./data.json") //then try to get the other, "compatibility" data file to check if versionstr includes the word BETA
                
                if (otherdata.versionstr.includes("BETA")) branch = "beta-testing"
            } catch (err) { } //eslint-disable-line
        }


        var fileurl = `https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${branch}/${file.slice(2, file.length)}` //remove the dot at the beginning of the file string

        console.log("Pulling: " + fileurl + "\n")

        try {
            var https = require("https")
            var path  = require("path")

            var output = ""

            //Create the underlying folder structure to avoid error when trying to write the downloaded file
            fs.mkdirSync(path.dirname(file), { recursive: true })

            //Get the file
            https.get(fileurl, function (res) {
                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    output += chunk 
                });

                res.on('end', () => {
                    fs.writeFile(file, output, (err) => {
                        if (err) {
                            console.log(err)
                            callback(null)
                            return;
                        }

                        callback(require("." + file))
                    })
                }) 
            });
        } catch (err) { 
            console.log('start.js get starter.js function Error: ' + err)

            callback(null)
        }
    } else {
        callback(require("." + file))
    }
}


/**
 * Run the application
 */
module.exports.run = () => {
    //Yes, I know, global variables are bad. But I need a few multiple times in different files and it would be a pain in the ass to import them every time and ensure that I don't create a circular dependency and what not.
    global.srcdir = __dirname
    if (typeof started == "undefined") global.started = false //Only set if undefined so that the check below works
    
    if (started == true) return; //Don't start if bot is already logged in (perhaps an accidental start)
    started = true
    
    this.checkAndGetFile("./src/controller/controller.js", (file) => {
        file.run()
    })
}


/**
 * Restart the application
 * @param {*} args The argument object that will be passed to `controller.restartargs()`
 * @param {Boolean} nologOff If true the function won't attempt to log off all bot accounts
 */
module.exports.restart = (args, nologOff) => {
    console.log("Restarting application...")

    if (!nologOff) {
        this.checkAndGetFile("./src/controller/controller.js", (controller) => {

            if (typeof controller.server != "undefined") { //check if the server was exported instead of checking config.json to require less files
                console.log("Stopping URLToComment webserver...")
                controller.server.close() 
            }

            controller.relogAfterDisconnect = false; //Prevents disconnect event (which will be called by logOff) to relog accounts

            console.log("Logging off accounts...")

            Object.keys(controller.botobject).forEach((e) => { //log out all bots
                controller.botobject[e].logOff() 
            })

        })
    }

    //Clear all intervals & timeouts that have been set to avoid issues like this: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/94
    for(var i in global.intervalList) {
        clearInterval(global.intervalList[i]);
    }

    for(var i in global.timeoutList) {
        clearTimeout(global.timeoutList[i]);
    }
    

    Object.keys(require.cache).forEach(function(key) { 
        delete require.cache[key] //clear cache to include file changes
    })

    setTimeout(() => {
        this.checkAndGetFile("./src/controller/controller.js", (file) => {
            file.restartdata(args) //start again after 2.5 sec
        })
    }, 2500)
}


/**
 * Stops the application.
 */
module.exports.stop = () => {
    console.log("Stopping application...")
    process.exit(1) 
}


this.run() //Run this function directly to ensure compatibility with older start.js