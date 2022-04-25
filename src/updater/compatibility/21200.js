/*
 * File: 21200.js
 * Project: steam-comment-service-bot
 * Created Date: 23.02.2022 10:39:41
 * Author: 3urobeat
 * 
 * Last Modified: 25.04.2022 15:28:51
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


module.exports.run = (callback) => {
    var fs    = require("fs");
    var cache = require("../../data/cache.json"); //should be safe to import here as checkAndGetFile() already ran in controller.js
    
    //Only do something if at least one of the two values exists
    if (cache.configjson && (cache.configjson.globalcommentcooldown || cache.configjson.allowcommentcmdusage != undefined)) { //intentionally checking specifically for undefined
        
        if (cache.configjson.globalcommentcooldown) config.botaccountcooldown = cache.configjson.globalcommentcooldown //write value previously assigned to globalcommentcooldown to botaccountcooldown
        if (cache.configjson.allowcommentcmdusage != undefined && !cache.configjson.allowcommentcmdusage) config.maxComments = 0; //since maxComments now handles disabling the comment cmd we need to set it to 0 if user previously turned the comment cmd off

        delete config.allowcommentcmdusage //remove allowcommentcmdusage and globalcommentcooldown that will be removed with this update
        delete config.globalcommentcooldown

        //Format and write new config
        var stringifiedconfig = JSON.stringify(config,function(k,v) { //Credit: https://stackoverflow.com/a/46217335/12934162
            if(v instanceof Array)
            return JSON.stringify(v);
            return v; 
        }, 4)
            .replace(/"\[/g, '[')
            .replace(/\]"/g, ']')
            .replace(/\\"/g, '"')
            .replace(/""/g, '""');

        fs.writeFile('./config.json', stringifiedconfig, (err) => { 
            if (err) logger("error", "Error writing converted globalcommentcooldown to config. Please change globalcommentcooldown in the config to 10 yourself. Error: " + err, true)
        })
    }
    

    extdata.compatibilityfeaturedone = true //set compatibilityfeaturedone to true here because we don't need to make another force update through checkforupdate() which would be necessary in order to set it to true from there

    fs.writeFile('./src/data.json', JSON.stringify(extdata, null, 4), (err) => { 
        if (err) logger("error", "Error in compatibilityfeature changing compatibilityfeaturedone to true! Please open 'data.json' in the 'src' folder and do this manually!\nOtherwise this will be retried on every startup. Error: " + err, true)
    })

    callback(true)
}

module.exports.info = {
    "master": "21200",
    "beta-testing": "21200b02"
}