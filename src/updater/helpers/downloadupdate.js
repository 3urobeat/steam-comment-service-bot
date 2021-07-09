
/**
 * Downloads all files from the repository and installs them
 * @param {String} releasemode 'master' or 'beta-testing' depending on which branch you want to check
 * @param {function} [callback] Called with `err` (String or null) parameter on completion
 */
module.exports.downloadupdate = (releasemode, compatibilityfeaturedone, callback) => {
    var fs       = require("fs")
    var download = require("download")

    const url = `https://github.com/HerrEurobeat/steam-comment-service-bot/archive/${releasemode}.zip`
    const dontdelete = ["./.git", "./src/cache.json", "./src/lastcomment.db", "./accounts.txt", "./customlang.json", "./logininfo.json", "./output.txt", "./proxies.txt", "./quotes.txt"]

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
    const oldconfig = Object.assign(config)
    const oldextdata = Object.assign(extdata)

    //Start downloading new files
    logger("", "", true)
    logger("", "\x1b[33mDownloading new files...\x1b[0m", true)

    download(url, "./", { extract: true }).then(() => { //the download library makes downloading and extracting easier
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
        logger("", "\x1b[33mDeleting old files...\x1b[0m", true)
        files.forEach((e, i) => {
            if (fs.existsSync(e) && !dontdelete.includes(e) && !e.includes(`./steam-comment-service-bot-${releasemode}`) && !e.includes("./node_modules")) { //respect dontdelete, the fresh downloaded files and the node_modules folder
                fs.rmSync(e, { recursive: true })
            }
    
            //Continue if finished
            if (files.length == i + 1) {
                //Move new files out of directory
                let newfiles = scandir(`./steam-comment-service-bot-${releasemode}`) //scan the directory of the new installation
    
                logger("", "\x1b[33mMoving new files...\x1b[0m", true)
                newfiles.forEach((e, i) => {
                    let eCut = e.replace(`steam-comment-service-bot-${releasemode}/`, "") //eCut should resemble the same path but how it would look like in the base directory

                    if (fs.statSync(e).isDirectory() && !fs.existsSync(eCut)) fs.mkdirSync(eCut) //create directory if it doesn't exist         
                    if (!fs.existsSync(eCut) || !fs.statSync(eCut).isDirectory() && !dontdelete.includes(eCut)) fs.renameSync(e, eCut) //only rename if not directory and not in dontdelete. We need to check first if it exists to avoid a file not found error with isDirectory()
    
                    //Continue if finished
                    if (newfiles.length == i + 1) {
                        fs.rmSync(`./steam-comment-service-bot-${releasemode}`, { recursive: true }) //remove the remains of the download folder

                        //Custom update rules for a few files
                        //config.json
                        logger("", `\x1b[33mClearing cache of config.json...\x1b[0m`, true)

                        delete require.cache[require.resolve(srcdir + "/../config.json")] //delete cache
                        let newconfig = require(srcdir + "/../config.json")

                        logger("", `\x1b[33mTransfering your changes to new config.json...\x1b[0m`, true)
                        
                        Object.keys(newconfig).forEach(e => {
                            if (!Object.keys(oldconfig).includes(e)) return; //config value seems to be new so don't bother trying to set it to something (which would probably be undefined anyway)

                            newconfig[e] = oldconfig[e] //transfer setting
                        })

                        logger("", `\x1b[33mWriting new data to config.json...\x1b[0m`, true)
                        fs.writeFile(srcdir + "/../config.json", JSON.stringify(newconfig, null, 4), err => { //write the changed file
                            if (err) {
                                logger("error", `Error writing changes to config.json: ${err}`, true)
                            }
                        })

                        //data.json
                        logger("", `\x1b[33mClearing cache of data.json...\x1b[0m`, true)

                        delete require.cache[require.resolve(srcdir + "/data/data.json")] //delete cache
                        let newextdata = require(srcdir + "/data/data.json")

                        logger("", "\x1b[33mTransfering changes to new data.json...\x1b[0m", true)

                        if (Object.keys(extdata).length > 2) { //Only do this if the data.json update call originates from the updater and not from the integrity check
                            if (compatibilityfeaturedone) newextdata.compatibilityfeaturedone = true

                            newextdata.urlrequestsecretkey = oldextdata.urlrequestsecretkey
                            newextdata.timesloggedin = oldextdata.timesloggedin
                            newextdata.totallogintime = oldextdata.totallogintime
                        }

                        logger("", `\x1b[33mWriting new data to data.json...\x1b[0m`, true)
                        fs.writeFile(srcdir + "/data/data.json", JSON.stringify(newextdata, null, 4), err => { //write the changed file
                            if (err) {
                                logger("error", `Error writing changes to data.json: ${err}`, true)
                                logger("error", "\n\nThe updater failed to update data.json. Please restart the bot and try again. \nIf this error still happens please contact the developer by opening an issue: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose \nor by writing me a message on Discord or Steam. Contact details are on my GitHub Profile: https://github.com/HerrEurobeat", true); 
                                
                                callback(err);
                            }
                        })

                        //Make callback to let caller carry ono
                        callback(null);
                    }
                })
            } 
        }) 
    }).catch((err) => {
        if (err) {
            logger("error", "Error while trying to download and update: " + err.stack, true)

            callback(err);
        }
    })
}