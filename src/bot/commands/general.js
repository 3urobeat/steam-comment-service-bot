/*
 * File: general.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 29.09.2021 17:52:37
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */



/**
 * Runs the help command
 * @param {Function} ownercheck The ownercheck function
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.help = (ownercheck, chatmsg, steamID, lang) => {
    var controller = require("../../controller/controller.js");


    if (ownercheck) {
        if (Object.keys(controller.communityobject).length > 1 || config.maxOwnerComments) var commenttext = `'!comment (amount/"all") [profileid] [custom, quotes]' - ${lang.helpcommentowner1.replace("maxOwnerComments", config.maxOwnerComments)}`;
            else var commenttext = `'!comment ("1") [profileid] [custom, quotes]' - ${lang.helpcommentowner2}`;
    } else {
        if (Object.keys(controller.communityobject).length > 1 || config.maxComments) var commenttext = `'!comment (amount/"all")' - ${lang.helpcommentuser1.replace("maxComments", config.maxComments)}`;
            else var commenttext = `'!comment' - ${lang.helpcommentuser2}`;
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
    
        ${lang.helpreadothercmdshere} ' https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Commands-documentation '`);
};


/**
 * Runs the info command
 * @param {String} steam64id The steamID64 as String
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 */
module.exports.info = (steam64id, chatmsg, steamID) => {
    var mainfile   = require("../main.js");
    var controller = require("../../controller/controller.js");


    controller.lastcomment.findOne({ id: steam64id }, (err, doc) => {
        mainfile.lastsuccessfulcomment(cb => {
            /* eslint-disable no-irregular-whitespace */
            chatmsg(steamID, `
                -----------------------------------~~~~~------------------------------------ 
                >   ${extdata.mestr}'s Comment Bot [Version ${extdata.versionstr}] (More info: !about)
                >   Uptime: ${Number(Math.round(((new Date() - controller.bootstart) / 3600000)+"e"+2)+"e-"+2)} hours | Branch: ${extdata.branch}
                >   'node.js' Version: ${process.version} | RAM Usage (RSS): ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB
                >   Accounts: ${Object.keys(controller.communityobject).length} | maxComments/owner: ${config.maxComments}/${config.maxOwnerComments} | delay: ${config.commentdelay}
                |
                >   Your steam64ID: ${steam64id}
                >   Your last comment request: ${(new Date(doc.time)).toISOString().replace(/T/, " ").replace(/\..+/, "")} (GMT time)
                >   Last processed comment request: ${(new Date(cb)).toISOString().replace(/T/, " ").replace(/\..+/, "")} (GMT time)
                >   I have commented ${mainfile.commentcounter} times since my last restart and completed request!
                -----------------------------------~~~~~------------------------------------
            `);
            /* eslint-enable no-irregular-whitespace */
        });
    });
};


/**
 * Runs the ping command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.ping = (chatmsg, steamID, lang) => {
    var https      = require("https");


    var pingstart = Date.now();

    https.get("https://steamcommunity.com/ping", function(res) { // Ping steamcommunity.com/ping and measure time
        res.setEncoding("utf8");
        res.on("data", () => {}); // Seems like this is needed to be able to catch 'end' but since we don't need to collect anything this stays empty

        res.on("end", () => {
            chatmsg(steamID, lang.pingcmdmessage.replace("pingtime", Date.now() - pingstart));
        });
    });
};


/**
 * Runs the about command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 */
module.exports.about = (chatmsg, steamID) => {
    chatmsg(steamID, extdata.aboutstr);
};


/**
 * Runs the owner command
 * @param {Function} chatmsg The chatmsg function
 * @param {Object} steamID The steamID object from steam-user
 * @param {Object} lang The language object
 */
module.exports.owner = (chatmsg, steamID, lang) => {
    if (config.owner.length < 1) return chatmsg(steamID, lang.ownercmdnolink);

    chatmsg(steamID, lang.ownercmdmsg + "\n" + config.owner);
};