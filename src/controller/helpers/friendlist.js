
/**
 * Check if all friends are in lastcomment database
 * @param {SteamUser} botacc The bot instance of the calling account
 */
module.exports.checklastcommentdb = (bot) => {
    var botfile    = require("../../bot/bot.js")
    
    botfile.lastcomment.find({}, (err, docs) => {
        Object.keys(bot.myFriends).forEach(e => {

            if (bot.myFriends[e] == 3 && !docs.find(el => el.id == e)) {
                var lastcommentobj = {
                    id: e,
                    time: Date.now() - (config.commentcooldown * 60000) //subtract commentcooldown so that the user is able to use the command instantly
                }

                botfile.lastcomment.insert(lastcommentobj, (err) => { 
                    if (err) logger("error", "Error inserting existing user into lastcomment.db database! Error: " + err) 
                })
            }
        })
    })
}


/**
 * Checks the remaining space on the friendlist of a bot account and sends a warning message if it is less than 10.
 * @param {Number} loginindex The index of the bot account to be checked
 * @param {function} [callback] Called with `remaining` (Number) on completion
 */
module.exports.friendlistcapacitycheck = (loginindex, callback) => {
    var controller = require("../controller.js")

    try {
        controller.botobject[0].getSteamLevels([controller.botobject[loginindex].steamID], (err, users) => { //check steam level of botindex account with bot0
            if (!users) return; //users was undefined one time (I hope this will (hopefully) supress an error?)

            let friendlistlimit = Object.values(users)[0] * 5 + 250 //Profile Level * 5 + 250
            let friends = Object.values(controller.botobject[loginindex].myFriends)
            let friendsamount = friends.length - friends.filter(val => val == 0).length - friends.filter(val => val == 5).length //Subtract friend enums 0 & 5

            let remaining = friendlistlimit - friendsamount
            
            if (remaining < 0) callback(null); //stop if number is negative somehow - maybe when bot profile is private?
                else callback(remaining)
        })
    } catch (err) {
        logger("error", `Failed to check friendlist space for bot${loginindex}. Error: ${err}`) 
        callback(null);
    }
}


/* 
//Unfriend check loop
let lastcommentUnfriendCheck = Date.now() //this is useful because intervals can get unprecise over time

setInterval(() => {
    if (lastcommentUnfriendCheck + 60000 > Date.now()) return; //last check is more recent than 60 seconds
    lastcommentUnfriendCheck = Date.now()

    lastcomment.find({ time: { $lte: Date.now() - (config.unfriendtime * 86400000) } }, (err, docs) => { //until is a date in ms, so we check if it is less than right now
        if (docs.length < 1) return; //nothing found

        docs.forEach((e, i) => { //take action for all results
            setTimeout(() => {
                Object.keys(botobject).forEach((f, j) => {
                    if (botobject[f].myFriends[e.id] == 3 && !config.ownerid.includes(e.id)) { //check if the targeted user is still friend
                        if (j == 0) botobject[0].chat.sendFriendMessage(new SteamID(e.id), `You have been unfriended for being inactive for ${config.unfriendtime} days.\nIf you need me again, feel free to add me again!`)

                        setTimeout(() => {
                            botobject[f].removeFriend(new SteamID(e.id)) //unfriend user with each bot
                            logger("info", `[Bot ${j}] Unfriended ${e.id} after ${config.unfriendtime} days of inactivity.`)
                        }, 1000 * j); //delay every iteration so that we don't make a ton of requests at once (IP)
                    }
                    
                    if (!config.ownerid.includes(e.id)) lastcomment.remove({ id: e.id }) //entry gets removed no matter what but we are nice and let the owner stay. Thank me later! <3
                })
            }, 1000 * i); //delay every iteration so that we don't make a ton of requests at once (account)
            
        })                
    })
}, 60000); //60 seconds */