
/**
 * Runs the abort command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Number} steam64id The steam64id of the requesting user
 */
module.exports.abort = (chatmsg, steamID, lang, steam64id) => {
    var botfile = require("../../bot.js")

    if (!botfile.activecommentprocess.includes(steam64id)) return chatmsg(steamID, lang.abortcmdnoprocess)

    var index = botfile.activecommentprocess.indexOf(steam64id) //get index of this steam64id
    botfile.activecommentprocess.splice(index, 1)

    logger("info", `Aborting ${steam64id}'s comment process...`)
    chatmsg(steamID, lang.abortcmdsuccess)
}


/**
 * Runs the resetcooldown command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Array} args The args array
 * @param {Number} steam64id The steam64id of the requesting user
 */
module.exports.resetCooldown = (chatmsg, steamID, lang, args, steam64id) => {
    var SteamID = require("steamid")
    var botfile = require("../../bot.js")

    if (config.commentcooldown == 0) return chatmsg(steamID, lang.resetcooldowncmdcooldowndisabled) //is the cooldown enabled?

    if (args[0]) {
        if (args[0] == "global") { //Check if user wants to reset the global cooldown
            botfile.commentedrecently = 0
            return chatmsg(steamID, lang.resetcooldowncmdglobalreset) 
        }

        if (isNaN(args[0])) return chatmsg(steamID, lang.invalidprofileid) 
        if (new SteamID(args[0]).isValid() === false) return chatmsg(steamID, lang.invalidprofileid) 

        var steam64id = args[0] //change steam64id to the provided id
    }

    botfile.lastcomment.update({ id: steam64id }, { $set: { time: Date.now() - (config.commentcooldown * 60000) } }, (err) => { 
        if (err) return chatmsg(steamID, "Error updating database entry: " + err)
            else chatmsg(steamID, lang.resetcooldowncmdsuccess.replace("profileid", steam64id.toString())) 
    })
}


/**
 * Runs the failed command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 * @param {Number} steam64id The steam64id of the requesting user
 */
module.exports.failed = (chatmsg, steamID, lang, steam64id) => {
    var botfile = require("../../bot.js")
    
    botfile.lastcomment.findOne({ id: steam64id }, (err, doc) => {
        if (!botfile.failedcomments[steam64id] || Object.keys(botfile.failedcomments[steam64id]).length < 1) return chatmsg(steamID, lang.failedcmdnothingfound);

        chatmsg(steamID, lang.failedcmdmsg.replace("steam64id", steam64id).replace("requesttime", new Date(doc.time).toISOString().replace(/T/, ' ').replace(/\..+/, '')) + "\n\n" + JSON.stringify(botfile.failedcomments[steam64id], null, 4))
    })
}