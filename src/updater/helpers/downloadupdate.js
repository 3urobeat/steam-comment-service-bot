/*
 * File: downloadupdate.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 11.03.2022 13:49:44
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Downloads all files from the repository and installs them
 * @param {String} releasemode 'master' or 'beta-testing' depending on which branch you want to check
 * @param {function} [callback] Called with `err` (String or null) parameter on completion
 */
 module.exports.downloadupdate = (releasemode, compatibilityfeaturedone, callback) => {
    var fs       = require("fs")
    var download = require("download")

    logger("", "Starting to download update...", true, false, logger.animation("loading"))

    const url = `https://github.com/HerrEurobeat/steam-comment-service-bot/archive/${releasemode}.zip`
    const dontdelete = ["./src/data/cache.json", "./src/data/lastcomment.db", "./accounts.txt", "./customlang.json", "./logininfo.json", "./output.txt", "./proxies.txt", "./quotes.txt"]

    //Process dontdelete array in order to include parent folders of a dontdelete file in the array aswell
    dontdelete.forEach((e) => {
        var str = e.split("/")
        str.splice(0, 1) //remove '.'
    
        str.forEach((k, j) => {
            if (j == 0) return; //the path './' won't deleted either way so we can ignore it
            
            var pathtopush = "./" + str.slice(0, j).join("/")
            if (!dontdelete.includes(pathtopush)) dontdelete.push(pathtopush) //construct path from first part of the path until this iteration
        })
    })

    //Save config settings and extdata values by cloning them into a new object
    const oldconfig         = Object.assign(config)
    const oldadvancedconfig = Object.assign(advancedconfig)
    const oldextdata        = Object.assign(extdata)

    //Start downloading new files
    logger("", "", true)
    logger("", `${logger.colors.fgyellow}Downloading new files...${logger.colors.reset}`, true, false, logger.animation("loading"))

    download(url, "./", { extract: true }).then(() => { //the download library makes downloading and extracting easier
        try {
            //Scan directory recursively to get an array of all paths in this directory
            var scandir = function(dir) { //Credit for this function before I modified it: https://stackoverflow.com/a/16684530/12934162
                var results = [];
                var list = fs.readdirSync(dir);

                list.forEach(function(file) {
                    file = dir + '/' + file;

                    var stat = fs.statSync(file);

                    results.push(file); //push the file and folder in order to avoid an ENOTEMPTY error and push it before the recursive part in order to have the folder above its files in the array to avoid ENOENT error

                    if (stat && stat.isDirectory()) results = results.concat(scandir(file)); //call this function recursively again if it is a directory
                });
                return results;
            }

            let files = scandir(".") //scan the directory of this installation
            
            //Delete old files except files and folders in dontdelete
            logger("", `${logger.colors.fgyellow}Deleting old files...${logger.colors.reset}`, true, false, logger.animation("loading"))
            files.forEach((e, i) => {
                if (fs.existsSync(e) && !dontdelete.includes(e) && !e.includes(`./steam-comment-service-bot-${releasemode}`) && !e.includes("./node_modules") && !e.includes("./backup") && !e.includes("./plugins")) { //respect dontdelete, the fresh downloaded files and the node_modules folder
                    fs.rmSync(e, { recursive: true })
                }
        
                //Continue if finished
                if (files.length == i + 1) {
                    //Move new files out of directory
                    let newfiles = scandir(`./steam-comment-service-bot-${releasemode}`) //scan the directory of the new installation
        
                    logger("", `${logger.colors.fgyellow}Moving new files...${logger.colors.reset}`, true, false, logger.animation("loading"))
                    newfiles.forEach((e, i) => {
                        let eCut = e.replace(`steam-comment-service-bot-${releasemode}/`, "") //eCut should resemble the same path but how it would look like in the base directory

                        if (fs.statSync(e).isDirectory() && !fs.existsSync(eCut)) fs.mkdirSync(eCut) //create directory if it doesn't exist         
                        if (!fs.existsSync(eCut) || !fs.statSync(eCut).isDirectory() && !dontdelete.includes(eCut)) fs.renameSync(e, eCut) //only rename if not directory and not in dontdelete. We need to check first if it exists to avoid a file not found error with isDirectory()
        
                        //Continue if finished
                        if (newfiles.length == i + 1) {
                            fs.rmSync(`./steam-comment-service-bot-${releasemode}`, { recursive: true }) //remove the remains of the download folder

                            //Custom update rules for a few files
                            require("./customUpdateRules.js").customUpdateRules(compatibilityfeaturedone, oldconfig, oldadvancedconfig, oldextdata, callback);

                            //Make callback to let caller carry ono
                            callback(null);
                        }
                    })
                }
            })
        } catch (err) {
            if (err) callback(err);
        }
    }).catch((err) => {
        if (err) callback(err);
    })
}