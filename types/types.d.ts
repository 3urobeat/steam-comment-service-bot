/**
 * Constructor - Initializes an object which represents a user steam account
 * @param controller - Reference to the controller object
 * @param index - The index of this account in the logininfo object
 */
declare class Bot {
    constructor(controller: Controller, index: number);
    /**
     * Reference to the controller object
     */
    controller: Controller;
    /**
     * Reference to the controller object
     */
    data: DataManager;
    /**
     * Login index of this bot account
     */
    index: number;
    /**
     * Status of this bot account
     */
    status: EStatus;
    /**
     * SteamID64's to ignore in the friendMessage event handler. This is used by readChatMessage() to prevent duplicate responses.
     */
    friendMessageBlock: string[];
    /**
     * Additional login related information for this bot account
     */
    loginData: any;
    /**
     * Calls SteamUser logOn() for this account. This will either trigger the SteamUser loggedOn or error event.
     */
    _loginToSteam(): void;
    /**
     * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
     * @param steamID64 - The steamID64 of the message sender
     * @param message - The message string provided by steam-user friendMessage event
     * @returns `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
     */
    checkMsgBlock(steamID64: any, message: string): boolean;
    /**
     * Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)
     */
    handleLoginTimeout(): void;
    /**
     * Handles checking for missing game licenses, requests them and then starts playing
     */
    handleMissingGameLicenses(): void;
    /**
     * Our commandHandler respondModule implementation - Sends a message to a Steam user
     * @param _this - The Bot object context
     * @param resInfo - Object containing information passed to command by friendMessage event
     * @param txt - The text to send
     * @param retry - Internal: true if this message called itself again to send failure message
     * @param part - Internal: Index of which part to send for messages larger than 750 chars
     */
    sendChatMessage(_this: any, resInfo: any, txt: string, retry: boolean, part: number): void;
    /**
     * Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.
     * @param steamID64 - The steamID64 of the user to read a message from
     * @param timeout - Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended)
     * @returns Resolved with `String` on response or `null` on timeout.
     */
    readChatMessage(steamID64: string, timeout: number): Promise<string | null>;
    /**
     * Handles the SteamUser debug events if enabled in advancedconfig
     */
    _attachSteamDebugEvent(): void;
    /**
     * Handles the SteamUser disconnect event and tries to relog the account
     */
    _attachSteamDisconnectedEvent(): void;
    /**
     * Handles the SteamUser error event
     */
    _attachSteamErrorEvent(): void;
    /**
     * Handles messages, cooldowns and executes commands.
     */
    _attachSteamFriendMessageEvent(): void;
    /**
     * Do some stuff when account is logged in
     */
    _attachSteamLoggedOnEvent(): void;
    /**
     * Accepts a friend request, adds the user to the lastcomment.db database and invites him to your group
     */
    _attachSteamFriendRelationshipEvent(): void;
    /**
     * Accepts a group invite if acceptgroupinvites in the config is true
     */
    _attachSteamGroupRelationshipEvent(): void;
    /**
     * Handles setting cookies and accepting offline friend & group invites
     */
    _attachSteamWebSessionEvent(): void;
    /**
     * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
     * @param steamID64 - The steamID64 of the message sender
     * @param message - The message string provided by steam-user friendMessage event
     * @returns `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
     */
    checkMsgBlock(steamID64: any, message: string): boolean;
    /**
     * Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)
     */
    handleLoginTimeout(): void;
    /**
     * Handles checking for missing game licenses, requests them and then starts playing
     */
    handleMissingGameLicenses(): void;
    /**
     * Our commandHandler respondModule implementation - Sends a message to a Steam user
     * @param _this - The Bot object context
     * @param resInfo - Object containing information passed to command by friendMessage event
     * @param txt - The text to send
     * @param retry - Internal: true if this message called itself again to send failure message
     * @param part - Internal: Index of which part to send for messages larger than 750 chars
     */
    sendChatMessage(_this: any, resInfo: any, txt: string, retry: boolean, part: number): void;
    /**
     * Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.
     * @param steamID64 - The steamID64 of the user to read a message from
     * @param timeout - Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended)
     * @returns Resolved with `String` on response or `null` on timeout.
     */
    readChatMessage(steamID64: string, timeout: number): Promise<string | null>;
}

declare namespace Bot {
    /**
     * Status which a bot object can have
     */
    enum EStatus {
    }
}

/**
 * Constructor - Initializes the commandHandler which allows you to integrate core commands into your plugin or add new commands from your plugin.
 * @param controller - Reference to the current controller object
 */
declare class CommandHandler {
    constructor(controller: Controller);
    /**
     * Internal: Imports core commands on startup
     */
    _importCoreCommands(): void;
    /**
     * Registers a new command during runtime
     * @param command - The command object to register
     * @param command.description - Description of what this command does
     * @param command.ownersOnly - Set to true to only allow owners to use this command.
     * @param command.run - Function that will be executed when the command runs. Arguments: commandHandler, args, steamID64, respondModule, context, resInfo
     * @returns true if the command was successfully registered, false otherwise
     */
    registerCommand(command: {
        description: string;
        ownersOnly: boolean;
        run: (...params: any[]) => any;
    }): any;
    /**
     * The name of the command to unregister during runtime
     * @param commandName - Name of the command to unregister
     * @returns true if the command was successfully unregistered, false otherwise
     */
    unregisterCommand(commandName: string): any;
    /**
     * Finds a loaded command by name and runs it
     * @param name - The name of the command
     * @param args - Array of arguments that will be passed to the command
     * @param steamID64 - SteamID64 of the requesting user which is used to check for ownerOnly and will be passed to the command
     * @param respondModule - Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param context - The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
     * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). Please also include a "cmdprefix" key & value pair if your command handler uses a prefix other than "!".
     * @returns `true` if command was found, `false` if not
     */
    runCommand(name: string, args: any[], steamID64: number, respondModule: (...params: any[]) => any, context: any, resInfo: any): any;
    /**
     * Reloads all core commands. Does NOT reload commands registered at runtime. Please consider reloading the pluginSystem as well.
     */
    reloadCommands(): void;
}

/**
 * Internal: Do the actual commenting, activeRequests entry with all relevant information was processed by the comment command function above.
 * @param commandHandler - The commandHandler object
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - Shortened respondModule call
 * @param postComment - The correct postComment function for this idType. Context from the correct bot account is being applied later.
 * @param commentArgs - All arguments this postComment function needs, without callback. It will be applied and a callback added as last param. Include a key called "quote" to dynamically replace it with a random quote.
 * @param receiverSteamID64 - steamID64 of the profile to receive the comments
 */
declare function comment(commandHandler: CommandHandler, resInfo: any, respond: (...params: any[]) => any, postComment: (...params: any[]) => any, commentArgs: any, receiverSteamID64: string): void;

/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param requesterSteamID64 - The steamID64 of the requesting user
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - The function to send messages to the requesting user
 */
declare function getCommentArgs(commandHandler: CommandHandler, args: any[], requesterSteamID64: string, resInfo: any, respond: (...params: any[]) => any): Promise<{ maxRequestAmount: number; commentcmdUsage: string; numberOfComments: number; profileID: string; idType: string; quotesArr: string[]; }>;

/**
 * Finds all needed and currently available bot accounts for a comment request.
 * @param commandHandler - The commandHandler object
 * @param numberOfComments - Number of requested comments
 * @param canBeLimited - If the accounts are allowed to be limited
 * @param idType - Type of the request. This can either be "profile", "group" or "sharedfile". This is used to determine if limited accs need to be added first.
 * @param receiverSteamID - Optional: steamID64 of the receiving user. If set, accounts that are friend with the user will be prioritized and accsToAdd will be calculated.
 * @returns `availableAccounts` contains all account names from bot object, `accsToAdd` account names which are limited and not friend, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
declare function getAvailableBotsForCommenting(commandHandler: CommandHandler, numberOfComments: number, canBeLimited: boolean, idType: string, receiverSteamID: string): any;

/**
 * Finds all needed and currently available bot accounts for a favorite request.
 * @param commandHandler - The commandHandler object
 * @param amount - Amount of favs requested or "all" to get the max available amount
 * @param id - The sharedfile id to favorize
 * @param favType - Either "favorite" or "unfavorite", depending on which request this is
 * @returns Promise with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
declare function getAvailableBotsForFavorizing(commandHandler: CommandHandler, amount: number | "all", id: string, favType: string): Promise<{ amount: number; availableAccounts: string[]; whenAvailable: number; whenAvailableStr: string; }>;

/**
 * Retrieves arguments from a vote request. If request is invalid, an error message will be sent
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param cmd - Either "upvote", "downvote", "favorite" or "unfavorite", depending on which command is calling this function
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - The function to send messages to the requesting user
 * @returns If the user provided a specific amount, amount will be a number. If user provided "all" or "max", it will be returned as an unmodified string for getVoteBots.js to handle
 */
declare function getSharedfileArgs(commandHandler: CommandHandler, args: any[], cmd: string, resInfo: any, respond: (...params: any[]) => any): Promise<{ amount: number | string; id: string; }>;

/**
 * Finds all needed and currently available bot accounts for a vote request.
 * @param commandHandler - The commandHandler object
 * @param amount - Amount of votes requested or "all" to get the max available amount
 * @param id - The sharedfile id to vote on
 * @param voteType - "upvote" or "downvote", depending on which request this is
 * @returns Promise with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
declare function getAvailableBotsForVoting(commandHandler: CommandHandler, amount: number | "all", id: string, voteType: string): Promise<{ amount: number; availableAccounts: string[]; whenAvailable: number; whenAvailableStr: string; }>;

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
 * @param error - The error string returned by steamcommunity
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
 * Checks if the following vote process iteration should be skipped
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by misc.js syncLoop() helper
 * @param bot - Bot object of the account making this request
 * @param id - ID of the sharedfile that receives the votes
 * @returns true if iteration should continue, false if iteration should be skipped using return
 */
declare function handleVoteIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, id: string): any;

/**
 * Checks if the following favorite process iteration should be skipped
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by misc.js syncLoop() helper
 * @param bot - Bot object of the account making this request
 * @param id - ID of the sharedfile that receives the votes
 * @returns true if iteration should continue, false if iteration should be skipped using return
 */
declare function handleFavoriteIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, id: string): any;

/**
 * Logs vote errors
 * @param error - The error string returned by steam-community
 * @param commandHandler - The commandHandler object
 * @param bot - Bot object of the account making this request
 * @param id - ID of the sharedfile that receives the votes
 */
declare function logVoteError(error: string, commandHandler: CommandHandler, bot: Bot, id: string): void;

/**
 * Logs favorite errors
 * @param error - The error string returned by steam-community
 * @param commandHandler - The commandHandler object
 * @param bot - Bot object of the account making this request
 * @param id - ID of the sharedfile that receives the favorites
 */
declare function logFavoriteError(error: string, commandHandler: CommandHandler, bot: Bot, id: string): void;

/**
 * Helper function to sort failed object by comment number so that it is easier to read
 * @param failedObj - Current state of failed object
 */
declare function sortFailedCommentsObject(failedObj: any): void;

/**
 * Constructor - Initializes the controller and starts all bot accounts
 */
declare class Controller {
    constructor();
    /**
     * Collection of miscellaneous functions for easier access
     */
    misc: any;
    /**
     * Internal: Inits the DataManager system, runs the updater and starts all bot accounts
     */
    _start(): void;
    /**
     * Internal: Loads all parts of the application to get IntelliSense support after the updater ran and calls login() when done.
     */
    _preLogin(): void;
    /**
     * The updater object
     */
    updater: Updater;
    /**
     * Stores references to all bot account objects mapped to their accountName
     */
    bots: {
        [key: string]: Bot;
    };
    /**
     * The main bot account
     */
    main: Bot;
    /**
     * The commandHandler object
     */
    commandHandler: CommandHandler;
    /**
     * The pluginSystem handler
     */
    pluginSystem: PluginSystem;
    /**
     * Restarts the whole application
     * @param data - Stringified restartdata object that will be kept through restarts
     */
    restart(data: string): void;
    /**
     * Stops the whole application
     */
    stop(): void;
    /**
     * Attempts to log in all bot accounts which are currently offline one after another.
     * Creates a new bot object for every new account and reuses existing one if possible
     * @param firstLogin - Is set to true by controller if this is the first login to display more information
     */
    login(firstLogin: boolean): void;
    /**
     * Runs internal ready event code and emits ready event for plugins
     */
    _readyEvent(): void;
    /**
     * Runs internal statusUpdate event code and emits statusUpdate event for plugins
     * @param bot - Bot instance
     * @param newStatus - The new status
     */
    _statusUpdateEvent(bot: Bot, newStatus: Bot.EStatus): void;
    /**
     * Emits steamGuardInput event for bot & plugins
     * @param bot - Bot instance of the affected account
     * @param submitCode - Function to submit a code. Pass an empty string to skip the account.
     */
    _steamGuardInputEvent(bot: Bot, submitCode: (...params: any[]) => any): void;
    /**
     * Check if all friends are in lastcomment database
     * @param bot - Bot object of the account to check
     */
    checkLastcommentDB(bot: Bot): void;
    /**
     * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
     * @param bot - Bot object of the account to check
     * @param [callback] - Called with `remaining` (Number) on completion
     */
    friendListCapacityCheck(bot: Bot, callback?: (...params: any[]) => any): void;
    /**
     * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
     */
    _lastcommentUnfriendCheck(): void;
    /**
     * Retrieves all matching bot accounts and returns them.
     * @param [statusFilter = EStatus.ONLINE] - Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
     * @param mapToObject - Optional: If true, an object will be returned where every bot object is mapped to their accountName.
     * @returns An array or object if `mapToObject == true` containing all matching bot accounts.
     */
    getBots(statusFilter?: EStatus | EStatus[] | string, mapToObject: boolean): any[] | any;
    /**
     * Internal: Handles process's unhandledRejection & uncaughtException error events.
     * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
     */
    _handleErrors(): void;
    /**
     * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation
     * @param str - The profileID argument provided by the user
     * @param expectedIdType - The type of SteamID expected ("profile", "group" or "sharedfile") or `null` if type should be assumed.
     * @param [callback] - Called with `err` (String or null), `steamID64` (String or null), `idType` (String or null) parameters on completion
     */
    handleSteamIdResolving(str: string, expectedIdType: string, callback?: (...params: any[]) => any): void;
    /**
     * Logs text to the terminal and appends it to the output.txt file.
     * @param type - String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
     * @param str - The text to log into the terminal
     * @param nodate - Setting to true will hide date and time in the message
     * @param remove - Setting to true will remove this message with the next one
     * @param printNow - Ignores the readyafterlogs check and force prints the message now
     */
    logger(type: string, str: string, nodate: boolean, remove: boolean, printNow: boolean): void;
    /**
     * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
     */
    _loggerOptionsUpdateAfterConfigLoad(): void;
    /**
     * Internal: Logs all held back messages from logAfterReady array
     */
    _loggerLogAfterReady(): void;
    /**
     * Runs internal ready event code and emits ready event for plugins
     */
    _readyEvent(): void;
    /**
     * Runs internal statusUpdate event code and emits statusUpdate event for plugins
     * @param bot - Bot instance
     * @param newStatus - The new status
     */
    _statusUpdateEvent(bot: Bot, newStatus: Bot.EStatus): void;
    /**
     * Emits steamGuardInput event for bot & plugins
     * @param bot - Bot instance of the affected account
     * @param submitCode - Function to submit a code. Pass an empty string to skip the account.
     */
    _steamGuardInputEvent(bot: Bot, submitCode: (...params: any[]) => any): void;
    /**
     * Check if all friends are in lastcomment database
     * @param bot - Bot object of the account to check
     */
    checkLastcommentDB(bot: Bot): void;
    /**
     * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
     * @param bot - Bot object of the account to check
     * @param [callback] - Called with `remaining` (Number) on completion
     */
    friendListCapacityCheck(bot: Bot, callback?: (...params: any[]) => any): void;
    /**
     * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
     */
    _lastcommentUnfriendCheck(): void;
    /**
     * Retrieves all matching bot accounts and returns them.
     * @param [statusFilter = EStatus.ONLINE] - Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
     * @param mapToObject - Optional: If true, an object will be returned where every bot object is mapped to their accountName.
     * @returns An array or object if `mapToObject == true` containing all matching bot accounts.
     */
    getBots(statusFilter?: EStatus | EStatus[] | string, mapToObject: boolean): any[] | any;
    /**
     * Internal: Handles process's unhandledRejection & uncaughtException error events.
     * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
     */
    _handleErrors(): void;
    /**
     * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation
     * @param str - The profileID argument provided by the user
     * @param expectedIdType - The type of SteamID expected ("profile", "group" or "sharedfile") or `null` if type should be assumed.
     * @param [callback] - Called with `err` (String or null), `steamID64` (String or null), `idType` (String or null) parameters on completion
     */
    handleSteamIdResolving(str: string, expectedIdType: string, callback?: (...params: any[]) => any): void;
    /**
     * Logs text to the terminal and appends it to the output.txt file.
     * @param type - String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
     * @param str - The text to log into the terminal
     * @param nodate - Setting to true will hide date and time in the message
     * @param remove - Setting to true will remove this message with the next one
     * @param printNow - Ignores the readyafterlogs check and force prints the message now
     */
    logger(type: string, str: string, nodate: boolean, remove: boolean, printNow: boolean): void;
    /**
     * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
     */
    _loggerOptionsUpdateAfterConfigLoad(): void;
    /**
     * Internal: Logs all held back messages from logAfterReady array
     */
    _loggerLogAfterReady(): void;
    /**
     * Attempts to log in all bot accounts which are currently offline one after another.
     * Creates a new bot object for every new account and reuses existing one if possible
     * @param firstLogin - Is set to true by controller if this is the first login to display more information
     */
    login(firstLogin: boolean): void;
}

/**
 * Process data that should be kept over restarts
 */
declare function restartdata(): void;

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
declare function checkConnection(url: string, throwTimeout: boolean): Promise<{ statusMessage: string; statusCode: number | null; }>;

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
declare class DataManager {
    constructor(controller: Controller);
    /**
     * Checks currently loaded data for validity and logs some recommendations for a few settings.
     * @returns Resolves promise when all checks have finished. If promise is rejected you should terminate the application or reset the changes. Reject is called with a String specifying the failed check.
     */
    checkData(): Promise<void>;
    /**
     * Internal: Loads all config & data files from disk and handles potential errors
     * @returns Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    _importFromDisk(): Promise<void>;
    /**
     * Reference to the controller object
     */
    controller: Controller;
    /**
     * Stores all `data.json` values.
     * Read only - Do NOT MODIFY anything in this file!
     */
    datafile: any;
    /**
     * Stores all `config.json` settings.
     */
    config: {
        [key: string]: any;
    };
    /**
     * Stores all `advancedconfig.json` settings.
     */
    advancedconfig: {
        [key: string]: any;
    };
    /**
     * Stores all language strings used for responding to a user.
     * All default strings have already been replaced with corresponding matches from `customlang.json`.
     */
    lang: {
        [key: string]: string;
    };
    /**
     * Stores all quotes used for commenting provided via the `quotes.txt` file.
     */
    quotes: String[];
    /**
     * Stores all proxies provided via the `proxies.txt` file.
     */
    proxies: String[];
    /**
     * Stores IDs from config files converted at runtime and backups for all config & data files.
     */
    cachefile: any;
    /**
     * Stores the login information for every bot account provided via the `logininfo.json` or `accounts.txt` files.
     */
    logininfo: {
        [key: string]: { accountName: string; password: string; sharedSecret: string; steamGuardCode: null; machineName: string; deviceFriendlyName: string; };
    };
    /**
     * Database which stores the timestamp of the last request of every user. This is used to enforce `config.unfriendTime`.
     * Document structure: { id: String, time: Number }
     */
    lastCommentDB: Nedb;
    /**
     * Database which stores information about which bot accounts have already voted on which sharedfiles. This allows us to filter without pinging Steam for every account on every request.
     * Document structure: { id: String, accountName: String, type: String, time: Number }
     */
    ratingHistoryDB: Nedb;
    /**
     * Database which stores the refreshTokens for all bot accounts.
     * Document structure: { accountName: String, token: String }
     */
    tokensDB: Nedb;
    /**
     * Checks currently loaded data for validity and logs some recommendations for a few settings.
     * @returns Resolves promise when all checks have finished. If promise is rejected you should terminate the application or reset the changes. Reject is called with a String specifying the failed check.
     */
    checkData(): Promise<void>;
    /**
     * Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)
     */
    processData(): void;
    /**
     * Internal: Loads all config & data files from disk and handles potential errors
     * @returns Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    _importFromDisk(): Promise<void>;
    /**
     * Gets a random quote
     * @param quotesArr - Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
     * @returns Resolves with `quote` (String)
     */
    getQuote(quotesArr: any[]): Promise<string>;
    /**
     * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
     * @param id - ID of the user to look up
     * @returns Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as String), `untilStr` (Wait until as String). If id wasn't found, `null` will be returned.
     */
    getUserCooldown(id: string): Promise<{ lastRequest: number; until: number; lastRequestStr: string; untilStr: string; } | null>;
    /**
     * Updates or inserts timestamp of a user
     * @param id - ID of the user to update
     * @param timestamp - Unix timestamp of the last interaction the user received
     */
    setUserCooldown(id: string, timestamp: number): void;
    /**
     * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
     */
    _startExpiringTokensCheckInterval(): void;
    /**
     * Internal: Asks user if he/she wants to refresh the tokens of all expiring accounts when no active request was found and relogs them
     * @param expiring - Object of botobject entries to ask user for
     */
    _askForGetNewToken(expiring: any): void;
    /**
     * Retrieves the last processed request of anyone or a specific steamID64 from the lastcomment database
     * @param steamID64 - Search for a specific user
     * @returns Called with the greatest timestamp (Number) found
     */
    getLastCommentRequest(steamID64: string): Promise<number>;
    /**
     * Decodes a JsonWebToken - https://stackoverflow.com/a/38552302
     * @param token - The token to decode
     * @returns JWT object on success, `null` on failure
     */
    decodeJWT(token: string): any;
    /**
     * Refreshes Backups in cache.json with new data
     */
    refreshCache(): void;
    /**
     * Internal: Helper function to try and restore backup of corrupted file from cache.json
     * @param name - Name of the file
     * @param filepath - Absolute path of the file on the disk
     * @param cacheentry - Backup-Object of the file in cache.json
     * @param onlinelink - Link to the raw file in the GitHub repository
     * @param resolve - Function to resolve the caller's promise
     */
    _restoreBackup(name: string, filepath: string, cacheentry: any, onlinelink: string, resolve: (...params: any[]) => any): void;
    /**
     * Internal: Helper function to pull new file from GitHub
     */
    _pullNewFile(): void;
    /**
     * Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)
     */
    processData(): void;
    /**
     * Gets a random quote
     * @param quotesArr - Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
     * @returns Resolves with `quote` (String)
     */
    getQuote(quotesArr: any[]): Promise<string>;
    /**
     * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
     * @param id - ID of the user to look up
     * @returns Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as String), `untilStr` (Wait until as String). If id wasn't found, `null` will be returned.
     */
    getUserCooldown(id: string): Promise<{ lastRequest: number; until: number; lastRequestStr: string; untilStr: string; } | null>;
    /**
     * Updates or inserts timestamp of a user
     * @param id - ID of the user to update
     * @param timestamp - Unix timestamp of the last interaction the user received
     */
    setUserCooldown(id: string, timestamp: number): void;
    /**
     * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
     */
    _startExpiringTokensCheckInterval(): void;
    /**
     * Internal: Asks user if he/she wants to refresh the tokens of all expiring accounts when no active request was found and relogs them
     * @param expiring - Object of botobject entries to ask user for
     */
    _askForGetNewToken(expiring: any): void;
    /**
     * Retrieves the last processed request of anyone or a specific steamID64 from the lastcomment database
     * @param steamID64 - Search for a specific user
     * @returns Called with the greatest timestamp (Number) found
     */
    getLastCommentRequest(steamID64: string): Promise<number>;
    /**
     * Decodes a JsonWebToken - https://stackoverflow.com/a/38552302
     * @param token - The token to decode
     * @returns JWT object on success, `null` on failure
     */
    decodeJWT(token: string): any;
    /**
     * Refreshes Backups in cache.json with new data
     */
    refreshCache(): void;
    /**
     * Internal: Helper function to try and restore backup of corrupted file from cache.json
     * @param name - Name of the file
     * @param filepath - Absolute path of the file on the disk
     * @param cacheentry - Backup-Object of the file in cache.json
     * @param onlinelink - Link to the raw file in the GitHub repository
     * @param resolve - Function to resolve the caller's promise
     */
    _restoreBackup(name: string, filepath: string, cacheentry: any, onlinelink: string, resolve: (...params: any[]) => any): void;
    /**
     * Internal: Helper function to pull new file from GitHub
     */
    _pullNewFile(): void;
}

/**
 * @property load - Called on Plugin load
 * @property unload - Called on Plugin unload
 * @property ready - Controller ready event
 * @property statusUpdate - Controller statusUpdate event
 * @property steamGuardInput - Controller steamGuardInput event
 */
declare type Plugin = {
    load: (...params: any[]) => any;
    unload: (...params: any[]) => any;
    ready: (...params: any[]) => any;
    statusUpdate: (...params: any[]) => any;
    steamGuardInput: (...params: any[]) => any;
};

/**
 * Constructor - The plugin system loads all plugins and provides functions for plugins to hook into
 * @param controller - Reference to the controller object
 */
declare class PluginSystem {
    constructor(controller: Controller);
    /**
     * Gets the path holding all data of a plugin. If no folder exists yet, one will be created
     * @param pluginName - Name of your plugin
     * @returns Path to the folder containing your plugin data
     */
    getPluginDataPath(pluginName: string): string;
    /**
     * Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.
     * @param pluginName - Name of your plugin
     * @param filename - Name of the file to load
     * @returns Resolves with data on success, rejects otherwise with an error
     */
    loadPluginData(pluginName: string, filename: string): Promise<any>;
    /**
     * Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.
     * @param pluginName - Name of your plugin
     * @param filename - Name of the file to load
     * @param data - The data to write
     * @returns Resolves on success, rejects otherwise with an error
     */
    writePluginData(pluginName: string, filename: string, data: string): Promise<void>;
    /**
     * Deletes a file in your plugin data folder if it exists.
     * @param pluginName - Name of your plugin
     * @param filename - Name of the file to load
     * @returns Resolves on success, rejects otherwise with an error
     */
    deletePluginData(pluginName: string, filename: string): Promise<void>;
    /**
     * Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.
     * @param pluginName - Name of your plugin
     * @returns Resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.
     */
    loadPluginConfig(pluginName: string): Promise<object>;
    /**
     * Writes your plugin config changes to the filesystem. The object data will be processed to JSON.
     * @param pluginName - Name of your plugin
     * @param pluginConfig - Config object of your plugin
     * @returns Resolves on success, rejects otherwise with an error
     */
    writePluginConfig(pluginName: string, pluginConfig: any): Promise<void>;
    /**
     * Internal: Loads all plugin npm packages and populates pluginList
     */
    _loadPlugins(): void;
    /**
     * Reference to the controller object
     */
    controller: Controller;
    /**
     * References to all plugin objects
     */
    pluginList: {
        [key: string]: Plugin;
    };
    commandHandler: CommandHandler;
    /**
     * Reloads all plugins and calls ready event after ~2.5 seconds.
     */
    reloadPlugins(): void;
    /**
     * Internal: Loads all plugin npm packages and populates pluginList
     */
    _loadPlugins(): void;
    /**
     * Internal: Checks a plugin, displays relevant warnings and decides whether the plugin is allowed to be loaded
     * @param folderName - Name of the plugin folder. This is used to reference the plugin when thisPluginConf is undefined
     * @param thisPlugin - Plugin file object returned by require()
     * @param thisPluginConf - package.json object of this plugin
     * @returns Resolved with `true` (can be loaded) or `false` (must not be loaded) on completion
     */
    _checkPlugin(folderName: string, thisPlugin: any, thisPluginConf: any): Promise<boolean>;
    /**
     * Gets the path holding all data of a plugin. If no folder exists yet, one will be created
     * @param pluginName - Name of your plugin
     * @returns Path to the folder containing your plugin data
     */
    getPluginDataPath(pluginName: string): string;
    /**
     * Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.
     * @param pluginName - Name of your plugin
     * @param filename - Name of the file to load
     * @returns Resolves with data on success, rejects otherwise with an error
     */
    loadPluginData(pluginName: string, filename: string): Promise<any>;
    /**
     * Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.
     * @param pluginName - Name of your plugin
     * @param filename - Name of the file to load
     * @param data - The data to write
     * @returns Resolves on success, rejects otherwise with an error
     */
    writePluginData(pluginName: string, filename: string, data: string): Promise<void>;
    /**
     * Deletes a file in your plugin data folder if it exists.
     * @param pluginName - Name of your plugin
     * @param filename - Name of the file to load
     * @returns Resolves on success, rejects otherwise with an error
     */
    deletePluginData(pluginName: string, filename: string): Promise<void>;
    /**
     * Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.
     * @param pluginName - Name of your plugin
     * @returns Resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.
     */
    loadPluginConfig(pluginName: string): Promise<object>;
    /**
     * Writes your plugin config changes to the filesystem. The object data will be processed to JSON.
     * @param pluginName - Name of your plugin
     * @param pluginConfig - Config object of your plugin
     * @returns Resolves on success, rejects otherwise with an error
     */
    writePluginConfig(pluginName: string, pluginConfig: any): Promise<void>;
}

/**
 * Constructor - Object oriented approach for handling session for one account
 * @param bot - The bot object of this account
 */
declare class SessionHandler {
    constructor(bot: Bot);
    /**
     * Internal: Attaches listeners to all steam-session events we care about
     */
    _attachEvents(): void;
    /**
     * Internal: Handles submitting 2FA code
     * @param res - Response object from startWithCredentials() promise
     */
    _handle2FA(res: any): void;
    /**
     * Internal: Helper function to get 2FA code from user and passing it to accept function or skipping account if desired
     */
    _get2FAUserInput(): void;
    /**
     * Internal: Helper function to make accepting and re-requesting invalid steam guard codes easier
     * @param code - Input from user
     */
    _acceptSteamGuardCode(code: string): void;
    /**
     * Helper function to make handling login errors easier
     * @param err - Error thrown by startWithCredentials()
     */
    _handleCredentialsLoginError(err: any): void;
    /**
     * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
     * @param [callback] - Called with `refreshToken` (String) on success or `null` on failure
     */
    _getTokenFromStorage(callback?: (...params: any[]) => any): void;
    /**
     * Internal - Saves a new token for this account to tokens.db
     * @param token - The refreshToken to store
     */
    _saveTokenToStorage(token: string): void;
    /**
     * Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.
     */
    invalidateTokenInStorage(): void;
    /**
     * Handles getting a refresh token for steam-user to auth with
     * @returns `refreshToken` on success or `null` on failure
     */
    getToken(): Promise<string | null>;
    /**
     * Internal - Handles resolving the getToken() promise and skipping the account if necessary
     * @param token - The token to resolve with or null when account should be skipped
     */
    _resolvePromise(token: string): void;
    /**
     * Internal - Attempts to log into account with credentials
     */
    _attemptCredentialsLogin(): void;
    /**
     * Internal: Attaches listeners to all steam-session events we care about
     */
    _attachEvents(): void;
    /**
     * Internal: Handles submitting 2FA code
     * @param res - Response object from startWithCredentials() promise
     */
    _handle2FA(res: any): void;
    /**
     * Internal: Helper function to get 2FA code from user and passing it to accept function or skipping account if desired
     */
    _get2FAUserInput(): void;
    /**
     * Internal: Helper function to make accepting and re-requesting invalid steam guard codes easier
     * @param code - Input from user
     */
    _acceptSteamGuardCode(code: string): void;
    /**
     * Helper function to make handling login errors easier
     * @param err - Error thrown by startWithCredentials()
     */
    _handleCredentialsLoginError(err: any): void;
    /**
     * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
     * @param [callback] - Called with `refreshToken` (String) on success or `null` on failure
     */
    _getTokenFromStorage(callback?: (...params: any[]) => any): void;
    /**
     * Internal - Saves a new token for this account to tokens.db
     * @param token - The refreshToken to store
     */
    _saveTokenToStorage(token: string): void;
    /**
     * Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.
     */
    invalidateTokenInStorage(): void;
}

/**
 * Checks if the needed file exists and gets it if it doesn't
 * @param file - The file path (from project root) to check and get
 * @param logger - Your current logger function
 * @param norequire - If set to true the function will return the path instead of importing it
 * @param force - If set to true the function will skip checking if the file exists and overwrite it.
 * @returns Resolves when file was successfully loaded
 */
declare function checkAndGetFile(file: string, logger: (...params: any[]) => any, norequire: boolean, force: boolean): Promise<undefined | string | object>;

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
declare function runCompatibility(controller: Controller): Promise<void | null>;

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
declare function customUpdateRules(compatibilityfeaturedone: any, oldconfig: any, oldadvancedconfig: any, olddatafile: any, callback: (...params: any[]) => any): Promise<void>;

/**
 * Downloads all files from the repository and installs them
 * @param controller - Reference to the controller object
 * @returns Resolves when we can proceed. Null on success, err on failure.
 */
declare function startDownload(controller: Controller): Promise<null | any>;

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
declare class Updater {
    constructor(controller: Controller);
    /**
     * Checks for any available update and installs it.
     * @param forceUpdate - If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
     * @param respondModule - If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters.
     * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
     * @returns Promise that will be resolved with false when no update was found or with true when the update check or download was completed. Expect a restart when true was returned.
     */
    run(forceUpdate: boolean, respondModule: (...params: any[]) => any, resInfo: any): Promise<boolean>;
}

