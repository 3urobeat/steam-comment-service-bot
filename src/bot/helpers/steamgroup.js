
/**
 * Gets the groupID64 of yourgroup set in the config from cache.json or Steam
 * @returns groupID64 String
 */
module.exports.configgroup64id = () => {
    var steamidresolver = require("steamid-resolver") //also my own library, cool right?
    var fs              = require("fs")

    var cachefile       = require("../../data/cache.json")

    
    logger("info", "Getting groupID64 of yourgroup set in the config.json...", false, true)

    if (config.yourgroup.length < 1) { //id is stored in cache file, no need to get it again
        logger("info", "Skipping groupID64 request of yourgroup because config.yourgroup is empty.", false, true); //log to output for debugging
        return null;
        
    } else {
    
        if (cachefile.configgroup == config.yourgroup) {
            logger("info", "configgroupID64 of yourgroup is stored in cache.json...", false, true)

            return cachefile.configgroupID64; //return configgroup64id
    
        } else {
            logger("info", "groupID64 of yourgroup not in cache.json. Requesting information from Steam...", false, true)
    
            steamidresolver.groupUrlToGroupID64(config.yourgroup, (err, yourgroupResult) => {
                if (err == "The specified group could not be found.") { //if the group couldn't be found display specific message
                    logger("error", "Your group (yourgroup in config) doesn't seem to be valid!\n        Error: " + config.yourgroup + " contains no xml or groupID64 data", true); 
                    return null;

                } else {
                    if (err) {
                        logger("error", "Error getting yourgroup information from Steam: " + err) //if a different error then display a generic message with the error
                        return null;
                    }
                }
    
                logger("info", `Successfully retrieved yourgroup information. groupID64: ${yourgroupResult}`, false, true)
    

                cachefile.configgroup = config.yourgroup
                cachefile.configgroup64id = yourgroupResult

                fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cachefile, null, 4), err => { 
                    if (err) logger("error", `Writing configgroup64id to cache.json error: ${err}`) 
                })

                return yourgroupResult; //return configgroup64id
            })
        } 
    } 
}


/**
 * Gets the groupID64 of botsgroup set in the config from cache.json or Steam
 * @returns groupID64 String
 */
module.exports.botsgroupID64 = () => {
    var steamidresolver = require("steamid-resolver") //also my own library, cool right?
    var fs              = require("fs")

    var cachefile       = require(srcdir + "/data/cache.json")


    logger("info", "Getting groupID64 of botsgroup set in the config.json...", false, true)

    if (config.botsgroup.length < 1) { //id is stored in cache file, no need to get it again
        logger("info", "Skipping groupID64 request of botsgroup because config.botsgroup is empty.", false, true); //log to output for debugging
        return null;
        
    } else {
    
        if (cachefile.botsgroup == config.botsgroup) {
            logger("info", "groupID64 of botsgroup is stored in cache.json...", false, true)

            return cachefile.botsgroupid; //return botsgroupid
    
        } else {
            logger("info", "groupID64 of botsgroup not in cache.json. Requesting information from Steam...", false, true)
    
            steamidresolver.groupUrlToGroupID64(config.botsgroup, (err, botsgroupid) => {
                if (err == "The specified group could not be found.") { //if the group couldn't be found display specific message
                    logger("error", "Your group (botsgroup in config) doesn't seem to be valid!\n        Error: " + config.botsgroup + " contains no xml or groupID64 data", true); 
                    return null;

                } else {
                    if (err) {
                        logger("error", "Error getting botsgroup information from Steam: " + err) //if a different error then display a generic message with the error
                        return null;
                    }
                }
    
                logger("info", `Successfully retrieved botsgroup information. groupID64: ${botsgroupid}`, false, true)
    

                cachefile.botsgroup = config.botsgroup
                cachefile.botsgroupid = botsgroupid

                fs.writeFile(srcdir + "/data/cache.json", JSON.stringify(cachefile, null, 4), err => { 
                    if (err) logger("error", `Writing botsgroupid to cache.json error: ${err}`) 
                })

                return botsgroupid; //return botsgroupid
            })
        } 
    } 
}