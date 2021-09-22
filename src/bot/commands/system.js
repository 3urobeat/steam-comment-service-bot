
/**
 * Runs the restart command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 */
module.exports.restart = (chatmsg, steamID, lang) => {
    var controller = require("../../controller/controller.js")


    chatmsg(steamID, lang.restartcmdrestarting)

    require('../../../start.js').restart({ skippedaccounts: controller.skippedaccounts })
}


/**
 * Runs the stop command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 */
module.exports.stop = (chatmsg, steamID, lang) => {
    
    chatmsg(steamID, lang.stopcmdstopping)

    require('../../../start.js').stop()
}


/**
 * Runs the update command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 */
module.exports.update = (chatmsg, steamID, lang, args) => {
    var controller = require("../../controller/controller.js")


    if (args[0] == "true") { 
        require("../../updater/updater.js").run(true, steamID, false, (foundanddone) => { //we can ignore callback as the updater already responds to the user if a steamID is provided
            if (foundanddone) require("../../../start.js").restart({ skippedaccounts: controller.skippedaccounts })
        })

        chatmsg(steamID, lang.updatecmdforce.replace("branchname", extdata.branch)) 
    } else { 
        require("../../updater/updater.js").run(false, steamID, false, (foundanddone) => { //we can ignore callback as the updater already responds to the user if a steamID is provided
            if (foundanddone) require("../../../start.js").restart({ skippedaccounts: controller.skippedaccounts })
        })

        chatmsg(steamID, lang.updatecmdcheck.replace("branchname", extdata.branch))
    }
}


/**
 * Runs the output command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use 
 */
module.exports.output = (chatmsg, steamID) => {
    var fs = require("fs")


    fs.readFile("./output.txt", function (err, data) {
        if (err) logger("error", "error getting last 20 lines from output for log cmd: " + err)

        chatmsg(steamID, "These are the last 20 lines:\n\n" + data.toString().split('\n').slice(data.toString().split('\n').length - 20).join('\n')) 
    })
}


/**
 * Runs the update command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Array} args The args array
 * @param {SteamUser} bot The bot instance
 * @param {SteamCommunity} community The community instance
 */
module.exports.eval = (chatmsg, steamID, lang, args, bot, community) => { //eslint-disable-line no-unused-vars

    const clean = text => { //eslint-disable-line no-case-declarations
        if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else return text; 
    }

    try {
        const code = args.join(" ");
        if (code.includes('logininfo')) return chatmsg(steamID, lang.evalcmdlogininfoblock) //not 100% save but should be at least some protection (only owners can use this cmd)

        //make using the command a little bit easier
        var starter    = require("../../starter.js") //eslint-disable-line no-unused-vars
        var controller = require("../../controller/controller.js") //eslint-disable-line no-unused-vars
        var botfile    = require("../../bot/bot.js") //eslint-disable-line no-unused-vars
        var mainfile   = require("../../bot/main.js") //eslint-disable-line no-unused-vars
        
        let evaled = eval(code);
        if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled);

        //Check for character limit and cut message (seems to be 5000)
        let chatResult = clean(evaled)

        if (chatResult.length >= 4950) chatmsg(steamID, `Code executed. Result:\n\n${chatResult.slice(0, 4950)}.......\n\n\nResult too long for chat.`)
            else chatmsg(steamID, `Code executed. Result:\n\n${clean(evaled)}`)
        
        logger("info", '\x1b[33mEval result:\x1b[0m \n' + clean(evaled) + "\n", true)
    } catch (err) {
        chatmsg(steamID, `Error:\n${clean(err)}`)
        logger("error", '\x1b[33mEval error:\x1b[0m \n' + clean(err) + "\n", true)                                                                                                                                                                                                                                                                                                                 //Hi I'm a comment that serves no purpose
        return; 
    }
}