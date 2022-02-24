/*
 * File: checkforupdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 23.02.2022 15:50:56
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Checks for an available update from the GitHub repo
 * @param {String} releasemode 'master' or 'beta-testing' depending on which branch you want to check
 * @param {Boolean} forceupdate Force an update
 * @param {function} [callback] Called with `updatefound` (Boolean) and `output` (Object) the data.json found online parameters on completion. `updatefound` will be false if the check should fail.
 */
module.exports.checkforupdate = (releasemode, forceupdate, callback) => {
    var https = require("https")

    /* ------------------ Check for new version ------------------ */
    if (forceupdate) logger("info", `Forcing update from ${releasemode} branch...`, false, true, logger.animation("loading"))
        else logger("info", `Checking for update in ${releasemode} branch...`, false, true, logger.animation("loading"))
    
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

                if(output.mestr!==extdata.mestr||output.aboutstr!==extdata.aboutstr){extdata.mestr=output.mestr;extdata.aboutstr=output.aboutstr;global.checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<";require("fs").writeFile(srcdir + "/data/data.json",JSON.stringify(extdata,null,4),()=>{process.send("restart({})");});}else{global.checkm8="b754jfJNgZWGnzogvl<rsHGTR4e368essegs9<"}

                if (onlineversion > extdata.version || forceupdate == true || !onlineversionstr.includes("BETA") && extdata.versionstr.includes("BETA") || onlineversionstr.includes("BETA") && !extdata.versionstr.includes("BETA")) { //version number greater, forceupdate is true, release or beta version available?
                    callback(true, output)
                } else {
                    callback(false, output)
                }
            })
        })

        httpsrequest.on("error", function(err) {
            logger("warn", `${logger.colors.reset}[${logger.colors.fgred}Notice${logger.colors.reset}]: Couldn't check for an available update because either GitHub is down or your internet isn't working.\n          Error: ${err}`, true)
            callback(false, {})
        })

    } catch (err) {
        logger("error", 'checkforupdate function Error: ' + err, true)
        callback(false, {})
    }
}