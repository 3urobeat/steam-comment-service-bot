/*
 * File: settings.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 * 
 * Last Modified: 05.10.2021 16:55:56
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */



/**
 * Runs the leaveallgroups command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-use
 * @param {Object} lang The language object
 * @param {Number} loginindex The loginindex of the calling account
 * @param {Array} args The args array
 */
module.exports.run = (chatmsg, steamID, lang, loginindex, args) => {
    var fs         = require("fs")

    var controller = require("../../controller/controller.js")


    //Only send current settings if no arguments were provided
    if (!args[0]) { 
        fs.readFile('./config.json', function(err, data) { //Use readFile to get an unprocessed object
            if (err) return chatmsg(steamID, lang.settingscmdfailedread + err)

            //Since Steam keeps blocking this message because of its length but somehow not anymore when its formatted as code: Fuck you Steam, then I'm going to prepare 3 variants.
            let currentsettingsarr = data.toString().slice(1, -1).split("\n").map(s => s.trim())

            
            //Send as one message with code prefix
            chatmsg(steamID, "/code " + lang.settingscmdcurrentsettings + "\n" + currentsettingsarr.join("\n")) //remove first and last character which are brackets and remove leading and trailing whitespaces from all lines


            //Send in two parts with code prefix
            /* chatmsg(steamID, "/code " + lang.settingscmdcurrentsettings + "" + currentsettingsarr.slice(0, currentsettingsarr.length / 2).join("\n")) //remove first and last character which are brackets and remove leading and trailing whitespaces from all lines

            setTimeout(() => {
                chatmsg(steamID, "/code " + currentsettingsarr.slice(currentsettingsarr.length / 2, currentsettingsarr.length).join("\n"))
            }, 2000); */


            //Send in three parts with code prefix
            /* chatmsg(steamID, "/code " + lang.settingscmdcurrentsettings + "" + currentsettingsarr.slice(0, currentsettingsarr.length / 3).join("\n")) //remove first and last character which are brackets and remove leading and trailing whitespaces from all lines
            
            setTimeout(() => {
                chatmsg(steamID, "/code " + currentsettingsarr.slice(currentsettingsarr.length / 3, currentsettingsarr.length - currentsettingsarr.length / 3).join("\n"))

                setTimeout(() => {
                    chatmsg(steamID, "/code " + currentsettingsarr.slice(currentsettingsarr.length - currentsettingsarr.length / 3, currentsettingsarr.length).join("\n"))
                }, 2000);
            }, 2000); */
        })
        return; 
    }


    //Seems like at least one argument was provided so the user probably wants to change a setting
    if (!args[1]) return chatmsg(steamID, "Please provide a new value for the key you want to change!")

    //Block those 3 values to don't allow another owner to take over ownership
    if (args[0] == "enableevalcmd" || args[0] == "ownerid" || args[0] == "owner") {
        return chatmsg(steamID, lang.settingscmdblockedvalues) 
    }

    var keyvalue = config[args[0]] //save old value to be able to reset changes

    //I'm not proud of this code but whatever -> used to convert array into usable array
    if (Array.isArray(keyvalue)) {
        let newarr = []

        args.forEach((e, i) => {
            if (i == 0) return; //skip args[0]
            if (i == 1) e = e.slice(1) //remove first char which is a [
            if (i == args.length - 1) e = e.slice(0, -1) //remove last char which is a ]

            e = e.replace(/,/g, "") //Remove ,
            if (e.startsWith('"')) newarr[i - 1] = String(e.replace(/"/g, ""))
                else newarr[i - 1] = Number(e) 
        })

        args[1] = newarr
    }

    //Convert to number or boolean as input is always a String
    if (typeof(keyvalue) == "number") args[1] = Number(args[1])
    if (typeof(keyvalue) == "boolean") { //prepare for stupid code because doing Boolean(value) will always return true
        if (args[1] == "true") args[1] = true
        if (args[1] == "false") args[1] = false //could have been worse tbh
    }

    //round maxComments value in order to avoid the possibility of weird amounts
    if (args[0] == "maxComments" || args[0] == "maxOwnerComments") args[1] = Math.round(args[1])

    if (keyvalue == undefined) return chatmsg(steamID, lang.settingscmdkeynotfound)
    if (keyvalue == args[1]) return chatmsg(steamID, lang.settingscmdsamevalue.replace("value", args[1]))

    config[args[0]] = args[1] //apply changes

    //32-bit integer limit check from controller.js's startup checks
    if (typeof(keyvalue) == "number" && config.commentdelay * config.maxComments > 2147483647 || typeof(keyvalue) == "number" && config.commentdelay * config.maxOwnerComments > 2147483647) { //check this here after the key has been set and reset the changes if it should be true
        config[args[0]] = keyvalue
        return chatmsg(steamID, lang.settingscmdvaluetoobig) //Just using the check from controller.js
    }

    chatmsg(steamID, lang.settingscmdvaluechanged.replace("targetkey", args[0]).replace("oldvalue", keyvalue).replace("newvalue", args[1]))
    logger("info", `${args[0]} has been changed from ${keyvalue} to ${args[1]}.`)

    if (args[0] == "playinggames") {
        logger("info", "Refreshing game status of all bot accounts...")
        Object.keys(controller.botobject).forEach((e, i) => {
            if (loginindex == 0) controller.botobject[i].gamesPlayed(config.playinggames); //set game only for the main bot
            if (loginindex != 0 && config.childaccsplaygames) controller.botobject[i].gamesPlayed(config.playinggames.slice(1, config.playinggames.length)) //play game with child bots but remove the custom game
        }) 
    }

    //Get arrays on one line
    var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
        if(v instanceof Array)
        return JSON.stringify(v);
        return v; 
    }, 4)
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')
        .replace(/\\"/g, '"')
        .replace(/""/g, '""');

    fs.writeFile("./config.json", stringifiedconfig, err => {
        if (err) return logger("error", `write settings cmd changes to config error: ${err}`)
    })
}