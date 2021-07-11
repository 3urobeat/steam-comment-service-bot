
/**
 * Wait for running comment processes and log off all bot accounts if logged in
 * @param {Steam} responseSteamID A steamID if the user requested an update via the Steam chat to send responses
 * @param {function} [callback] No parameters. Called on completion.
 */
module.exports.run = (responseSteamID, callback) => {

    /* ------------------ Check stuff & Initiate updater & log out ------------------ */

    if (botisloggedin) { //if bot is already logged in we need to check for ongoing comment processes and log all bots out when finished

        logger("", "", true)
        logger("info", `Bot is logged in. Checking for active comment process...`, false, true)

        
        var controller = require("../../controller/controller.js")
        var bot        = require('../../bot/bot.js')
        
        /* eslint-disable no-inner-declarations */
        function initiateUpdate() { //make initating the update a function to simplify the activecomment check below
            controller.relogAfterDisconnect = false; //Prevents disconnect event (which will be called by logOff) to relog accounts
    
            Object.keys(controller.botobject).forEach((e) => {
                logger("info", `Logging off bot${e}...`, false, true)
                controller.botobject[e].logOff() //logging off each account
            })

            setTimeout(() => {
                botisloggedin = false

                callback(); //start update
            }, 2500)
        }


        if (bot.activecommentprocess.length != 0) {
            logger("info", "Waiting for an active comment process to finish...", false, true)
            if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, `/me Waiting for an active comment process to finish...`)

            //check if a comment request is being processed every 2.5 secs
            var activecommentinterval = setInterval(() => { 
                if (bot.activecommentprocess.length == 0) { //start logging off accounts when no comment request is being processed anymore
                    clearInterval(activecommentinterval);

                    logger("info", "Active comment process finished. Starting to log off all accounts...", false, true)
                    if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, `/me Active comment process finished. Starting to log off all accounts...`)
    
                    initiateUpdate();
                }
            }, 2500);
        } else {
            logger("info", "No active comment processes found. Starting to log off all accounts...", false, true)
            if (responseSteamID) controller.botobject[0].chat.sendFriendMessage(responseSteamID, `/me No active comment processes found. Starting to log off all accounts...`)

            initiateUpdate();
        }

    } else { //bot is not logged in so we can instantly start updating without having to worry about logging off accounts
        logger("info", "Bot is not logged in. Skipping trying to log off accounts...", false, true)

        callback();
    } 
}