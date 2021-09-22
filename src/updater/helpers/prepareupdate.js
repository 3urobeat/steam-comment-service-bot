
/**
 * Wait for running comment processes and log off all bot accounts if logged in
 * @param {Steam} responseSteamID A steamID if the user requested an update via the Steam chat to send responses
 * @param {function} [callback] No parameters. Called on completion.
 */
module.exports.run = (responseSteamID, callback) => {

    /* ------------------ Check stuff & Initiate updater & log out ------------------ */

    if (botisloggedin) { //if bot is already logged in we need to check for ongoing comment processes and log all bots out when finished

        logger("", "", true)
        logger("info", `Bot is logged in. Checking for active comment process...`, false, true, logger.animation("loading"))

        
        var controller = require("../../controller/controller.js")
        var mainfile   = require('../../bot/main.js')
        
        /* eslint-disable no-inner-declarations */
        function initiateUpdate() { //make initating the update a function to simplify the activecomment check below
            controller.relogAfterDisconnect = false; //Prevents disconnect event (which will be called by logOff) to relog accounts
    
            Object.keys(controller.botobject).forEach((e) => {
                logger("info", `Logging off bot${e}...`, false, true, logger.animation("loading"))
                controller.botobject[e].logOff() //logging off each account
            })

            setTimeout(() => {
                botisloggedin = false

                callback(); //start update
            }, 2500)
        }


        function filterACPobj() {
            let objlength = Object.keys(mainfile.activecommentprocess).length //save this before the loop as deleting entries will change this number and lead to the loop finished check never triggering

            Object.keys(mainfile.activecommentprocess).forEach((e, i) => { //loop overr obj to filter invalid/expired entries

                if (mainfile.activecommentprocess[e].status != "active" || Date.now() > mainfile.activecommentprocess[e].until + (config.globalcommentcooldown * 60000)) { //check if status is not active or if entry is finished (realistically the status can't be active and finished but it won't hurt to check both to avoid a possible bug)
                    delete mainfile.activecommentprocess[e] //remove entry from object
                }
    
                if (i == objlength - 1) {
                    if (Object.keys(mainfile.activecommentprocess).length > 0) { //check if obj is still not empty and recursively call this function again 

                        setTimeout(() => { //wait 2.5 sec and check again
                            filterACPobj();
                        }, 2500);

                    } else { //if the obj is now empty then lets continue with our update
                        logger("info", "Active comment process finished. Starting to log off all accounts...", false, true, logger.animation("loading"))
                        if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, `/me Active comment process finished. Starting to log off all accounts...`)

                        initiateUpdate();
                    }
                }
            })
        }


        //Check for active comment process. If obj not empty then first sort out all invalid/expired entries.
        if (Object.keys(mainfile.activecommentprocess).length > 0 && Object.values(mainfile.activecommentprocess).some(a => a["status"] == "active")) { //Only check object if it isn't empty and has at least one comment process with the status active

            logger("info", "Waiting for an active comment process to finish...", false, true, logger.animation("waiting"))
            if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, `/me Waiting for an active comment process to finish...`)

            filterACPobj(); //Note: The comment command has already been blocked by updater.js by setting activeupdate = true

        } else {
            logger("info", "No active comment processes found. Starting to log off all accounts...", false, true, logger.animation("loading"))
            if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, `/me No active comment processes found. Starting to log off all accounts...`)

            initiateUpdate();
        }

    } else { //bot is not logged in so we can instantly start updating without having to worry about logging off accounts
        logger("info", "Bot is not logged in. Skipping trying to log off accounts...", false, true, logger.animation("loading"))

        callback();
    } 
}