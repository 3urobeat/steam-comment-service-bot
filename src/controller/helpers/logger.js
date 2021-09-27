
/**
 * Logs text to the terminal and appends it to the output.txt file.
 * @param {String} type String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
 * @param {String} str The text to log into the terminal
 * @param {Boolean} nodate Setting to true will hide date and time in the message
 * @param {Boolean} remove Setting to true will remove this message with the next one
 */
module.exports.logger = (type, str, nodate, remove, animation) => { //Function that passes args to my logger library and just exists to handle readyafterlogs atm
    var outputlogger = require("output-logger") //look Mom, it's my own library!

    var controller   = require("../controller.js")


    //Configure my logging library (https://github.com/HerrEurobeat/output-logger#options-1)
    outputlogger.options({
        msgstructure: "[animation] [date | type] message",
        paramstructure: ["type", "str", "nodate", "remove", "animation"],
        outputfile: srcdir + "/../output.txt",
        animationdelay: 250
    })
    

    var string = outputlogger(type, str, nodate, remove, animation)


    //Push string to readyafterlogs if desired
    if (typeof botisloggedin != "undefined" && botisloggedin) { //botislogged in will be undefined when the bot was just started

        require("../../starter.js").checkAndGetFile("./src/controller/ready.js", false, (readyfile) => {

            if (!nodate) { //startup messages should have nodate enabled -> filter messages with date when bot is not started
                if (readyfile.readyafter == 0 && !str.toLowerCase().includes("error") && !str.includes('Logging in... Estimated wait time') && !str.includes("What's new:") && remove !== true) { 
                    controller.readyafterlogs.push(string); return; 
                }
            }
        })
    }

}


/**
 * Returns one of the default animations
 * @param {String} animation Valid animations: `loading`, `waiting`, `bounce`, `progress`, `arrows` or `bouncearrows`
 * @returns Array of the chosen animation
 */
module.exports.logger.animation = (args) => {
    var outputlogger = require("output-logger")

    return outputlogger.animation(args)
}


/**
 * Stops any animation currently active
 */
module.exports.logger.stopAnimation = () => {
    var outputlogger = require("output-logger")

    return outputlogger.stopAnimation
}