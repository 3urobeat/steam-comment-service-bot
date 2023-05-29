/**
 * Constructor - Initializes an object which represents a user steam account
 * @param controller - Reference to the controller object
 * @param index - The index of this account in the logininfo object
 */
declare function Bot(controller: Controller, index: number): void;

/**
 * Constructor - Initializes the commandHandler which allows you to integrate core commands into your plugin or add new commands from your plugin.
 * @param controller - Reference to the current controller object
 */
declare function CommandHandler(controller: Controller): void;

/**
 * Internal: Do the actual commenting, activeRequests entry with all relevant information was processed by the comment command function above.
 * @param commandHandler - The commandHandler object
 * @param respond - Shortened respondModule call
 * @param postComment - The correct postComment function for this idType. Context from the correct bot account is being applied later.
 * @param commentArgs - All arguments this postComment function needs, without callback. It will be applied and a callback added as last param. Include a key called "quote" to dynamically replace it with a random quote.
 * @param receiverSteamID64 - steamID64 of the profile to receive the comments
 */
declare function comment(commandHandler: CommandHandler, respond: (...params: any[]) => any, postComment: (...params: any[]) => any, commentArgs: any, receiverSteamID64: string): void;

/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param requesterSteamID64 - The steamID64 of the requesting user
 * @param respond - The function to send messages to the requesting user
 * @returns maxRequestAmount, commentcmdUsage, numberOfComments, profileID, idType, customQuotesArr
 */
declare function getCommentArgs(commandHandler: CommandHandler, args: any[], requesterSteamID64: string, respond: (...params: any[]) => any): any;

/**
 * Finds all needed and currently available bot accounts for a comment request.
 * @param commandHandler - The commandHandler object
 * @param numberOfComments - Number of requested comments
 * @param canBeLimited - If the accounts are allowed to be limited
 * @param idType - Type of the request. This can either be "profile", "group" or "sharedfile". This is used to determine if limited accs need to be added first.
 * @param receiverSteamID - Optional: steamID64 of the receiving user. If set, accounts that are friend with the user will be prioritized and accsToAdd will be calculated.
 * @returns Object containing `accsNeeded` (Number), `availableAccounts` (Array of account names from bot object), `accsToAdd` (Array of account names from bot object which are limited and not friend) and `whenAvailable` (Timestamp representing how long to wait until accsNeeded amount of accounts will be available), `whenAvailableStr` (Timestamp formatted human-readable as time from now)
 */
declare function getAvailableBotsForCommenting(commandHandler: CommandHandler, numberOfComments: number, canBeLimited: boolean, idType: string, receiverSteamID: string): any;

/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param requesterSteamID64 - The steamID64 of the requesting user
 * @param respond - The function to send messages to the requesting user
 * @returns maxRequestAmount, commentcmdUsage, numberOfComments, profileID, idType, customQuotesArr
 */
declare function getVoteArgs(commandHandler: CommandHandler, args: any[], requesterSteamID64: string, respond: (...params: any[]) => any): any;

/**
 * Checks if the following comment process iteration should be skipped
 * Aborts comment process on critical error.
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by misc.js syncLoop() helper
 * @param bot - Bot object of the account posting this comment
 * @param receiverSteamID64 - steamID64 of the receiving user/group
 * @returns true if iteration should continue, false if iteration should be skipped using return
 */
declare function handleIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, receiverSteamID64: string): boolean;

/**
 * Adds a description to comment errors and applies additional cooldowns for certain errors
 * @param error - The error string returned by steam-user
 * @param commandHandler - The commandHandler object
 * @param bot - Bot object of the account posting this comment
 * @param receiverSteamID64 - steamID64 of the receiving user/group
 */
declare function logCommentError(error: string, commandHandler: CommandHandler, bot: Bot, receiverSteamID64: string): void;

/**
 * Helper function to sort failed object by comment number so that it is easier to read
 * @param failedObj - Current state of failed object
 */
declare function sortFailedCommentsObject(failedObj: any): void;

/**
 * Groups same error messages together, counts amount, lists affected bots and converts it to a String.
 * @param obj - failedcomments object that should be converted
 * @returns String that looks like this: `amount`x - `indices`\n`error message`
 */
declare function failedCommentsObjToString(obj: any): string;

/**
 * Constructor - Initializes the controller and starts all bot accounts
 */
declare function Controller(): void;

/**
 * Collection of miscellaneous functions for easier access
 */
declare var misc: any;

/**
 * Process data that should be kept over restarts
 */
declare function restartdata(): void;

/**
 * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation
 * @param str - The profileID argument provided by the user
 * @param expectedIdType - The type of SteamID expected ("profile", "group" or "sharedfile") or `null` if type should be assumed.
 * @param [callback] - Called with `err` (String or null), `steamID64` (String or null), `idType` (String or null) parameters on completion
 */
declare function handleSteamIdResolving(str: string, expectedIdType: string, callback?: (...params: any[]) => any): void;

/**
 * Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)
 * @param iterations - The amount of iterations
 * @param func - The function to run each iteration (Params: loop, index)
 * @param exit - This function will be called when the loop is finished
 */
declare function syncLoop(iterations: number, func: (...params: any[]) => any, exit: (...params: any[]) => any): void;

/**
 * Rounds a number with x decimals
 * @param value - Number to round
 * @param decimals - Amount of decimals
 * @returns Rounded number
 */
declare function round(value: number, decimals: number): number;

/**
 * Converts a timestamp to a human-readable until from now format. Does not care about past/future.
 * @returns "x seconds/minutes/hours/days"
 */
declare function timeToString(): string;

/**
 * Pings an URL to check if the service and this internet connection is working
 * @param url - The URL of the service to check
 * @param throwTimeout - If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
 * @returns Resolves on response code 2xx and rejects on any other response code. Both are called with parameter `response` (Object) which has a `statusMessage` (String) and `statusCode` (Number) key. `statusCode` is `null` if request failed.
 */
declare function checkConnection(url: string, throwTimeout: boolean): Promise;

/**
 * Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.
 * It is used by the steamChatInteraction helper but can be used in plugins as well.
 * @param txt - The string to cut
 * @param limit - Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount.
 * @param cutChars - Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"]
 * @param threshold - Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length
 * @returns Returns all parts of the string in an array
 */
declare function cutStringsIntelligently(txt: string, limit: number, cutChars: any[], threshold: number): any[];

/**
 * Attempts to reinstall all modules
 * @param logger - The currently used logger function (real or fake, the caller decides)
 * @param [callback] - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
declare function reinstallAll(logger: (...params: any[]) => any, callback?: (...params: any[]) => any): void;

/**
 * Updates all installed packages to versions listed in package.json from the project root directory.
 * @param [callback] - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
declare function update(callback?: (...params: any[]) => any): void;

/**
 * Updates all installed packages to versions listed in package.json
 * @param path - Custom path to read package.json from and install packages to
 * @param [callback] - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
declare function updateFromPath(path: string, callback?: (...params: any[]) => any): void;

/**
 * Constructor - The dataManager system imports, checks, handles errors and provides a file updating service for all configuration files
 * @param controller - Reference to the controller object
 */
declare function DataManager(controller: Controller): void;

/**
 * Stores all `data.json` values.
 * Read only - Do NOT MODIFY anything in this file!
 */
declare var datafile: any;

/**
 * Stores all `config.json` settings.
 */
declare var config: {
    [key: string]: any;
};

/**
 * Stores all `advancedconfig.json` settings.
 */
declare var advancedconfig: {
    [key: string]: any;
};

/**
 * Stores all language strings used for responding to a user.
 * All default strings have already been replaced with corresponding matches from `customlang.json`.
 */
declare var lang: {
    [key: string]: string;
};

/**
 * Stores all quotes used for commenting provided via the `quotes.txt` file.
 */
declare var quotes: String[];

/**
 * Stores all proxies provided via the `proxies.txt` file.
 */
declare var proxies: String[];

/**
 * Stores IDs from config files converted at runtime and backups for all config & data files.
 */
declare var cachefile: any;

/**
 * Stores the login information for every bot account provided via the `logininfo.json` or `accounts.txt` files.
 */
declare var logininfo: {
    [key: string]: { accountName: string; password: string; sharedSecret: string; steamGuardCode: null; machineName: string; deviceFriendlyName: string; };
};

/**
 * Database which stores the timestamp of the last comment request of every user. This is used to enforce `config.unfriendTime`.
 * Document structure: { id: String, time: Number }
 */
declare var lastCommentDB: Nedb;

/**
 * Database which stores the refreshTokens for all bot accounts.
 * Document structure: { accountName: String, token: String }
 */
declare var tokensDB: Nedb;

/**
 * Constructor - The plugin system loads all plugins and provides functions for plugins to hook into
 * @param controller - Reference to the controller object
 */
declare function PluginSystem(controller: Controller): void;

/**
 * @property load - Called on Plugin load
 * @property unload - Called on Plugin unload
 * @property ready - Controller ready event
 * @property statusUpdate - Controller statusUpdate event
 */
declare type Plugin = {
    load: (...params: any[]) => any;
    unload: (...params: any[]) => any;
    ready: (...params: any[]) => any;
    statusUpdate: (...params: any[]) => any;
};

/**
 * References to all plugin objects
 */
declare var pluginList: {
    [key: string]: Plugin;
};

declare var commandHandler: CommandHandler;

/**
 * Constructor - Object oriented approach for handling session for one account
 * @param bot - The bot object of this account
 */
declare function SessionHandler(bot: Bot): void;

/**
 * Checks if the needed file exists and gets it if it doesn't
 * @param file - The file path (from project root) to check and get
 * @param logger - Your current logger function
 * @param norequire - If set to true the function will return the path instead of importing it
 * @param force - If set to true the function will skip checking if the file exists and overwrite it.
 * @returns Resolves when file was successfully loaded
 */
declare function checkAndGetFile(file: string, logger: (...params: any[]) => any, norequire: boolean, force: boolean): Promise;

/**
 * Run the application. This function is called by start.js
 */
declare function run(): void;

/**
 * Restart the application
 * @param args - The argument object that will be passed to `controller.restartargs()`
 */
declare function restart(args: any): void;

/**
 * Compatibility feature function to ensure automatic updating works. It gets the corresponding compatibility feature to this version and runs it if compatibilityfeaturedone in data.json is false.
 * @param controller - Reference to the controller object
 * @returns Resolves with `forceUpdate` (Boolean) when done. 'forceUpdate` must be passed to updater in controller.js!
 */
declare function runCompatibility(controller: Controller): Promise;

/**
 * Checks for an available update from the GitHub repo
 * @param datafile - The current `data.json` file from the DataManager
 * @param branch - Which branch you want to check. Defaults to the current branch set in `data.json`
 * @param forceUpdate - If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
 * @param [callback] - Called with `updateFound` (Boolean) and `data` (Object) on completion. `updatefound` will be false if the check should fail. `data` includes the full data.json file found online.
 */
declare function check(datafile: any, branch: string, forceUpdate: boolean, callback?: (...params: any[]) => any): void;

/**
 * Run the application. This function is called by start.js
 */
declare function run(): void;

/**
 * Applies custom update rules for a few files (gets called by downloadUpdate.js)
 * @param compatibilityfeaturedone - Legacy param, is unused
 * @param oldconfig - The old config from before the update
 * @param oldadvancedconfig - The old advancedconfig from before the update
 * @param olddatafile - The old datafile from before the update
 * @param callback - Legacy param, is unused
 * @returns Resolves when we can proceed
 */
declare function customUpdateRules(compatibilityfeaturedone: any, oldconfig: any, oldadvancedconfig: any, olddatafile: any, callback: (...params: any[]) => any): Promise;

/**
 * Downloads all files from the repository and installs them
 * @param controller - Reference to the controller object
 * @returns Resolves when we can proceed
 */
declare function startDownload(controller: Controller): Promise;

/**
 * Run the application. This function is called by start.js
 */
declare function run(): void;

/**
 * Run the application. This function is called by start.js
 */
declare function run(): void;

/**
 * Constructor - Initializes the updater which periodically checks for new versions available on GitHub, downloads them and handles backups.
 * @param controller - Reference to the controller object
 */
declare function Updater(controller: Controller): void;

