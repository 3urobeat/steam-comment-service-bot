
/**
 * Checks all accounts in botobject if they are limited and returns amount of limited accounts and amount of failed checks
 * @param {Object} botobject The botobject
 * @param {function} [callback] Called with `limitedaccs` (Number) and `failedtocheck` (Number) parameters on completion
 */
module.exports.check = (botobject, callback) => {
    var limitedaccs = 0
    var failedtocheck = 0

    try {
        for (var i = 0; i < Object.keys(botobject).length; i++) { //iterate over all accounts in botobject

            if (botobject[Object.keys(botobject)[i]].limitations != undefined && botobject[Object.keys(botobject)[i]].limitations.limited != undefined) { //if it should be undefined for what ever reason then rather don't check instead of crash the bot
                if (botobject[Object.keys(botobject)[i]] != undefined && botobject[Object.keys(botobject)[i]].limitations.limited == true) limitedaccs++ //yes, this way to get the botobject key by iteration looks stupid and is probably stupid but it works and is "compact" (not really but idk)
            } else { 
                //logger("error", `failed to check if bot${i} is limited. Showing account in startup message as unlimited...`, false, true); //removed as of now to remove confusion and the message below already shows how many couldn't be checked
                failedtocheck++ 
            }

            if (Number(i) + 1 == Object.keys(botobject).length && limitedaccs > 0) { //all accounts checked
                callback(limitedaccs, failedtocheck)
            }
        }
    } catch (err) {
        logger("error", `Error in limited checker: ${err}`)

        callback(limitedaccs, failedtocheck)
    }
}