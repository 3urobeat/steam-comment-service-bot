
/**
 * Runs the enableurltocomment webserver
 */
module.exports.run = () => {
    var fs         = require("fs")
    var SteamID    = require("steamid")
    var express    = require("express")

    var controller = require("./controller.js")
    var mainfile   = require("../bot/main.js")
    var ready      = require("./ready.js")

    var app        = express()


    //Generate urlrequestsecretkey if it is not created already
    if (extdata.urlrequestsecretkey == "") {
        extdata.urlrequestsecretkey = Math.random().toString(36).slice(-10); //Credit: https://stackoverflow.com/a/9719815/12934162
        logger("info", "Generated a secret key for comment requests via url. You can find the key in the 'data.json' file, located in the 'src' folder.", true)
    
        fs.writeFile(srcdir + '/data/data.json', JSON.stringify(extdata, null, 4), (err) => {
            if (err) logger("error", "error writing created urlrequestsecretkey to data.json: " + err) 
        })
    }
    
    
    //start enableurltocomment webserver
    
    app.get('/', (req, res) => {
        res.status(200).send(`<title>Comment Bot Web Request</title><b>${extdata.mestr}'s Comment Bot | Comment Web Request</b></br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br></br>Visit /output to see the complete output.txt in your browser!</b></br></br>https://github.com/HerrEurobeat/steam-comment-service-bot`) 
    })
    
    app.get('/comment', (req, res) => {
        let ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).replace("::ffff:", "") //get IP of visitor

        if (req.query.n == undefined) {
            logger("info", `Web Request by ${ip} denied. Reason: numberofcomments (n) is not specified.`)
            return res.status(400).send("You have to provide an amount of comments.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.") 
        }
    
        if (req.query.id == undefined) {
            logger("info", `Web Request by ${ip} denied. Reason: Steam profileid (id) is not specified.`)
            return res.status(400).send("You have to provide a profile id where I should comment.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.") 
        }
    
        if (req.query.key == undefined || req.query.key != extdata.urlrequestsecretkey) {
            logger("warn", `Web Request by ${ip} denied. Reason: Invalid secret key.`) //I think it is fair to output this message with a warn type
            return res.status(403).send("Your secret key is not defined or invalid. Request denied.</br>If you forgot your secret key you can see it in your 'data.json' file in the 'src' folder.</br>Usage: /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.") 
        }
    
        if (isNaN(config.ownerid[0]) || new SteamID(String(config.ownerid[0])).isValid() == false) {
            logger("warn", `Web Request by ${ip} denied. Reason: Config's first ownerid is invalid.`)
            return res.status(403).send("You can't use the web request feature unless you provided a valid ownerid in your config!") 
        }
        
        logger("info", `Web Comment Request from ${ip} accepted. Amount: ${req.query.n} | Profile: ${req.query.id}`)


        //Run the comment command
        if (!ready.readyafter || controller.relogQueue.length > 0) return res.status(403).send(mainfile.lang.botnotready) //Check if bot is not fully started yet and block cmd usage to prevent errors

        var steamID = new SteamID(String(config.ownerid[0])) //steamID: Make the bot owner responsible for request
        var steam64id = steamID.getSteamID64()

        controller.lastcomment.findOne({ id: steam64id }, (err, lastcommentdoc) => {
            if (!lastcommentdoc) logger("error", "User is missing from database?? How is this possible?! Error maybe: " + err)

            try { //catch any unhandled error to be able to remove user from activecommentprocess array
                require("../bot/commands/comment/comment.js").run(null, steamID, [req.query.n, req.query.id], res, lastcommentdoc)
            } catch (err) {
                res.status(500).send(steamID, "Error while processing comment request: " + err.stack)
                logger("error", "Error while processing comment request: " + err.stack)
                return;
            }
        })
    });
    
    app.get('/output', (req, res) => { //Show output
        let ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).replace("::ffff:", "") //get IP of visitor

        logger("info", `[Web Request] ${ip} requested to see the output!`)

        fs.readFile(srcdir + "/../output.txt", (err, data) => {
            if(err) logger("error", "urltocomment: error reading output.txt: " + err)
        
            res.write(String(data))
            res.status(200)
            res.end()
        }) 
    })
    
    app.use((req, res) => { //Show idk page thanks
        res.status(404).send("404: Page not Found.</br>Please use /comment?n=123&id=123&key=123 to request n comments on id profile with your secret key.") 
    });
    
    module.exports.server = app.listen(3034, () => {
        logger("info", 'EnableURLToComment is on: Server is listening on port 3034.\n       Visit it on: localhost:3034\n', true) 
    });

    module.exports.server.on("error", (err) => {
        logger("error", 'An error occured trying to start the EnableURLToComment server. ' + err, true)
    })
}
