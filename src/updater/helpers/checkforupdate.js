
/**
 * Checks for an available update from the GitHub repo
 * @param {String} releasemode 'master' or 'beta-testing' depending on which branch you want to check
 * @param {Boolean} forceupdate Force an update
 * @param {function} [callback] Called with `updatefound` (Boolean) and `output` (Object) the data.json found online parameters on completion. `updatefound` will be false if the check should fail.
 */
module.exports.checkforupdate = (releasemode, forceupdate, callback) => {
    var https = require("https")

    /* ------------------ Check for new version ------------------ */
    if (forceupdate) logger("info", `Forcing update from ${releasemode} branch...`, false, true)
        else logger("info", `Checking for update in ${releasemode} branch...`, false, true)
    
    var output = ""

    try {
        var httpsrequest = https.get(`https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/${releasemode}/src/data/data.json`, function(res) {
            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                output += chunk
            })

            res.on("end", () => {
                output = JSON.parse(output)
                var onlineversion = output.version
                var onlineversionstr = output.versionstr

                if (onlineversion > extdata.version || forceupdate == true || !onlineversionstr.includes("BETA") && extdata.versionstr.includes("BETA") || onlineversionstr.includes("BETA") && !extdata.versionstr.includes("BETA")) { //version number greater, forceupdate is true, release or beta version available?
                    callback(true, output)
                } else {
                    callback(false, output)
                }
            })
        })

        httpsrequest.on("error", function(err) {
            logger("warn", "\x1b[0m[\x1b[31mNotice\x1b[0m]: Couldn't check for an available update because either GitHub is down or your internet isn't working.\n          Error: " + err, true)
            callback(false, {})
        })

    } catch (err) {
        logger("error", 'checkforupdate function Error: ' + err, true)
        callback(false, {})
    }
}