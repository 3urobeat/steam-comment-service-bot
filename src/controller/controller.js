/*
 * File: controller.js
 * Project: steam-comment-service-bot
 * Created Date: 09.07.2021 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 04.06.2023 16:13:59
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EventEmitter } = require("events");


/**
 * Constructor - Initializes the controller and starts all bot accounts
 * @class
 */
const Controller = function() {
    this.srcdir = srcdir; // Let users see the global var srcdir more easily

    // Create eventEmitter
    this.events = new EventEmitter();

    /**
     * Collection of miscellaneous functions for easier access
     */
    this.misc = {
        /**
         * Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)
         * @param {Number} iterations The amount of iterations
         * @param {Function} func The function to run each iteration (Params: loop, index)
         * @param {Function} exit This function will be called when the loop is finished
         */
        syncLoop: (iterations, func, exit) => {}, // eslint-disable-line

        /**
         * Rounds a number with x decimals
         * @param {Number} value Number to round
         * @param {Number} decimals Amount of decimals
         * @returns {Number} Rounded number
         */
        round: (value, decimals) => {}, // eslint-disable-line

        /**
         * Converts a timestamp to a human-readable until from now format. Does not care about past/future.
         * @returns {String} "x seconds/minutes/hours/days"
         */
        timeToString: () => {}, // eslint-disable-line

        /**
         * Pings an URL to check if the service and this internet connection is working
         * @param {String} url The URL of the service to check
         * @param {Boolean} throwTimeout If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
         * @returns {Promise.<{ statusMessage: string, statusCode: number|null }>} Resolves on response code 2xx and rejects on any other response code. Both are called with parameter `response` (Object) which has a `statusMessage` (String) and `statusCode` (Number) key. `statusCode` is `null` if request failed.
         */
        checkConnection: (url, throwTimeout) => {}, // eslint-disable-line

        /**
         * Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.
         * It is used by the steamChatInteraction helper but can be used in plugins as well.
         * @param {String} txt The string to cut
         * @param {Number} limit Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount.
         * @param {Array} cutChars Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"]
         * @param {Number} threshold Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length
         * @returns {Array} Returns all parts of the string in an array
         */
        cutStringsIntelligently: (txt, limit, cutChars, threshold) => {} // eslint-disable-line
    };


    this.info = {
        bootStartTimestamp: Date.now(), // Save timestamp to be able to calculate startup time in ready event
        lastLoginTimestamp: 0,          // Save timestamp of last login attempted by any account to calculate wait time for next account
        steamGuardInputTime: 0,         // Tracks time spent waiting for user steamGuardCode input to subtract from startup time
        startupWarnings: 0,             // Counts amount of warnings displayed by dataCheck during startup to display amount in ready event
        activeLogin: false,             // Allows to block new requests when waiting for the last request to finish
        relogAfterDisconnect: true,     // Allows to prevent accounts from relogging when calling bot.logOff()
        readyAfter: 0,                  // Length of last startup in seconds
        skippedaccounts: [],            // Array of account names which have been skipped
        commentCounter: 0               // Tracks total amount of comments to display in info command
    };

    this.activeRequests = {}; // Stores active comment, vote etc. requests
};


/**
 * Internal: Inits the DataManager system, runs the updater and starts all bot accounts
 */
Controller.prototype._start = async function() {
    let checkAndGetFile = require("../starter.js").checkAndGetFile; // Temp var to use checkAndGetFile() before it is referenced in DataManager
    this.checkAndGetFile = checkAndGetFile;

    /* ------------ Init error handler: ------------ */
    if (!await checkAndGetFile("./src/controller/helpers/handleErrors.js", logger, false, false)) return this.stop();
    this._handleErrors();


    /* ------------ Introduce logger function: ------------ */
    if (!await checkAndGetFile("./src/controller/helpers/logger.js", logger, false, false)) return this.stop();
    logger = this.logger; // Update "fake" logger with "real" logger

    // Log held back messages from before this start
    if (logafterrestart.length > 0) {
        logger("", "\n\n", true);

        logafterrestart.forEach((e) => { // Log messages to output.txt carried through restart
            e.split("\n").forEach((f) => { // Split string on line breaks to make output cleaner when using remove
                logger("", "[logafterrestart] " + f, true, true);
            });
        });
    }

    logafterrestart = []; // Clear array // TODO: Export logafterrestart or smth

    // Update data in Controller object with data that has been passed through restart
    this.info.skippedaccounts = skippedaccounts;


    /* ------------ Mark new execution in output: ------------ */
    logger("", "", true, true);                             // Log one newline separated so it only shows up in output.txt
    logger("", "\nBootup sequence started...", true, true); // ...add the second newline here so it also shows up in stdout. The message itself gets cleared because remove is true.
    logger("", "---------------------------------------------------------", true, true);


    /* ------------ Check internet connection: ------------ */
    logger("info", "Checking if Steam is reachable...", false, true, logger.animation("loading"));

    if (!await checkAndGetFile("./src/controller/helpers/misc.js", logger, false, false)) return this.stop();
    this.misc = await require("./helpers/misc.js");

    this.misc.checkConnection("https://steamcommunity.com", true)
        .then((res) => logger("info", `SteamCommunity is up! Status code: ${res.statusCode}`, false, true, logger.animation("loading")))
        .catch((res) => {
            if (!res.statusCode) logger("error", `SteamCommunity seems to be down or your internet isn't working! Check: https://steamstat.us \n        ${res.statusMessage}\n\n        Aborting...\n`, true);
                else logger("error", `Your internet is working but SteamCommunity seems to be down! Check: https://steamstat.us \n        ${res.statusMessage} (Status Code ${res.statusCode})\n\n        Aborting...\n`, true);

            return this.stop(); // Stop the bot as there is nothing more we can do
        });


    /* ------------ Init dataManager system and import: ------------ */
    if (!checkAndGetFile("./src/dataManager/dataManager.js", logger, false, false)) return;
    let DataManager = require("../dataManager/dataManager.js");

    this.data = new DataManager(this); // All functions provided by the DataManager, as well as all imported file data will be accessible here

    await this.data._importFromDisk();

    // Call optionsUpdateAfterConfigLoad() to set previously inaccessible options
    this._loggerOptionsUpdateAfterConfigLoad(this.data.advancedconfig);


    /* ------------ Print startup messages to log and set terminal title: ------------ */
    logger("info", `steam-comment-service-bot made by ${this.data.datafile.mestr} version ${this.data.datafile.versionstr} (branch ${this.data.datafile.branch})`, false, true, logger.animation("loading"));
    logger("info", `This is start number ${this.data.datafile.timesloggedin + 1} (firststart ${this.data.datafile.firststart}) on ${process.platform} with node.js ${process.version}...`, false, true, logger.animation("loading"));

    if (process.platform == "win32") { // Set node process name to find it in task manager etc.
        process.title = `${this.data.datafile.mestr}'s Steam Comment Service Bot v${this.data.datafile.versionstr} | ${process.platform}`; // Windows allows long terminal/process names
    } else {
        process.stdout.write(`${String.fromCharCode(27)}]0;${this.data.datafile.mestr}'s Steam Comment Service Bot v${this.data.datafile.versionstr} | ${process.platform}${String.fromCharCode(7)}`); // Sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)
        process.title = "CommentBot"; // Sets process title in task manager etc.
    }


    // Check for unsupported node.js version (<14.15.0)
    let versionarr = process.version.replace("v", "").split(".");

    versionarr.forEach((e, i) => { if (e.length == 1 && parseInt(e) < 10) versionarr[i] = `0${e}`; }); // Put 0 in front of single digits

    if (parseInt(versionarr.join("")) < 141500) {
        logger("", "\n************************************************************************************\n", true);
        logger("error", `This application requires at least node.js ${logger.colors.reset}v14.15.0${logger.colors.fgred} but you have ${logger.colors.reset}${process.version}${logger.colors.fgred} installed!\n        Please update your node.js installation: ${logger.colors.reset} https://nodejs.org/`, true);
        logger("", "\n************************************************************************************\n", true);
        return this.stop();
    }


    /* ------------ Check imported data : ------------ */
    global.extdata = this.data.datafile; // This needs to stay for backwards compatibility

    // Process imported owner & group ids and update cachefile
    await this.data.processData();

    // Check imported data
    await this.data.checkData().catch(() => this.stop()); // Terminate the bot if some critical check failed


    /* ------------ Run compatibility feature and updater or start logging in: ------------ */
    let forceUpdate = false; // Provide forceUpdate var which is passed to updater which runCompatibility can overwrite

    let compatibility = await checkAndGetFile("./src/updater/compatibility.js", logger, false, false);
    if (compatibility) forceUpdate = await compatibility.runCompatibility(this); // Don't bother running it if it couldn't be found and just hope the next update will fix it

    // Attempt to load updater to activate the auto update checker. If this fails we are properly "fucked" as we can't repair ourselves
    let Updater = await checkAndGetFile("./src/updater/updater.js", logger, false, false);
    if (!Updater) {
        logger("error", "Fatal Error: Failed to load updater! Please reinstall the bot manually. Aborting...");
        this.stop();
        return;
    }

    // Init a new updater object. This will start our auto update checker
    this.updater = new Updater(this);

    // Check if the last update failed and skip the updater for now
    if (updateFailed) {
        logger("info", `It looks like the last update failed! Skipping the updater for now and hoping ${this.data.datafile.mestr} fixes the issue soon.\n       Another attempt will be made in 6 hours or on the next restart.\n\n       If you haven't reported the error yet please do so as only then he will be able to fix it!`, true);

        this._preLogin(); // Run one-time pre-login tasks, it will call login() when it's done

    } else {

        // Let the updater run and check for any available updates
        let { updateFound } = await this.updater.run(forceUpdate);

        // Continue if no update was found. If an update was found and installed the updater will restart the bot itself.
        if (!updateFound) {
            this._preLogin(); // Run one-time pre-login tasks, it will call login() when it's done
        }
    }
};


/**
 * Internal: Loads all parts of the application to get IntelliSense support after the updater ran and calls login() when done.
 */
Controller.prototype._preLogin = async function() {

    // Update Updater IntelliSense without modifying what _start() has already set. Integrity has already been checked
    let Updater = require("../updater/updater.js"); // eslint-disable-line

    /**
     * The updater object
     * @type {Updater}
     */
    this.updater;


    // Check bot.js for errors and load it explicitly again to get IntelliSense support
    if (!await this.checkAndGetFile("./src/bot/bot.js", logger, false, false)) return this.stop();
    let Bot = require("../bot/bot.js"); // eslint-disable-line

    /**
     * Stores references to all bot account objects mapped to their accountName
     * @type {Object.<string, Bot>}
     */
    this.bots = {};

    /**
     * The main bot account
     * @type {Bot}
     */
    this.main = {}; // Store short-hand reference to the main acc (populated later)


    // Load Controller event handlers & helpers. This must happen after bot.js has been verified
    require("./events/ready.js");
    require("./events/statusUpdate.js");
    require("./events/steamGuardInput.js");
    require("./helpers/friendlist.js");
    require("./helpers/getBots.js");
    require("./helpers/handleSteamIdResolving.js");
    require("./login.js");


    // Load commandHandler
    let CommandHandler = require("../commands/commandHandler.js");

    /**
     * The commandHandler object
     * @type {CommandHandler}
     */
    this.commandHandler = new CommandHandler(this);
    this.commandHandler._importCoreCommands();


    // Load pluginSystem
    let PluginSystem = require("../pluginSystem/pluginSystem.js");

    /**
     * The pluginSystem handler
     * @type {PluginSystem}
     */
    this.pluginSystem = new PluginSystem(this);
    this.pluginSystem._loadPlugins(); // Load all plugins now


    // Start logging in
    this.login(true);

};


module.exports = Controller;


/* ------------ Handle restart data: ------------ */

/**
 * Process data that should be kept over restarts
 */
function restartdata(data) {
    data = JSON.parse(data); // Convert the stringified object back to an object

    if (data.oldconfig) oldconfig = data.oldconfig //eslint-disable-line
    if (data.logafterrestart) logafterrestart = data.logafterrestart; // We can't print now since the logger function isn't imported yet.
    if (data.skippedaccounts) skippedaccounts = data.skippedaccounts;
    if (data.updateFailed) updateFailed = data.updateFailed;
}

// Make a "fake" logger backup function to use when no npm packages were installed
let logger = function(type, str) {
    logafterrestart.push(`${type} | ${str}`); // Push message to array that will be carried through restart
    console.log(`${type} | ${str}`);
};
logger.animation = () => {}; // Just to be sure that no error occurs when trying to call this function without the real logger being present


/* ------------ Start the bot: ------------ */ // TODO: Not rewritten yet

if (parseInt(process.argv[3]) + 2500 > Date.now()) { // Check if this process just got started in the last 2.5 seconds or just required by itself by checking the timestamp attached by starter.js

    // Variables to keep data through restarts. These need to be var's as they need to be accessible from the top scope, sorry eslint!
    var oldconfig       = {};    // eslint-disable-line
    var logafterrestart = [];    // eslint-disable-line
    var updateFailed    = false; // eslint-disable-line
    var skippedaccounts = [];    // eslint-disable-line

    // Yes, I know, global variables are bad. But I need a few multiple times in different files and it would be a pain in the ass to import them every time and ensure that I don't create a circular dependency and what not.
    global.botisloggedin = false;
    global.srcdir        = process.argv[2];

    // Start the bot through the restartdata function if this is a restart to keep some data or start the bot directly
    if (process.argv[4]) restartdata(process.argv[4]);

    // Start the bot
    let controller = new Controller();

    setTimeout(() => controller._start(), 50); // Wanna hear something stupid? The error catch in handleErrors.js does not work without this delay. Why? Because the empty function for JsDoc below overwrites the real one. Even though the real one is loaded after the fake one.
}


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Restarts the whole application
 * @param {String} data Stringified restartdata object that will be kept through restarts
 */
Controller.prototype.restart = function(data) { process.send(`restart(${data})`); };

/**
 * Stops the whole application
 */
Controller.prototype.stop = function() { process.send("stop()"); };

/**
 * Attempts to log in all bot accounts which are currently offline one after another.
 * Creates a new bot object for every new account and reuses existing one if possible
 * @param {Boolean} firstLogin Is set to true by controller if this is the first login to display more information
 */
Controller.prototype.login = function(firstLogin) {}; // eslint-disable-line

/**
 * Runs internal ready event code and emits ready event for plugins
 */
Controller.prototype._readyEvent = function() {};

/**
 * Runs internal statusUpdate event code and emits statusUpdate event for plugins
 * @param {Bot} bot Bot instance
 * @param {Bot.EStatus} newStatus The new status
 */
Controller.prototype._statusUpdateEvent = function(bot, newStatus) {}; // eslint-disable-line

/**
 * Emits steamGuardInput event for bot & plugins
 * @param {Bot} bot Bot instance of the affected account
 * @param {function(string)} submitCode Function to submit a code. Pass an empty string to skip the account.
 */
Controller.prototype._steamGuardInputEvent = function(bot, submitCode) {}; // eslint-disable-line

/**
 * Check if all friends are in lastcomment database
 * @param {Bot} bot Bot object of the account to check
 */
Controller.prototype.checkLastcommentDB = function(bot) {}; // eslint-disable-line

/**
 * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
 * @param {Bot} bot Bot object of the account to check
 * @param {function} [callback] Called with `remaining` (Number) on completion
 */
Controller.prototype.friendListCapacityCheck = function(bot, callback) {}; // eslint-disable-line

/**
 * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
 */
Controller.prototype._lastcommentUnfriendCheck = function() {} // eslint-disable-line

/**
 * Retrieves all matching bot accounts and returns them.
 * @param {(EStatus|EStatus[]|string)} [statusFilter=EStatus.ONLINE] Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
 * @param {Boolean} mapToObject Optional: If true, an object will be returned where every bot object is mapped to their accountName.
 * @returns {Array|Object} An array or object if `mapToObject == true` containing all matching bot accounts.
 */
Controller.prototype.getBots = function(statusFilter = EStatus.ONLINE, mapToObject = false) {}; // eslint-disable-line

/**
 * Internal: Handles process's unhandledRejection & uncaughtException error events.
 * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
 */
Controller.prototype._handleErrors = function() {} // eslint-disable-line

/**
 * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation
 * @param {String} str The profileID argument provided by the user
 * @param {String} expectedIdType The type of SteamID expected ("profile", "group" or "sharedfile") or `null` if type should be assumed.
 * @param {function} [callback] Called with `err` (String or null), `steamID64` (String or null), `idType` (String or null) parameters on completion
 */
Controller.prototype.handleSteamIdResolving = (str, expectedIdType, callback) => {} // eslint-disable-line

/**
 * Logs text to the terminal and appends it to the output.txt file.
 * @param {String} type String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
 * @param {String} str The text to log into the terminal
 * @param {Boolean} nodate Setting to true will hide date and time in the message
 * @param {Boolean} remove Setting to true will remove this message with the next one
 * @param {Boolean} printNow Ignores the readyafterlogs check and force prints the message now
 */
Controller.prototype.logger = function(type, str, nodate, remove, animation, printNow) {}; // eslint-disable-line

/**
 * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
 */
Controller.prototype._loggerOptionsUpdateAfterConfigLoad = function(advancedconfig) {}; // eslint-disable-line

/**
 * Internal: Logs all held back messages from logAfterReady array
 */
Controller.prototype._loggerLogAfterReady = function() {}; // eslint-disable-line