/**
 * Status which a bot object can have
 */
declare const enum EStatus {
    OFFLINE = 0,
    ONLINE = 1,
    ERROR = 2,
    SKIPPED = 3,
    POSTPONED = 4,
    0 = "OFFLINE",
    1 = "ONLINE",
    2 = "ERROR",
    3 = "SKIPPED",
    4 = "POSTPONED"
}

/**
 * Constructor - Initializes an object which represents a user steam account
 * @param controller - Reference to the controller object
 * @param index - The index of this account in the logininfo object
 * @param proxyIndex - The index of the proxy in DataManager proxies to use for this instance
 */
declare class Bot {
    constructor(controller: Controller, index: number, proxyIndex: number);
    /**
     * Reference to the controller object
     */
    controller: Controller;
    /**
     * Reference to the DataManager object
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
     * Username of this bot account
     */
    accountName: string;
    /**
     * Stores the timestamp and reason of the last disconnect. This is used by handleRelog() to take proper action
     */
    lastDisconnect: any;
    /**
     * This SteamUser instance
     */
    user: SteamUser;
    /**
     * This SteamCommunity instance
     */
    community: SteamCommunity;
    /**
     * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
     * @param steamID64 - The steamID64 of the message sender
     * @param message - The message string provided by steam-user friendMessage event
     * @returns `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
     */
    checkMsgBlock(steamID64: any, message: string): boolean;
    /**
     * Attempts to check if this account has family view (feature to restrict features for child accounts) enabled
     * @returns Returns a Promise which resolves with a boolean, indicating whether family view is enabled or not. If request failed, `false` is returned.
     */
    checkForFamilyView(): Promise<boolean>;
    /**
     * Requests family view unlock key from user and attempts to unlock it
     * @returns Returns a Promise which resolves when done
     */
    unlockFamilyView(): Promise<void>;
    /**
     * Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)
     */
    handleLoginTimeout(): void;
    /**
     * Handles checking for missing game licenses, requests them and then starts playing
     */
    handleMissingGameLicenses(): void;
    /**
     * Changes the proxy of this bot account.
     * @param newProxyIndex - Index of the new proxy inside the DataManager.proxies array.
     */
    switchProxy(newProxyIndex: number): void;
    /**
     * Checks host internet connection, updates the status of all proxies checked >2.5 min ago and switches the proxy of this bot account if necessary.
     * @returns Resolves with a boolean indicating whether the proxy was switched when done. A relog is triggered when the proxy was switched.
     */
    checkAndSwitchMyProxy(): Promise<boolean>;
    /**
     * Attempts to get this account, after failing all logOnRetries, back online after some time. Does not apply to initial logins.
     */
    handleRelog(): void;
    /**
     * Our commandHandler respondModule implementation - Sends a message to a Steam user
     * @param _this - The Bot object context
     * @param resInfo - Object containing information passed to command by friendMessage event
     * @param txt - The text to send
     * @param retry - Internal: true if this message called itself again to send failure message
     * @param part - Internal: Index of which part to send for messages larger than 750 chars
     */
    sendChatMessage(_this: any, resInfo: resInfo, txt: string, retry: boolean, part: number): void;
    /**
     * Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.
     * @param steamID64 - The steamID64 of the user to read a message from
     * @param timeout - Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended)
     * @returns Resolved with `String` on response or `null` on timeout.
     */
    readChatMessage(steamID64: string, timeout: number): Promise<string | null>;
    /**
     * Accepts a group invite if acceptgroupinvites in the config is true
     */
    _attachSteamGroupRelationshipEvent(): void;
    /**
     * Checks if user is blocked, has an active cooldown for spamming or isn't a friend
     * @param steamID64 - The steamID64 of the message sender
     * @param message - The message string provided by steam-user friendMessage event
     * @returns `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled
     */
    checkMsgBlock(steamID64: any, message: string): boolean;
    /**
     * Attempts to check if this account has family view (feature to restrict features for child accounts) enabled
     * @returns Returns a Promise which resolves with a boolean, indicating whether family view is enabled or not. If request failed, `false` is returned.
     */
    checkForFamilyView(): Promise<boolean>;
    /**
     * Requests family view unlock key from user and attempts to unlock it
     * @returns Returns a Promise which resolves when done
     */
    unlockFamilyView(): Promise<void>;
    /**
     * Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)
     */
    handleLoginTimeout(): void;
    /**
     * Handles checking for missing game licenses, requests them and then starts playing
     */
    handleMissingGameLicenses(): void;
    /**
     * Changes the proxy of this bot account.
     * @param newProxyIndex - Index of the new proxy inside the DataManager.proxies array.
     */
    switchProxy(newProxyIndex: number): void;
    /**
     * Checks host internet connection, updates the status of all proxies checked >2.5 min ago and switches the proxy of this bot account if necessary.
     * @returns Resolves with a boolean indicating whether the proxy was switched when done. A relog is triggered when the proxy was switched.
     */
    checkAndSwitchMyProxy(): Promise<boolean>;
    /**
     * Attempts to get this account, after failing all logOnRetries, back online after some time. Does not apply to initial logins.
     */
    handleRelog(): void;
    /**
     * Our commandHandler respondModule implementation - Sends a message to a Steam user
     * @param _this - The Bot object context
     * @param resInfo - Object containing information passed to command by friendMessage event
     * @param txt - The text to send
     * @param retry - Internal: true if this message called itself again to send failure message
     * @param part - Internal: Index of which part to send for messages larger than 750 chars
     */
    sendChatMessage(_this: any, resInfo: resInfo, txt: string, retry: boolean, part: number): void;
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
 * @property names - All names that should trigger this command
 * @property description - Description of what this command does
 * @property args - Array of objects containing information about each parameter supported by this command
 * @property ownersOnly - Set to true to only allow owners to use this command.
 * @property run - Function that will be executed when the command runs. Arguments: commandHandler, args, steamID64, respondModule, context, resInfo
 */
declare type Command = {
    names: string[];
    description: string;
    args: CommandArg[];
    ownersOnly: boolean;
    run: (...params: any[]) => any;
};

/**
 * @property name - Name of this argument. Use common phrases like "ID" or "amount" if possible. If a specific word is expected, put the word inside quotation marks.
 * @property description - Description of this argument
 * @property type - Expected datatype of this argument. If read from a chat it will usually be "string"
 * @property isOptional - True if this argument is optional, false if it must be provided. Make sure to check for missing arguments and return an error if false.
 * @property ownersOnly - True if this argument is only allowed to be provided by owners set in the config. If the command itself is `ownersOnly`, set this property to `true` as well.
 */
declare type CommandArg = {
    name: string;
    description: string;
    type: string;
    isOptional: boolean;
    ownersOnly: boolean;
};

/**
 * Constructor - Initializes the commandHandler which allows you to integrate core commands into your plugin or add new commands from your plugin.
 * @param controller - Reference to the current controller object
 */
declare class CommandHandler {
    constructor(controller: Controller);
    /**
     * Array of objects, where each object represents a registered command
     */
    commands: Command[];
    /**
     * Registers a new command during runtime
     * @param command - The command object to register
     * @returns true if the command was successfully registered, false otherwise
     */
    registerCommand(command: Command): boolean;
    /**
     * The name of the command to unregister during runtime
     * @param commandName - Name of the command to unregister
     * @returns `true` if the command was successfully unregistered, `false` otherwise
     */
    unregisterCommand(commandName: string): boolean;
    /**
     * Finds a loaded command by name and runs it
     * @param name - The name of the command
     * @param args - Array of arguments that will be passed to the command
     * @param respondModule - Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
     * @param context - The context (`this.`) of the object calling this command. Will be passed to respondModule() as first parameter to make working in this function easier.
     * @param resInfo - Object containing additional information
     * @returns Returns an object indicating whether the command was found and executed or not. If success is `false`, a reason and corresponding message will be provided which can be sent to the user.
     */
    runCommand(name: string, args: any[], respondModule: (...params: any[]) => any, context: any, resInfo: resInfo): any;
    /**
     * Reloads all core commands. Does NOT reload commands registered at runtime. Please consider reloading the pluginSystem as well.
     */
    reloadCommands(): void;
    /**
     * Calculates command suggestions using the Jaro Winkler distance of `input` to all registered commands
     * @param input - String to get the nearest registered commands of
     * @returns Returns a sorted Array of Objects, containing the command name and closeness in percent of name to `input` of every registered command
     */
    calculateCommandSuggestions(input: string): { name: string; closeness: number; }[];
    /**
     * Calculates command suggestions using the Jaro Winkler distance of `input` to all registered commands
     * @param input - String to get the nearest registered commands of
     * @returns Returns a sorted Array of Objects, containing the command name and closeness in percent of name to `input` of every registered command
     */
    calculateCommandSuggestions(input: string): { name: string; closeness: number; }[];
}

/**
 * @property [cmdprefix] - Prefix your command execution handler uses. This will be used in response messages referencing commands. Default: !
 * @property userID - ID of the user who executed this command. Will be used for command default behavior (e.g. commenting on the requester's profile), to check for owner privileges, apply cooldowns and maybe your respondModule implementation for responding. Strongly advised to include.
 * @property [ownerIDs] - Can be provided to overwrite `config.ownerid` for owner privilege checks. Useful if you are implementing a different platform and so `userID` won't be a steamID64 (e.g. discord)
 * @property [charLimit] - Supported by the Steam Chat Message handler: Overwrites the default index from which response messages will be cut up into parts
 * @property [cutChars] - Custom chars to search after for cutting string in parts to overwrite cutStringsIntelligently's default: [" ", "\n", "\r"]
 * @property [fromSteamChat] - Set to true if your command handler is receiving messages from the Steam Chat and `userID` is therefore a `steamID64`. Will be used to enable command default behavior (e.g. commenting on the requester's profile)
 * @property [prefix] - Do not provide this argument, you'll receive it from commands: Steam Chat Message prefixes like /me. Can be ignored or translated to similar prefixes your platform might support
 */
declare type resInfo = {
    cmdprefix?: string;
    userID: string;
    ownerIDs?: string[];
    charLimit?: number;
    cutChars?: string[];
    fromSteamChat?: boolean;
    prefix?: string;
};

/**
 * Logs request errors
 * @param error - The error string returned by steamcommunity
 * @param commandHandler - The commandHandler object
 * @param bot - Bot object of the account making this request
 * @param id - steamID64 of the receiving entity
 */
declare function logRequestError(error: string, commandHandler: CommandHandler, bot: Bot, id: string): void;

/**
 * Groups same error messages together, counts amount, lists affected bots and converts it to a String.
 * @param obj - failedcomments object that should be converted
 * @returns String that looks like this: `amount`x - `indices`\n`error message`
 */
declare function failedObjToString(obj: any): string;

/**
 * Checks if the following request process iteration should be skipped
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by syncLoop() to control request loop
 * @param bot - Bot object of the account fulfilling this interaction
 * @param receiverSteamID64 - steamID64 of the receiving user/group
 * @returns true if iteration should continue, false if iteration should be skipped using return
 */
declare function handleIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, receiverSteamID64: string): boolean;

/**
 * Constructor - Initializes the controller and starts all bot accounts
 */
declare class Controller {
    constructor();
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
     * Collection of miscellaneous functions for easier access
     */
    misc: undefined;
    /**
     * Collection of various misc parameters
     */
    info: any;
    /**
     * Stores all recent comment, vote etc. requests
     */
    activeRequests: {
        [key: string]: { status: string; type: string; amount: number; quotesArr: string[] | undefined; requestedby: string; accounts: Bot[]; thisIteration: number; retryAttempt: number; amountBeforeRetry: number | undefined; until: number; ipCooldownPenaltyAdded: boolean | undefined; failed: object; };
    };
    /**
     * The dataManager object
     */
    data: DataManager;
    /**
     * The updater object
     */
    updater: undefined;
    /**
     * The JobManager handles the periodic execution of functions which you can register at runtime
     */
    jobManager: JobManager;
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
     * @param data - Optional: Stringified restartdata object that will be kept through restarts
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
     * Adds a new account to the set of bot accounts in use and writes changes to accounts.txt
     * @param accountName - Username of the account
     * @param password - Password of the account
     * @param [sharedSecret] - Optional: Shared secret of the account
     */
    addAccount(accountName: string, password: string, sharedSecret?: string): void;
    /**
     * Removes an account from the active set of bot accounts and writes changes to accounts.txt
     * @param accountName - Username of the account to remove
     */
    removeAccount(accountName: string): void;
    /**
     * Relogs an account
     * @param accountName - Username of the account to relog
     */
    relogAccount(accountName: string): void;
    /**
     * Reloads and respreads all proxies and relogs affected accounts
     */
    respreadProxies(): void;
    /**
     * Filters the active set of bot accounts by a given criteria
     * @param predicate - Function that returns true if the account should be included in the result
     * @returns Array of bot instances that match the criteria
     */
    filterAccounts(predicate: (...params: any[]) => any): Bot[];
    /**
     * Set of premade functions for filterAccounts()
     */
    filters: any;
    /**
     * Check if all friends are in lastcomment database
     * @param bot - Bot object of the account to check
     */
    checkLastcommentDB(bot: Bot): void;
    /**
     * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
     * @param bot - Bot object of the account to check
     * @param callback - Called with `remaining` (Number) on success or `null` on failure
     */
    friendListCapacityCheck(bot: Bot, callback: (...params: any[]) => any): void;
    /**
     * Retrieves all matching bot accounts and returns them.
     * @param [statusFilter = EStatus.ONLINE] - Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
     * @param [mapToObject = false] - Optional: If true, an object will be returned where every bot object is mapped to their accountName.
     * @returns An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.
     */
    getBots(statusFilter?: EStatus | EStatus[] | string, mapToObject?: boolean): Bot[];
    /**
     * Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.
     * @param [filterOffline = false] - Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand!
     * @returns Bot accounts mapped to their associated proxy
     */
    getBotsPerProxy(filterOffline?: boolean): { bots: Bot[]; proxy: string; proxyIndex: number; isOnline: boolean; lastOnlineCheck: number; }[];
    /**
     * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
     * Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.
     * @param str - The profileID argument provided by the user
     * @param expectedIdType - The type of SteamID expected or `null` if type should be assumed.
     * @param callback - Called with `err` (String or null), `id` (String or null), `idType` (String or null) parameters on completion. The `id` param has the format `userID/appID` for type review and full input url for type discussion.
     */
    handleSteamIdResolving(str: string, expectedIdType: EIdTypes, callback: (...params: any[]) => any): void;
    /**
     * Logs text to the terminal and appends it to the output.txt file.
     * @param type - String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
     * @param str - The text to log into the terminal
     * @param nodate - Setting to true will hide date and time in the message
     * @param remove - Setting to true will remove this message with the next one
     * @param animation - Array containing animation frames as elements
     * @param printNow - Ignores the readyafterlogs check and force prints the message now
     * @param cutToWidth - Cuts the string to the width of the terminal
     */
    logger(type: string, str: string, nodate: boolean, remove: boolean, animation: string[], printNow: boolean, cutToWidth: boolean): void;
    /**
     * Check if all friends are in lastcomment database
     * @param bot - Bot object of the account to check
     */
    checkLastcommentDB(bot: Bot): void;
    /**
     * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
     * @param bot - Bot object of the account to check
     * @param callback - Called with `remaining` (Number) on success or `null` on failure
     */
    friendListCapacityCheck(bot: Bot, callback: (...params: any[]) => any): void;
    /**
     * Retrieves all matching bot accounts and returns them.
     * @param [statusFilter = EStatus.ONLINE] - Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
     * @param [mapToObject = false] - Optional: If true, an object will be returned where every bot object is mapped to their accountName.
     * @returns An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.
     */
    getBots(statusFilter?: EStatus | EStatus[] | string, mapToObject?: boolean): Bot[];
    /**
     * Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.
     * @param [filterOffline = false] - Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand!
     * @returns Bot accounts mapped to their associated proxy
     */
    getBotsPerProxy(filterOffline?: boolean): { bots: Bot[]; proxy: string; proxyIndex: number; isOnline: boolean; lastOnlineCheck: number; }[];
    /**
     * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
     * Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.
     * @param str - The profileID argument provided by the user
     * @param expectedIdType - The type of SteamID expected or `null` if type should be assumed.
     * @param callback - Called with `err` (String or null), `id` (String or null), `idType` (String or null) parameters on completion. The `id` param has the format `userID/appID` for type review and full input url for type discussion.
     */
    handleSteamIdResolving(str: string, expectedIdType: EIdTypes, callback: (...params: any[]) => any): void;
    /**
     * Logs text to the terminal and appends it to the output.txt file.
     * @param type - String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
     * @param str - The text to log into the terminal
     * @param nodate - Setting to true will hide date and time in the message
     * @param remove - Setting to true will remove this message with the next one
     * @param animation - Array containing animation frames as elements
     * @param printNow - Ignores the readyafterlogs check and force prints the message now
     * @param cutToWidth - Cuts the string to the width of the terminal
     */
    logger(type: string, str: string, nodate: boolean, remove: boolean, animation: string[], printNow: boolean, cutToWidth: boolean): void;
    /**
     * Attempts to log in all bot accounts which are currently offline one after another.
     * Creates a new bot object for every new account and reuses existing one if possible
     * @param firstLogin - Is set to true by controller if this is the first login to display more information
     */
    login(firstLogin: boolean): void;
    /**
     * Adds a new account to the set of bot accounts in use and writes changes to accounts.txt
     * @param accountName - Username of the account
     * @param password - Password of the account
     * @param [sharedSecret] - Optional: Shared secret of the account
     */
    addAccount(accountName: string, password: string, sharedSecret?: string): void;
    /**
     * Removes an account from the active set of bot accounts and writes changes to accounts.txt
     * @param accountName - Username of the account to remove
     */
    removeAccount(accountName: string): void;
    /**
     * Relogs an account
     * @param accountName - Username of the account to relog
     */
    relogAccount(accountName: string): void;
    /**
     * Reloads and respreads all proxies and relogs affected accounts
     */
    respreadProxies(): void;
    /**
     * Filters the active set of bot accounts by a given criteria
     * @param predicate - Function that returns true if the account should be included in the result
     * @returns Array of bot instances that match the criteria
     */
    filterAccounts(predicate: (...params: any[]) => any): Bot[];
    /**
     * Set of premade functions for filterAccounts()
     */
    filters: any;
}

/**
 * ID types supported by this resolver
 */
declare const enum EIdTypes {
    profile = "profile",
    group = "group",
    sharedfile = "sharedfile",
    discussion = "discussion",
    curator = "curator",
    review = "review"
}

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
 * Converts a timestamp to a human-readable "until from now" format. Does not care about past/future.
 * @param timestamp - UNIX timestamp to convert
 * @returns "x seconds/minutes/hours/days"
 */
declare function timeToString(timestamp: number): string;

/**
 * Pings a **https** URL to check if the service and this internet connection is working
 * @param url - The URL of the service to check
 * @param [throwTimeout = false] - If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
 * @param [proxy] - Provide a proxy if the connection check should be made through a proxy instead of the local connection
 * @returns Resolves on response code 2xx and rejects on any other response code. Both are called with parameter `response` (Object) which has a `statusMessage` (String) and `statusCode` (Number) key. `statusCode` is `null` if request failed.
 */
declare function checkConnection(url: string, throwTimeout?: boolean, proxy?: any): Promise<{ statusMessage: string; statusCode: number | null; }>;

/**
 * Splits a HTTP proxy URL into its parts
 * @param url - The HTTP proxy URL
 * @returns Object containing the proxy parts
 */
declare function splitProxyString(url: string): any;

/**
 * Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.
 * It is used by the steamChatInteraction helper but can be used in plugins as well.
 * @param txt - The string to cut
 * @param limit - Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount.
 * @param cutChars - Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"]
 * @param threshold - Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length
 * @returns Returns all parts of the string in an array
 */
declare function cutStringsIntelligently(txt: string, limit: number, cutChars: string[], threshold: number): any[];

/**
 * Attempts to reinstall all modules
 * @param logger - The currently used logger function (real or fake, the caller decides)
 * @param callback - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
declare function reinstallAll(logger: (...params: any[]) => any, callback: (...params: any[]) => any): void;

/**
 * Updates all installed packages to versions listed in package.json from the project root directory.
 * @param callback - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
declare function update(callback: (...params: any[]) => any): void;

/**
 * Updates all installed packages to versions listed in package.json
 * @param path - Custom path to read package.json from and install packages to
 * @param callback - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion
 */
declare function updateFromPath(path: string, callback: (...params: any[]) => any): void;

/**
 * Installs the latest version available on NPM for an array of packages. Updating core dependencies might cause untested behavior, be careful.
 * @param packages - Array of package names to install the latest version of
 * @returns Resolves when done or rejects on failure
 */
declare function installLatest(packages: string[]): Promise<void>;

declare type logOnOptions = any;

/**
 * Constructor - The dataManager system imports, checks, handles errors and provides a file updating service for all configuration files
 * @param controller - Reference to the controller object
 */
declare class DataManager {
    constructor(controller: Controller);
    /**
     * Checks currently loaded data for validity and logs some recommendations for a few settings.
     * @returns Resolves with `null` when all settings have been accepted, or with a string containing reasons if a setting has been reset. On reject you should terminate the application. It is called with a String specifying the failed check.
     */
    checkData(): Promise<null | string>;
    /**
     * Writes (all) files imported by DataManager back to the disk
     */
    writeAllFilesToDisk(): void;
    /**
     * Writes cachefile to cache.json on disk
     */
    writeCachefileToDisk(): void;
    /**
     * Writes datafile to data.json on disk
     */
    writeDatafileToDisk(): void;
    /**
     * Writes config to config.json on disk
     */
    writeConfigToDisk(): void;
    /**
     * Writes advancedconfig to advancedconfig.json on disk
     */
    writeAdvancedconfigToDisk(): void;
    /**
     * Writes logininfo to logininfo.json and accounts.txt on disk, depending on which of the files exist
     */
    writeLogininfoToDisk(): void;
    /**
     * Writes proxies to proxies.txt on disk
     */
    writeProxiesToDisk(): void;
    /**
     * Writes quotes to quotes.txt on disk
     */
    writeQuotesToDisk(): void;
    /**
     * Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importCacheFromDisk(): Promise<object>;
    /**
     * Loads data.json from disk, updates datafile property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importDataFromDisk(): Promise<object>;
    /**
     * Loads config.json from disk, updates config property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importConfigFromDisk(): Promise<object>;
    /**
     * Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importAdvancedConfigFromDisk(): Promise<object>;
    /**
     * Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importLogininfoFromDisk(): Promise<object[]>;
    /**
     * Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importProxiesFromDisk(): Promise<object[]>;
    /**
     * Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importQuotesFromDisk(): Promise<string[]>;
    /**
     * Loads languages from disk, updates languages property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importLanguagesFromDisk(): Promise<object>;
    /**
     * Loads customlang.json from disk, updates languages property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importCustomLangFromDisk(): Promise<object>;
    /**
     * Loads all config & data files from disk and handles potential errors
     * @returns Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importFromDisk(): Promise<void>;
    /**
     * Verifies the data integrity of every source code file in the project by comparing its checksum.
     * This function is used to verify the integrity of every module loaded AFTER the controller & DataManager. Both of those need manual checkAndGetFile() calls to import, which is handled by the Controller.
     * If an already loaded file needed to be recovered then the bot will restart to load these changes.
     * @returns Resolves when all files have been checked and, if necessary, restored. Does not resolve if the bot needs to be restarted.
     */
    verifyIntegrity(): Promise<void>;
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
     * Stores all supported languages and their strings used for responding to a user.
     * All default strings have already been replaced with corresponding matches from `customlang.json`.
     */
    lang: {
        [key: string]: {
            [key: string]: string;
        };
    };
    /**
     * Stores all quotes used for commenting provided via the `quotes.txt` file.
     */
    quotes: string[];
    /**
     * Stores all proxies provided via the `proxies.txt` file.
     */
    proxies: { proxy: string; proxyIndex: number; isOnline: boolean; lastOnlineCheck: number; }[];
    /**
     * Stores IDs from config files converted at runtime and backups for all config & data files.
     */
    cachefile: any;
    /**
     * Stores the login information for every bot account provided via the `logininfo.json` or `accounts.txt` files.
     */
    logininfo: logOnOptions[];
    /**
     * Database which stores the timestamp of the last request of every user. This is used to enforce `config.unfriendTime`.
     * Document structure: { id: string, time: Number }
     */
    lastCommentDB: Nedb;
    /**
     * Database which stores information about which bot accounts have fulfilled one-time requests (vote, fav, follow). This allows us to filter without pinging Steam for every account on every request.
     * Document structure: { id: string, accountName: string, type: string, time: Number }
     */
    ratingHistoryDB: Nedb;
    /**
     * Database which stores the refreshTokens for all bot accounts.
     * Document structure: { accountName: string, token: string }
     */
    tokensDB: Nedb;
    /**
     * Database which stores user specific settings, for example the language set
     * Document structure: { id: string, lang: string }
     */
    userSettingsDB: Nedb;
    /**
     * Checks currently loaded data for validity and logs some recommendations for a few settings.
     * @returns Resolves with `null` when all settings have been accepted, or with a string containing reasons if a setting has been reset. On reject you should terminate the application. It is called with a String specifying the failed check.
     */
    checkData(): Promise<null | string>;
    /**
     * Writes (all) files imported by DataManager back to the disk
     */
    writeAllFilesToDisk(): void;
    /**
     * Writes cachefile to cache.json on disk
     */
    writeCachefileToDisk(): void;
    /**
     * Writes datafile to data.json on disk
     */
    writeDatafileToDisk(): void;
    /**
     * Writes config to config.json on disk
     */
    writeConfigToDisk(): void;
    /**
     * Writes advancedconfig to advancedconfig.json on disk
     */
    writeAdvancedconfigToDisk(): void;
    /**
     * Writes logininfo to logininfo.json and accounts.txt on disk, depending on which of the files exist
     */
    writeLogininfoToDisk(): void;
    /**
     * Writes proxies to proxies.txt on disk
     */
    writeProxiesToDisk(): void;
    /**
     * Writes quotes to quotes.txt on disk
     */
    writeQuotesToDisk(): void;
    /**
     * Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importCacheFromDisk(): Promise<object>;
    /**
     * Loads data.json from disk, updates datafile property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importDataFromDisk(): Promise<object>;
    /**
     * Loads config.json from disk, updates config property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importConfigFromDisk(): Promise<object>;
    /**
     * Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importAdvancedConfigFromDisk(): Promise<object>;
    /**
     * Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importLogininfoFromDisk(): Promise<object[]>;
    /**
     * Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importProxiesFromDisk(): Promise<object[]>;
    /**
     * Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importQuotesFromDisk(): Promise<string[]>;
    /**
     * Loads languages from disk, updates languages property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importLanguagesFromDisk(): Promise<object>;
    /**
     * Loads customlang.json from disk, updates languages property in DataManager and handles potential errors
     * @returns Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importCustomLangFromDisk(): Promise<object>;
    /**
     * Loads all config & data files from disk and handles potential errors
     * @returns Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    importFromDisk(): Promise<void>;
    /**
     * Verifies the data integrity of every source code file in the project by comparing its checksum.
     * This function is used to verify the integrity of every module loaded AFTER the controller & DataManager. Both of those need manual checkAndGetFile() calls to import, which is handled by the Controller.
     * If an already loaded file needed to be recovered then the bot will restart to load these changes.
     * @returns Resolves when all files have been checked and, if necessary, restored. Does not resolve if the bot needs to be restarted.
     */
    verifyIntegrity(): Promise<void>;
    /**
     * Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)
     */
    processData(): void;
    /**
     * Checks if a proxy can reach steamcommunity.com and updates its isOnline and lastOnlineCheck
     * @param proxyIndex - Index of the proxy to check in the DataManager proxies array
     * @returns True if the proxy can reach steamcommunity.com, false otherwise.
     */
    checkProxy(proxyIndex: number): boolean;
    /**
     * Checks all proxies if they can reach steamcommunity.com and updates their entries
     * @param [ignoreLastCheckedWithin = 0] - Ignore proxies that have already been checked in less than `ignoreLastCheckedWithin` ms
     * @returns Resolves when all proxies have been checked
     */
    checkAllProxies(ignoreLastCheckedWithin?: number): Promise<void>;
    /**
     * Retrieves a language string from one of the available language files and replaces keywords if desired.
     * If a userID is provided it will lookup which language the user has set. If nothing is set, the default language set in the config will be returned.
     * @param str - Name of the language string to be retrieved
     * @param [replace] - Optional: Object containing keywords in the string to replace. Pass the keyword as key and the corresponding value to replace as value.
     * @param [userIDOrLanguage] - Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language.
     * @returns Returns a promise that resolves with the language string or `null` if it could not be found.
     */
    getLang(str: string, replace?: {
        [key: string]: string;
    }, userIDOrLanguage?: string): Promise<string | null>;
    /**
     * Gets a random quote
     * @param quotesArr - Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
     * @returns Resolves with `quote` (string)
     */
    getQuote(quotesArr: any[]): Promise<string>;
    /**
     * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
     * @param id - ID of the user to look up
     * @returns Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as string), `untilStr` (Wait until as string). If id wasn't found, `null` will be returned.
     */
    getUserCooldown(id: string): Promise<{ lastRequest: number; until: number; lastRequestStr: string; untilStr: string; } | null>;
    /**
     * Updates or inserts timestamp of a user
     * @param id - ID of the user to update
     * @param timestamp - Unix timestamp of the last interaction the user received
     */
    setUserCooldown(id: string, timestamp: number): void;
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
    decodeJWT(token: string): any | null;
    /**
     * Refreshes Backups in cache.json with new data
     */
    refreshCache(): void;
    /**
     * Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)
     */
    processData(): void;
    /**
     * Checks if a proxy can reach steamcommunity.com and updates its isOnline and lastOnlineCheck
     * @param proxyIndex - Index of the proxy to check in the DataManager proxies array
     * @returns True if the proxy can reach steamcommunity.com, false otherwise.
     */
    checkProxy(proxyIndex: number): boolean;
    /**
     * Checks all proxies if they can reach steamcommunity.com and updates their entries
     * @param [ignoreLastCheckedWithin = 0] - Ignore proxies that have already been checked in less than `ignoreLastCheckedWithin` ms
     * @returns Resolves when all proxies have been checked
     */
    checkAllProxies(ignoreLastCheckedWithin?: number): Promise<void>;
    /**
     * Retrieves a language string from one of the available language files and replaces keywords if desired.
     * If a userID is provided it will lookup which language the user has set. If nothing is set, the default language set in the config will be returned.
     * @param str - Name of the language string to be retrieved
     * @param [replace] - Optional: Object containing keywords in the string to replace. Pass the keyword as key and the corresponding value to replace as value.
     * @param [userIDOrLanguage] - Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language.
     * @returns Returns a promise that resolves with the language string or `null` if it could not be found.
     */
    getLang(str: string, replace?: {
        [key: string]: string;
    }, userIDOrLanguage?: string): Promise<string | null>;
    /**
     * Gets a random quote
     * @param quotesArr - Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used.
     * @returns Resolves with `quote` (string)
     */
    getQuote(quotesArr: any[]): Promise<string>;
    /**
     * Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.
     * @param id - ID of the user to look up
     * @returns Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as string), `untilStr` (Wait until as string). If id wasn't found, `null` will be returned.
     */
    getUserCooldown(id: string): Promise<{ lastRequest: number; until: number; lastRequestStr: string; untilStr: string; } | null>;
    /**
     * Updates or inserts timestamp of a user
     * @param id - ID of the user to update
     * @param timestamp - Unix timestamp of the last interaction the user received
     */
    setUserCooldown(id: string, timestamp: number): void;
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
    decodeJWT(token: string): any | null;
    /**
     * Refreshes Backups in cache.json with new data
     */
    refreshCache(): void;
}

/**
 * @property name - Name of the job
 * @property [description] - Optional: Description of the job
 * @property func - Function which will be executed
 * @property interval - Number in milliseconds to wait between executions of func. Minimum value is 250ms!
 * @property [runOnRegistration] - Set to true to run the job once instantly after registration
 * @property [_lastExecTimestamp] - Internal: Timestamp of the last execution of func. Do not set this value, it is managed by the JobManager internally.
 * @property [_registeredAt] - Internal: Timestamp of when this job was registered. Do not set this value, it is managed by the JobManager internally.
 */
declare type Job = {
    name: string;
    description?: string;
    func: (...params: any[]) => any;
    interval: number;
    runOnRegistration?: boolean;
    _lastExecTimestamp?: number;
    _registeredAt?: number;
};

/**
 * Constructor - The jobManager handles running and managing interval based functions (jobs), like update checks, cleanups, etc.
 * @param controller - Reference to the controller object
 */
declare class JobManager {
    constructor(controller: Controller);
    /**
     * Reference to the controller object
     */
    controller: Controller;
    /**
     * Collection of all registered jobs
     */
    jobs: Job[];
    /**
     * Registers a job
     * @param job - Object of the job to register
     * @returns Returns `null` on success or `err` on failure, specifying the reason why.
     */
    registerJob(job: Job): Error | null;
    /**
     * Unregisters a job
     * @param name - Name of the job to unregister
     * @returns Returns `null` on success or `err` on failure, specifying the reason why.
     */
    unregisterJob(name: string): Error | null;
}

/**
 * @property load - Called on Plugin load
 * @property unload - Called on Plugin unload
 * @property ready - Controller ready event
 * @property statusUpdate - Controller statusUpdate event
 * @property steamGuardInput - Controller steamGuardInput event
 * @property steamGuardQrCode - Controller steamGuardQrCode event
 * @property dataUpdate - Controller dataUpdate event
 */
declare type Plugin = {
    load: (...params: any[]) => any;
    unload: (...params: any[]) => any;
    ready: (...params: any[]) => any;
    statusUpdate: (...params: any[]) => any;
    steamGuardInput: (...params: any[]) => any;
    steamGuardQrCode: (...params: any[]) => any;
    dataUpdate: (...params: any[]) => any;
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
     * Reloads a plugin and calls ready event after ~2.5 seconds.
     * @param pluginName - Name of the plugin package to reload
     */
    reloadPlugin(pluginName: string): void;
    /**
     * Reloads all plugins and calls ready event after ~2.5 seconds.
     */
    reloadPlugins(): void;
    /**
     * Central part of the application and your interface to everything
     */
    controller: Controller;
    /**
     * References to all plugin objects
     */
    pluginList: {
        [key: string]: Plugin;
    };
    /**
     * Manages all registered commands and gives you access to them
     */
    commandHandler: CommandHandler;
    /**
     * Manages and runs all jobs and lets you register your own
     */
    jobManager: JobManager;
    /**
     * Helper function - Get a list of all installed plugins
     * @returns Array of arrays containing package name & version of all installed plugins
     */
    getInstalledPlugins(): string[][];
    /**
     * Helper function - Get a list of all active (loaded) plugins
     * @returns Array of arrays containing package name & version of all active (loaded) plugins
     */
    getActivePlugins(): string[][];
    /**
     * Reloads a plugin and calls ready event after ~2.5 seconds.
     * @param pluginName - Name of the plugin package to reload
     */
    reloadPlugin(pluginName: string): void;
    /**
     * Reloads all plugins and calls ready event after ~2.5 seconds.
     */
    reloadPlugins(): void;
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
     * Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.
     * @returns Resolves with `true` if a valid token was found, `false` otherwise
     */
    hasStorageValidToken(): Promise<boolean>;
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
     * Attempts to renew the refreshToken used for the current session. Whether a new token will actually be issued is at the discretion of Steam.
     * @returns Returns a promise which resolves with `true` if Steam issued a new token, `false` otherwise. Rejects if no token is stored in the database.
     */
    attemptTokenRenew(): Promise<boolean>;
    /**
     * Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.
     * @returns Resolves with `true` if a valid token was found, `false` otherwise
     */
    hasStorageValidToken(): Promise<boolean>;
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
 * Checks for an available update from the GitHub repo
 * @param datafile - The current `data.json` file from the DataManager
 * @param branch - Which branch you want to check. Defaults to the current branch set in `data.json`
 * @param forceUpdate - If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
 * @param callback - Called with `updateFound` (Boolean) and `data` (Object) on completion. `updatefound` will be false if the check should fail. `data` includes the full data.json file found online.
 */
declare function check(datafile: any, branch: string, forceUpdate: boolean, callback: (...params: any[]) => any): void;

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
    run(forceUpdate: boolean, respondModule: (...params: any[]) => any, resInfo: resInfo): Promise<boolean>;
}

