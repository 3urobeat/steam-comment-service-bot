
/**
 * Runs the addfriend command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.addFriend = (chatmsg, steamID, lang, args) => {
    var SteamID    = require('steamid');
    var controller = require("../../controller/controller.js")

    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    //Check if first bot account is limited to be able to display error message instantly
    if (controller.botobject[0].limitations && controller.botobject[0].limitations.limited == true) {
        chatmsg(steamID, lang.addfriendcmdacclimited.replace("profileid", args[0])) 
        return; 
    }

    chatmsg(steamID, lang.addfriendcmdsuccess.replace("profileid", args[0]).replace("estimatedtime", 5 * Object.keys(controller.botobject).length))
    logger("info", `Adding friend ${args[0]} with all bot accounts... This will take ~${5 * Object.keys(controller.botobject).length} seconds.`)

    Object.keys(controller.botobject).forEach((i) => {
        //Check if this bot account is limited
        if (controller.botobject[i].limitations && controller.botobject[i].limitations.limited == true) {
            logger("error", `Can't add friend ${args[0]} with bot${i} because the bot account is limited.`) 
            return;
        }

        if (controller.botobject[i].myFriends[new SteamID(args[0])] != 3 && controller.botobject[i].myFriends[new SteamID(args[0])] != 1) { //check if provided user is not friend and not blocked
            setTimeout(() => {
                controller.communityobject[i].addFriend(new SteamID(args[0]).getSteam3RenderedID(), (err) => {
                    if (err) logger("error", `error adding ${args[0]} with bot${i}: ${err}`) 
                        else logger("info", `Added ${args[0]} with bot${i} as friend.`)
                })

                controller.friendlistcapacitycheck(i); //check remaining friendlist space
            }, 5000 * i);
        } else {
            logger("warn", `bot${i} is already friend with ${args[0]} or the account was blocked/blocked you.`) //somehow logs steamIDs in seperate row?!
        } 
    })
}


/**
 * Runs the unfriend command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unfriend = (chatmsg, steamID, lang, args) => {
    var SteamID    = require('steamid');
    var controller = require("../../controller/controller.js")
    
    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    Object.keys(controller.botobject).forEach((i) => {
        setTimeout(() => {
            controller.botobject[i].removeFriend(new SteamID(args[0])) 
        }, 1000 * i); //delay every iteration so that we don't make a ton of requests at once
    })

    chatmsg(steamID, lang.unfriendcmdsuccess.replace("profileid", args[0]))
    logger("info", `Removed friend ${args[0]} from all bot accounts.`)
}


/**
 * Runs the unfriendall command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unfriendAll = (chatmsg, steamID, lang, args) => {
    var SteamID    = require('steamid');
    var controller = require("../../controller/controller.js")
    
    var abortunfriendall; //make eslint happy

    if (args[0] == "abort") { 
        chatmsg(steamID, lang.unfriendallcmdabort); 
        return abortunfriendall = true; 
    }
    
    abortunfriendall = false
    chatmsg(steamID, lang.unfriendallcmdpending)
    
    setTimeout(() => {
        if (abortunfriendall) return logger("info", "unfriendall process was aborted.");
        chatmsg(steamID, lang.unfriendallcmdstart)
        logger("info", "Starting to unfriend everyone...")
    
        for (let i in controller.botobject) {
            for (let friend in controller.botobject[i].myFriends) {
                try {
                    setTimeout(() => {
                        if (!config.ownerid.includes(friend)) controller.botobject[i].removeFriend(new SteamID(friend))
                    }, 1000 * i); //delay every iteration so that we don't make a ton of requests at once
                } catch (err) {
                    logger("error", `[Bot ${i}] unfriendall error unfriending ${friend}: ${err}`)
                }
            }
        }
    }, 30000);
}

