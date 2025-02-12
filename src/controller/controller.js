/*
 * File: controller.js
 * Project: steam-comment-service-bot
 * Created Date: 2021-07-09 16:26:00
 * Author: 3urobeat
 *
 * Last Modified: 2025-02-12 21:55:08
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const { EventEmitter } = require("events");


// "Hack" to get type information in code completion without requiring file during runtime. Mark as private to avoid breaking generated docs
/**
 * @typedef Bot
 * @type {import("../bot/bot.js")}
 * @private
 */

/**
 * @typedef EIdTypes
 * @type {import("./helpers/handleSteamIdResolving.js")}
 * @private
 */


/**
 * Constructor - Initializes the controller and starts all bot accounts
 * @class
 */
const Controller = function() {
    this.srcdir = srcdir; // Let users see the global var srcdir more easily

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

    // Create eventEmitter
    this.events = new EventEmitter();

    /**
     * Collection of miscellaneous functions for easier access
     * @type {import("./helpers/misc.js")}
     */
    this.misc = {};


    /**
     * Collection of various misc parameters
     * @type {{ bootStartTimestamp: number, lastLoginTimestamp: object, steamGuardInputTime: number, startupWarnings: number, activeLogin: boolean, relogAfterDisconnect: boolean, readyAfter: number, skippedaccounts: string[], commentCounter: number, favCounter: number, followCounter: number, voteCounter: number }}
     */
    this.info = {
        bootStartTimestamp: Date.now(), // Save timestamp to be able to calculate startup time in ready event
        lastLoginTimestamp: {},         // Save timestamp of last login attempted by any account per proxy to calculate wait time for next account
        steamGuardInputTime: 0,         // Tracks time spent waiting for user steamGuardCode input to subtract from startup time
        startupWarnings: 0,             // Counts amount of warnings displayed by dataCheck during startup to display amount in ready event
        activeLogin: false,             // Allows to block new requests when waiting for the last request to finish
        relogAfterDisconnect: true,     // Allows to prevent accounts from relogging when calling bot.logOff()
        readyAfter: 0,                  // Length of last startup in seconds
        skippedaccounts: [],            // Array of account names which have been skipped

        commentCounter: 0,              // Tracks total amount of comments to display in info/stats command
        favCounter: 0,                  // Tracks total amount of favs + unfavs
        followCounter: 0,               // ...
        voteCounter: 0,
    };

    /**
     * Stores all recent comment, vote etc. requests
     * @type {Object.<string, { status: string, type: string, amount: number, quotesArr: (Array.<string>|undefined), requestedby: string, accounts: Array.<Bot>, thisIteration: number, retryAttempt: number, amountBeforeRetry: (number|undefined), until: number, ipCooldownPenaltyAdded: (boolean|undefined), failed: object }>}
     */
    this.activeRequests = {};
};


/* ------------ Handle restart data: ------------ */

/* eslint-disable no-use-before-define */

/**
 * Process data that should be kept over restarts
 * @private
 * @param {string} data Stringified data received by previous process
 */
function restartdata(data) {
    data = JSON.parse(data); // Convert the stringified object back to an object

    if (data.oldconfig) oldconfig = data.oldconfig // eslint-disable-line
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

/* eslint-enable no-use-before-define */


/* ------------ Start the bot: ------------ */

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
    const controller = new Controller();

    setTimeout(() => controller._start(), 50); // Wanna hear something stupid? The error catch in handleErrors.js does not work without this delay. Why? Because the empty function for JsDoc below overwrites the real one. Even though the real one is loaded after the fake one.
}


/**
 * Internal: Initializes the bot by importing data from the disk, running the updater and finally logging in all bot accounts.
 * @private
 */
Controller.prototype._start = async function() {
    const checkAndGetFile = require("../starter.js").checkAndGetFile; // Temp var to use checkAndGetFile() before it is referenced in DataManager
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


    // Check for unsupported node.js version (<16.0.0)
    const versionarr = process.version.replace("v", "").split(".");

    versionarr.forEach((e, i) => { if (e.length == 1 && parseInt(e) < 10) versionarr[i] = `0${e}`; }); // Put 0 in front of single digits

    if (parseInt(versionarr.join("")) < 160000) {
        logger("", "\n************************************************************************************\n", true);
        logger("error", `This application requires at least node.js ${logger.colors.reset}v16.0.0${logger.colors.fgred} but you have ${logger.colors.reset}${process.version}${logger.colors.fgred} installed!\n        Please update your node.js installation: ${logger.colors.reset} https://nodejs.org/`, true);
        logger("", "\n************************************************************************************\n", true);
        return this.stop();
    }


    /* ------------ Check internet connection: ------------ */
    logger("info", "Checking if Steam is reachable...", false, true, logger.animation("loading"));

    if (!await checkAndGetFile("./src/controller/helpers/misc.js", logger, false, false)) return this.stop();
    this.misc = require("./helpers/misc.js");

    await this.misc.checkConnection("https://steamcommunity.com", true)
        .then((res) => logger("info", `SteamCommunity is up! Status code: ${res.statusCode}`, false, true, logger.animation("loading")))
        .catch((res) => {
            if (!res.statusCode) logger("error", `SteamCommunity seems to be down or your internet isn't working! Check: https://steamstat.us \n        ${res.statusMessage}\n\n        Aborting...\n`, true);
                else logger("error", `Your internet is working but SteamCommunity seems to be down! Check: https://steamstat.us \n        ${res.statusMessage} (Status Code ${res.statusCode})\n\n        Aborting...\n`, true);

            return this.stop(); // Stop the bot as there is nothing more we can do
        });


    /* ------------ Init dataManager system and import: ------------ */
    if (!await checkAndGetFile("./src/dataManager/dataManager.js", logger, false, false)) return;
    const DataManager = require("../dataManager/dataManager.js");

    /**
     * The dataManager object
     * @type {DataManager}
     */
    this.data = new DataManager(this); // All functions provided by the DataManager, as well as all imported file data will be accessible here

    await this.data._loadDataManagerFiles();
    await this.data.importFromDisk();


    /* ------------ Print startup messages to log and set terminal title: ------------ */
    logger("info", `steam-comment-service-bot made by ${this.data.datafile.mestr} version ${this.data.datafile.versionstr} (branch ${this.data.datafile.branch})`, false, true, logger.animation("loading"));
    logger("info", `This is start number ${this.data.datafile.timesloggedin + 1} (firststart ${this.data.datafile.firststart}) on ${process.platform} with node.js ${process.version}...`, false, true, logger.animation("loading"));

    if (process.platform == "win32") { // Set node process name to find it in task manager etc.
        process.title = `${this.data.datafile.mestr}'s Steam Comment Service Bot v${this.data.datafile.versionstr} | ${process.platform}`; // Windows allows long terminal/process names
    } else {
        process.stdout.write(`${String.fromCharCode(27)}]0;${this.data.datafile.mestr}'s Steam Comment Service Bot v${this.data.datafile.versionstr} | ${process.platform}${String.fromCharCode(7)}`); // Sets terminal title (thanks: https://stackoverflow.com/a/30360821/12934162)
        process.title = "CommentBot"; // Sets process title in task manager etc.
    }


    /* ------------ Check imported data : ------------ */
    let forceUpdate = false; // Provide forceUpdate var which the following helpers can modify to force a update

    global.extdata = this.data.datafile; // This needs to stay for backwards compatibility

    // Verify integrity of all source code files and restore invalid ones. It is safe to use require() after this function is done!
    await this.data.verifyIntegrity();

    // Process imported owner & group ids and update cachefile
    await this.data.processData();

    // Check imported data
    await this.data.checkData().catch(() => this.stop()); // Terminate the bot if some critical check failed


    /* ------------ Run compatibility feature and updater or start logging in: ------------ */
    const compatibility = await checkAndGetFile("./src/updater/compatibility.js", logger, false, false);
    if (compatibility) forceUpdate = await compatibility.runCompatibility(this); // Don't bother running it if it couldn't be found and just hope the next update will fix it
        else logger("warn", "Failed to load compatibility feature handler! If the bot was just updated some settings might not have been transferred.", false, false, null, true);

    // Attempt to load updater. If this fails we are properly "fucked" as we can't repair ourselves
    const Updater = await checkAndGetFile("./src/updater/updater.js", logger, false, false);
    if (!Updater) {
        logger("error", "Fatal Error: Failed to load updater! Please reinstall the bot manually. Aborting...");
        return this.stop();
    }

    /**
     * The updater object
     * @type {import("../updater/updater.js")}
     */
    this.updater = new Updater(this);

    // Check if the last update failed and skip the updater for now
    if (updateFailed) {
        logger("info", `It looks like the last update failed! Skipping the updater for now and hoping ${this.data.datafile.mestr} fixes the issue soon.\n       Another attempt will be made in 6 hours or on the next restart.\n\n       If you haven't reported the error yet please do so it can get fixed!`, true);

        this._preLogin(); // Run one-time pre-login tasks, it will call login() when it's done

    } else {

        // Let the updater run and check for any available updates
        const updateFound = await this.updater.run(forceUpdate);

        // Continue if no update was found. If an update was found and installed the updater will restart the bot itself.
        if (!updateFound) {
            this._preLogin(); // Run one-time pre-login tasks, it will call login() when it's done
        }
    }
};


/**
 * Internal: Loads all parts of the application to get IntelliSense support after the updater ran and calls login() when done.
 * @private
 */
Controller.prototype._preLogin = async function() {

    // Get job manager going
    const JobManager = require("../jobs/jobManager.js");

    /**
     * The JobManager handles the periodic execution of functions which you can register at runtime
     * @type {JobManager}
     */
    this.jobManager = new JobManager(this);


    // Register update check job
    this.updater._registerUpdateChecker();


    // Load Controller event handlers & helpers. This must happen after bot.js has been verified
    require("./events/dataUpdate.js");
    require("./events/ready.js");
    require("./events/statusUpdate.js");
    require("./events/steamGuardInput.js");
    require("./events/steamGuardQrCode.js");
    require("./helpers/friendlist.js");
    require("./helpers/getBots.js");
    require("./helpers/handleSteamIdResolving.js");
    require("./login.js");
    require("./manage.js");


    // Load commandHandler
    const CommandHandler = require("../commands/commandHandler.js");

    /**
     * The commandHandler object
     * @type {CommandHandler}
     */
    this.commandHandler = new CommandHandler(this);
    await this.commandHandler._importCoreCommands();


    // Load pluginSystem
    const PluginSystem = require("../pluginSystem/pluginSystem.js");

    /**
     * The pluginSystem handler
     * @type {PluginSystem}
     */
    this.pluginSystem = new PluginSystem(this);

    await this.pluginSystem._loadPlugins();     // Load all plugins now. Await to hopefully give plugins enough time to catch Steam Guard events
    this.pluginSystem._registerUpdateChecker(); // Register update check job for all plugins


    // Start logging in
    this.login(true);


    // Register job to reload & respread proxies every 96 hours (I didn't know where to put this)
    this.jobManager.registerJob({
        name: "respreadProxies",
        description: "Reloads, checks and if possible respreads all proxies every 96 hours",
        func: () => { this.respreadProxies(); },
        interval: 3.456e+8,     // 96h in ms
        runOnRegistration: false
    });

};


module.exports = Controller;



/* ------------ Provide functions for restarting & stopping: ------------ */

/**
 * Restarts the whole application
 * @param {string} data Optional: Stringified restartdata object that will be kept through restarts
 */
Controller.prototype.restart = function(data) {
    if (!data) data = JSON.stringify({ skippedaccounts: this.info.skippedaccounts, updateFailed: false });

    process.send(`restart(${data})`);
};

/**
 * Stops the whole application
 */
Controller.prototype.stop = function() {
    process.send("stop()");
};


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Attempts to log in all bot accounts which are currently offline one after another.
 * Creates a new bot object for every new account and reuses existing one if possible
 * @param {boolean} firstLogin Is set to true by controller if this is the first login to display more information
 */
Controller.prototype.login = function(firstLogin) {}; // eslint-disable-line

/**
 * Internal: Logs in accounts on different proxies synchronously
 * @private
 * @param {Array} allAccounts Array of logininfo entries of accounts to log in
 */
Controller.prototype._processFastLoginQueue = function(allAccounts) {}; // eslint-disable-line

/**
 * Internal: Logs in accounts asynchronously to allow for user interaction
 * @private
 * @param {Array} allAccounts Array of logininfo entries of accounts to log in
 */
Controller.prototype._processSlowLoginQueue = function(allAccounts) {}; // eslint-disable-line

/**
 * Adds a new account to the set of bot accounts in use and writes changes to accounts.txt
 * @param {string} accountName Username of the account
 * @param {string} password Password of the account
 * @param {string} [sharedSecret] Optional: Shared secret of the account
 */
Controller.prototype.addAccount = function(accountName, password, sharedSecret = "") {}; // eslint-disable-line

/**
 * Removes an account from the active set of bot accounts and writes changes to accounts.txt
 * @param {string} accountName Username of the account to remove
 */
Controller.prototype.removeAccount = function(accountName) {}; // eslint-disable-line

/**
 * Relogs an account
 * @param {string} accountName Username of the account to relog
 */
Controller.prototype.relogAccount = function(accountName) {}; // eslint-disable-line

/**
 * Reloads and respreads all proxies and relogs affected accounts
 */
Controller.prototype.respreadProxies = async function() {};

/**
 * Filters the active set of bot accounts by a given criteria
 * @param {function(Bot): boolean} predicate Function that returns true if the account should be included in the result
 * @returns {Array.<Bot>} Array of bot instances that match the criteria
 */
Controller.prototype.filterAccounts = function(predicate) {}; // eslint-disable-line

/**
 * Set of premade functions for filterAccounts()
 * @type {{ all: Function, statusOffline: Function, statusOnline: Function, statusError: Function, statusSkipped: Function, limited: Function, unlimited: Function }}
 */
Controller.prototype.filters = {};

/**
 * Runs internal dataUpdate event code and emits dataUpdate event for plugins. The event is emitted whenever DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.
 * @private
 * @param {string} key Which DataManager key got updated
 * @param {any} oldData Old content of the updated key
 * @param {any} newData New content of the updated key
 */
Controller.prototype._dataUpdateEvent = function(key, oldData, newData) {}; // eslint-disable-line

/**
 * Runs internal ready event code and emits ready event for plugins
 * @private
 */
Controller.prototype._readyEvent = function() {};

/**
 * Runs internal statusUpdate event code and emits statusUpdate event for plugins
 * @private
 * @param {Bot} bot Bot instance
 * @param {Bot.EStatus} newStatus The new status of this bot
 */
Controller.prototype._statusUpdateEvent = function(bot, newStatus) {}; // eslint-disable-line

/**
 * Emits steamGuardInput event for bot & plugins
 * @private
 * @param {Bot} bot Bot instance of the affected account
 * @param {function(string): void} submitCode Function to submit a code. Pass an empty string to skip the account.
 */
Controller.prototype._steamGuardInputEvent = function(bot, submitCode) {}; // eslint-disable-line

/**
 * Emits steamGuardQrCode event for bot & plugins
 * @private
 * @param {Bot} bot Bot instance of the affected account
 * @param {string} challengeUrl The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.
 */
Controller.prototype._steamGuardQrCodeEvent = function(bot, challengeUrl) {}; // eslint-disable-line

/**
 * Check if all friends are in lastcomment database
 * @param {Bot} bot Bot object of the account to check
 */
Controller.prototype.checkLastcommentDB = function(bot) {}; // eslint-disable-line

/**
 * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
 * @param {Bot} bot Bot object of the account to check
 * @param {function(((number|null))): void} callback Called with `remaining` (Number) on success or `null` on failure
 */
Controller.prototype.friendListCapacityCheck = function(bot, callback) {}; // eslint-disable-line

/**
 * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
 * @private
 */
Controller.prototype._lastcommentUnfriendCheck = function() {} // eslint-disable-line

/**
 * Retrieves all matching bot accounts and returns them.
 * @param {(EStatus|EStatus[]|string)} [statusFilter=EStatus.ONLINE] Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
 * @param {boolean} [mapToObject=false] Optional: If true, an object will be returned where every bot object is mapped to their accountName.
 * @returns {Array.<Bot>} An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.
 */
Controller.prototype.getBots = function(statusFilter = EStatus.ONLINE, mapToObject = false) {}; // eslint-disable-line

/**
 * Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.
 * @param {boolean} [filterOffline=false] Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand!
 * @returns {Array.<{ bots: Array.<Bot>, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number }>} Bot accounts mapped to their associated proxy
 */
Controller.prototype.getBotsPerProxy = function(filterOffline = false) {}; // eslint-disable-line

/**
 * Internal: Handles process's unhandledRejection & uncaughtException error events.
 * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
 * @private
 */
Controller.prototype._handleErrors = function() {} // eslint-disable-line

/**
 * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
 * Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.
 * @param {string} str The profileID argument provided by the user
 * @param {EIdTypes} expectedIdType The type of SteamID expected or `null` if type should be assumed.
 * @param {function((string|null), (string|null), (EIdTypes|null)): void} callback
 * Called with `err` (String or null), `id` (String or null), `idType` (String or null) parameters on completion. The `id` param has the format `userID/appID` for type review and full input url for type discussion.
 */
Controller.prototype.handleSteamIdResolving = (str, expectedIdType, callback) => {} // eslint-disable-line

/**
 * Logs text to the terminal and appends it to the output.txt file.
 * @param {string} type String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
 * @param {string} str The text to log into the terminal
 * @param {boolean} nodate Setting to true will hide date and time in the message
 * @param {boolean} remove Setting to true will remove this message with the next one
 * @param {Array.<string>} animation Array containing animation frames as elements
 * @param {boolean} printNow Ignores the readyafterlogs check and force prints the message now
 * @param {boolean} cutToWidth Cuts the string to the width of the terminal
 */
Controller.prototype.logger = function(type, str, nodate, remove, animation, printNow) {}; // eslint-disable-line

/**
 * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
 * @private
 * @param {object} advancedconfig The advancedconfig object imported by the DataManager
 */
Controller.prototype._loggerOptionsUpdateAfterConfigLoad = function(advancedconfig) {}; // eslint-disable-line

/**
 * Internal: Logs all held back messages from logAfterReady array
 * @private
 */
Controller.prototype._loggerLogAfterReady = function() {};
