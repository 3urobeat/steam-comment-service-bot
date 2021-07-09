
/**
 * Runs the block command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.block = (chatmsg, steamID, lang, args) => {
    var SteamID    = require("steamid")
    var controller = require("../../controller/controller.js")

    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    Object.keys(controller.botobject).forEach((i) => {
        controller.botobject[i].blockUser(new SteamID(args[0]), err => { if (err) logger("error", `[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) 
    })

    chatmsg(steamID, lang.blockcmdsuccess.replace("profileid", args[0]))
    logger("info", `Blocked ${args[0]} with all bot accounts.`)
}


/**
 * Runs the unblock command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 */
module.exports.unblock = (chatmsg, steamID, lang, args) => {
    var SteamID    = require("steamid")
    var controller = require("../../controller/controller.js")

    if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid)
    if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid)

    Object.keys(controller.botobject).forEach((i) => {
        if (controller.botobject[i].myFriends[new SteamID(args[0])] === 1) {
            controller.botobject[i].unblockUser(new SteamID(args[0]), err => { if (err) logger("error", `[Bot ${i}] error blocking user ${args[0]}: ${err}`) }) 
        }
    })

    chatmsg(steamID, lang.unblockcmdsuccess.replace("profileid", args[0]))
    logger("info", `Unblocked ${args[0]} with all bot accounts.`)
}