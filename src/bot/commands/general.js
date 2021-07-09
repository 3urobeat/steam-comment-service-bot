
/**
 * Runs the help command
 * @param {Function} ownercheck The ownercheck function
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.help = (ownercheck, chatmsg, steamID, lang) => {
    var controller = require("../../controller/controller.js")


    if (ownercheck) {
        if (Object.keys(controller.communityobject).length > 1 || config.maxOwnerComments) var commenttext = `'!comment (amount/"all") [profileid] [custom, quotes]' - ${lang.helpcommentowner1.replace("maxOwnerComments", config.maxOwnerComments)}`
            else var commenttext = `'!comment ("1") [profileid] [custom, quotes]' - ${lang.helpcommentowner2}`
    } else {
        if (Object.keys(controller.communityobject).length > 1 || config.maxComments) var commenttext = `'!comment (amount/"all")' - ${lang.helpcommentuser1.replace("maxComments", config.maxComments)}`
            else var commenttext = `'!comment' - ${lang.helpcommentuser2}` 
    }
    
    if (config.yourgroup.length > 1) var yourgrouptext = lang.helpjoingroup;
        else var yourgrouptext = "";
    
    chatmsg(steamID, `${extdata.mestr}'s Comment Bot | ${lang.helpcommandlist}\n
        ${commenttext}\n
        '!ping' - ${lang.helpping}
        '!info' - ${lang.helpinfo}
        '!abort' - ${lang.helpabort}
        '!about' - ${lang.helpabout}
        '!owner' - ${lang.helpowner}
        ${yourgrouptext}
    
        ${lang.helpreadothercmdshere} ' https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Commands-documentation '`)
}


/**
 * Runs the info command
 * @param {String} steam64id The steamID64 as String
 * @param {Function} lastsuccessfulcomment The lastsuccessfulcomment function
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 */
module.exports.info = (steam64id, lastsuccessfulcomment, chatmsg, steamID) => {
    var controller = require("../../controller/controller.js")
    var botfile    = require("../bot.js")


    botfile.lastcomment.findOne({ id: steam64id }, (err, doc) => {
        lastsuccessfulcomment(cb => {
            /* eslint-disable no-irregular-whitespace */
            chatmsg(steamID, `
                -----------------------------------~~~~~------------------------------------ 
                >   ${extdata.mestr}'s Comment Bot [Version ${extdata.versionstr}] (More info: !about)
                >   Uptime: ${Number(Math.round(((new Date() - controller.bootstart) / 3600000)+'e'+2)+'e-'+2)} hours | Branch: ${extdata.branch}
                >   'node.js' Version: ${process.version} | RAM Usage (RSS): ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB
                >   Accounts: ${Object.keys(controller.communityobject).length} | maxComments/owner: ${config.maxComments}/${config.maxOwnerComments} | delay: ${config.commentdelay}
                |
                >   Your steam64ID: ${steam64id}
                >   Your last comment request: ${(new Date(doc.time)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)
                >   Last processed comment request: ${(new Date(cb)).toISOString().replace(/T/, ' ').replace(/\..+/, '')} (GMT time)
                >   I have commented ${botfile.commentcounter} times since my last restart and completed request!
                -----------------------------------~~~~~------------------------------------
            `) 
            /* eslint-enable no-irregular-whitespace */
        })
    })
}


/**
 * Runs the ping command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.ping = (chatmsg, steamID, lang) => {
    var https      = require("https")


    var pingstart = Date.now()

    https.get(`https://steamcommunity.com/ping`, function(res) { //ping steamcommunity.com/ping and measure time
        res.setEncoding('utf8');
        res.on('data', () => {}) //seems like this is needed to be able to catch 'end' but since we don't need to collect anything this stays empty

        res.on('end', () => {
            chatmsg(steamID, lang.pingcmdmessage.replace("pingtime", Date.now() - pingstart))
        })
    })
}


/**
 * Runs the about command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 */
module.exports.about = (chatmsg, steamID) => {
    chatmsg(steamID, extdata.aboutstr)
}


/**
 * Runs the owner command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.owner = (chatmsg, steamID, lang) => {
    if (config.owner.length < 1) return chatmsg(steamID, lang.ownercmdnolink)

    chatmsg(steamID, lang.ownercmdmsg + "\n" + config.owner)
}