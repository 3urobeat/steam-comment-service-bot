//This file only exists to ensure compatibility with older start.js when updating automatically
module.exports.restartdata = () => { } //empty restartdata function to suppress error on 2.10.x -> 2.11 automatic update

var fs = require("fs")

if (!fs.existsSync("./src/starter.js")) { //Get filetostart if it doesn't exist
    var output = ""

    try {
        var https = require("https")

        console.log("Pulling starter.js...")

        https.get("https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/beta-testing/src/starter.js", function (res) {
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk 
            });

            res.on('end', () => {
                fs.writeFile("./src/starter.js", output, (err) => {
                    if (err) return console.log(err)

                    require("./starter.js").run() //Just start the bot
                })
            }) 
        });
    } catch (err) { 
        console.log('start.js get starter.js function Error: ' + err)
        process.exit(1)
    }
} else {
    require("./starter.js").run() //Just start the bot
}