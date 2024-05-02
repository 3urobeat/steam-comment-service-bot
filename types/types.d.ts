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
     * Calls SteamUser logOn() for this account. This will either trigger the SteamUser loggedOn or error event.
     */
    _loginToSteam(): void;
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
 * @property description - Description of what this command does
 * @property args - Array of objects containing information about each parameter supported by this command
 * @property ownersOnly - Set to true to only allow owners to use this command.
 * @property run - Function that will be executed when the command runs. Arguments: commandHandler, args, steamID64, respondModule, context, resInfo
 */
declare type Command = {
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
     * Internal: Imports core commands on startup
     * @returns Resolved when all commands have been imported
     */
    _importCoreCommands(): Promise<void>;
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
     * @returns `true` if command was found, `false` if not
     */
    runCommand(name: string, args: any[], respondModule: (...params: any[]) => any, context: any, resInfo: resInfo): boolean;
    /**
     * Reloads all core commands. Does NOT reload commands registered at runtime. Please consider reloading the pluginSystem as well.
     */
    reloadCommands(): void;
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
 * Internal: Do the actual commenting, activeRequests entry with all relevant information was processed by the comment command function above.
 * @param commandHandler - The commandHandler object
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - The shortened respondModule call
 * @param postComment - The correct postComment function for this idType. Context from the correct bot account is being applied later.
 * @param commentArgs - All arguments this postComment function needs, without callback. It will be applied and a callback added as last param. Include a key called "quote" to dynamically replace it with a random quote.
 * @param receiverSteamID64 - steamID64 of the profile to receive the comments
 */
declare function comment(commandHandler: CommandHandler, resInfo: CommandHandler.resInfo, respond: (...params: any[]) => any, postComment: (...params: any[]) => any, commentArgs: any, receiverSteamID64: string): void;

/**
 * Processes a up-/down-/funnyvote request
 * @param origin - Type of vote requested
 * @param commandHandler - The commandHandler object
 * @param args - Array of arguments that will be passed to the command
 * @param respondModule - Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
 * @param context - The context (this.) of the object calling this command. Will be passed to respondModule() as first parameter.
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 */
declare function processVoteRequest(origin: "upvote" | "downvote" | "funnyvote", commandHandler: CommandHandler, args: any[], respondModule: (...params: any[]) => any, context: any, resInfo: CommandHandler.resInfo): void;

/**
 * Helper function: Gets the visibility status of a profile and appends it to idType
 * @param commandHandler - The commandHandler object
 * @param steamID64 - The steamID64 of the profile to check
 * @param type - Type of steamID64, determined by handleSteamIdResolving(). Must be "profile", otherwise callback will be called instantly with this type param, unchanged.
 * @param callback - Called on completion with your new idType
 */
declare function getVisibilityStatus(commandHandler: CommandHandler, steamID64: string, type: string, callback: (...params: any[]) => any): void;

/**
 * Retrieves arguments from a comment request. If request is invalid (for example too many comments requested) an error message will be sent
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - The shortened respondModule call
 * @returns Resolves promise with object containing all relevant data when done
 */
declare function getCommentArgs(commandHandler: CommandHandler, args: any[], resInfo: CommandHandler.resInfo, respond: (...params: any[]) => any): Promise<{ maxRequestAmount: number; commentcmdUsage: string; numberOfComments: number; profileID: string; idType: string; quotesArr: string[]; }>;

/**
 * Finds all needed and currently available bot accounts for a comment request.
 * @param commandHandler - The commandHandler object
 * @param numberOfComments - Number of requested comments
 * @param canBeLimited - If the accounts are allowed to be limited
 * @param idType - Type of the request. This can either be "profile(PrivacyState)", "group", "sharedfile", "discussion" or "review". This is used to determine if limited accs need to be added first.
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
 * @returns Resolves with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
declare function getAvailableBotsForFavorizing(commandHandler: CommandHandler, amount: number | "all", id: string, favType: string): Promise<{ amount: number; availableAccounts: string[]; whenAvailable: number; whenAvailableStr: string; }>;

/**
 * Retrieves arguments from a follow request. If request is invalid, an error message will be sent
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param cmd - Either "upvote", "downvote", "favorite" or "unfavorite", depending on which command is calling this function
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - The shortened respondModule call
 * @returns If the user provided a specific amount, amount will be a number. If user provided "all" or "max", it will be returned as an unmodified string for getVoteBots.js to handle
 */
declare function getFollowArgs(commandHandler: CommandHandler, args: any[], cmd: string, resInfo: CommandHandler.resInfo, respond: (...params: any[]) => any): Promise<{ amount: number | string; id: string; }>;

/**
 * Finds all needed and currently available bot accounts for a follow request.
 * @param commandHandler - The commandHandler object
 * @param amount - Amount of favs requested or "all" to get the max available amount
 * @param canBeLimited - If the accounts are allowed to be limited
 * @param id - The user id to follow
 * @param idType - Either "user" or "curator"
 * @param favType - Either "follow" or "unfollow", depending on which request this is
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @returns Resolves with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
declare function getAvailableBotsForFollowing(commandHandler: CommandHandler, amount: number | "all", canBeLimited: boolean, id: string, idType: string, favType: string, resInfo: CommandHandler.resInfo): Promise<{ amount: number; availableAccounts: string[]; whenAvailable: number; whenAvailableStr: string; }>;

/**
 * Retrieves arguments from a non-specific request without id processing
 * @param commandHandler - The commandHandler object
 * @param args - The command arguments
 * @param cmd - Either "upvote", "downvote", "favorite" or "unfavorite", depending on which command is calling this function
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @param respond - The shortened respondModule call
 * @returns If the user provided a specific amount, amount will be a number. If user provided "all" or "max", it will be returned as an unmodified string for getVoteBots.js to handle
 */
declare function getMiscArgs(commandHandler: CommandHandler, args: any[], cmd: string, resInfo: CommandHandler.resInfo, respond: (...params: any[]) => any): Promise<{ err: null | any; amountRaw: number | string; id: string; idType: string; }>;

/**
 * Finds all needed and currently available bot accounts for a vote request.
 * @param commandHandler - The commandHandler object
 * @param amount - Amount of votes requested or "all" to get the max available amount
 * @param id - The sharedfile id to vote on
 * @param voteType - Type of the request
 * @param resInfo - Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).
 * @returns Resolves with obj: `availableAccounts` contains all account names from bot object, `whenAvailable` is a timestamp representing how long to wait until accsNeeded accounts will be available and `whenAvailableStr` is formatted human-readable as time from now
 */
declare function getAvailableBotsForVoting(commandHandler: CommandHandler, amount: number | "all", id: string, voteType: "upvote" | "downvote" | "funnyvote", resInfo: CommandHandler.resInfo): Promise<{ amount: number; availableAccounts: string[]; whenAvailable: number; whenAvailableStr: string; }>;

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
 * Checks if the following follow process iteration should be skipped
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by misc.js syncLoop() helper
 * @param bot - Bot object of the account making this request
 * @param id - ID of the profile that receives the follow
 * @returns `true` if iteration should continue, `false` if iteration should be skipped using return
 */
declare function handleFollowIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, id: string): boolean;

/**
 * Logs follow errors
 * @param error - The error string returned by steam-community
 * @param commandHandler - The commandHandler object
 * @param bot - Bot object of the account making this request
 * @param id - ID of the profile that receives the follow
 */
declare function logFollowError(error: string, commandHandler: CommandHandler, bot: Bot, id: string): void;

/**
 * Helper function to sort failed object by comment number so that it is easier to read
 * @param failedObj - Current state of failed object
 */
declare function sortFailedCommentsObject(failedObj: any): void;

/**
 * Checks if the following vote process iteration should be skipped
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by misc.js syncLoop() helper
 * @param bot - Bot object of the account making this request
 * @param id - ID of the sharedfile that receives the votes
 * @returns `true` if iteration should continue, `false` if iteration should be skipped using return
 */
declare function handleVoteIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, id: string): boolean;

/**
 * Checks if the following favorite process iteration should be skipped
 * @param commandHandler - The commandHandler object
 * @param loop - Object returned by misc.js syncLoop() helper
 * @param bot - Bot object of the account making this request
 * @param id - ID of the sharedfile that receives the votes
 * @returns `true` if iteration should continue, `false` if iteration should be skipped using return
 */
declare function handleFavoriteIterationSkip(commandHandler: CommandHandler, loop: any, bot: Bot, id: string): boolean;

/**
 * Logs vote errors
 * @param error - The error string returned by steam-community
 * @param commandHandler - The commandHandler object
 * @param bot - Bot object of the account making this request
 * @param id - ID that receives the votes
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
     * Collection of various misc parameters
     */
    info: any;
    /**
     * Stores all recent comment, vote etc. requests
     */
    activeRequests: any;
    /**
     * Internal: Initializes the bot by importing data from the disk, running the updater and finally logging in all bot accounts.
     */
    _start(): void;
    /**
     * Internal: Loads all parts of the application to get IntelliSense support after the updater ran and calls login() when done.
     */
    _preLogin(): void;
    /**
     * The JobManager handles the periodic execution of functions which you can register at runtime
     */
    jobManager: JobManager;
    /**
     * The dataManager object
     */
    data: DataManager;
    /**
     * The updater object
     */
    updater: Updater;
    /**
     * Stores references to all bot account objects mapped to their accountName
     */
    bots: any;
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
     * Internal: Logs in accounts on different proxies synchronously
     * @param allAccounts - Array of logininfo entries of accounts to log in
     */
    _processFastLoginQueue(allAccounts: any[]): void;
    /**
     * Internal: Logs in accounts asynchronously to allow for user interaction
     * @param allAccounts - Array of logininfo entries of accounts to log in
     */
    _processSlowLoginQueue(allAccounts: any[]): void;
    /**
     * Runs internal ready event code and emits ready event for plugins
     */
    _readyEvent(): void;
    /**
     * Runs internal statusUpdate event code and emits statusUpdate event for plugins
     * @param bot - Bot instance
     * @param newStatus - The new status of this bot
     */
    _statusUpdateEvent(bot: Bot, newStatus: Bot.EStatus): void;
    /**
     * Emits steamGuardInput event for bot & plugins
     * @param bot - Bot instance of the affected account
     * @param submitCode - Function to submit a code. Pass an empty string to skip the account.
     */
    _steamGuardInputEvent(bot: Bot, submitCode: (...params: any[]) => any): void;
    /**
     * Emits steamGuardQrCode event for bot & plugins
     * @param bot - Bot instance of the affected account
     * @param challengeUrl - The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.
     */
    _steamGuardQrCodeEvent(bot: Bot, challengeUrl: string): void;
    /**
     * Check if all friends are in lastcomment database
     * @param bot - Bot object of the account to check
     */
    checkLastcommentDB(bot: Bot): void;
    /**
     * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
     * @param bot - Bot object of the account to check
     */
    friendListCapacityCheck(bot: Bot, callback: any): void;
    /**
     * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
     */
    _lastcommentUnfriendCheck(): void;
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
     * Internal: Handles process's unhandledRejection & uncaughtException error events.
     * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
     */
    _handleErrors(): void;
    /**
     * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
     * Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.
     * @param str - The profileID argument provided by the user
     * @param expectedIdType - The type of SteamID expected or `null` if type should be assumed.
     */
    handleSteamIdResolving(str: string, expectedIdType: EIdTypes, callback: any): void;
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
     * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
     * @param advancedconfig - The advancedconfig object imported by the DataManager
     */
    _loggerOptionsUpdateAfterConfigLoad(advancedconfig: any): void;
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
     * @param newStatus - The new status of this bot
     */
    _statusUpdateEvent(bot: Bot, newStatus: Bot.EStatus): void;
    /**
     * Emits steamGuardInput event for bot & plugins
     * @param bot - Bot instance of the affected account
     * @param submitCode - Function to submit a code. Pass an empty string to skip the account.
     */
    _steamGuardInputEvent(bot: Bot, submitCode: (...params: any[]) => any): void;
    /**
     * Emits steamGuardQrCode event for bot & plugins
     * @param bot - Bot instance of the affected account
     * @param challengeUrl - The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.
     */
    _steamGuardQrCodeEvent(bot: Bot, challengeUrl: string): void;
    /**
     * Check if all friends are in lastcomment database
     * @param bot - Bot object of the account to check
     */
    checkLastcommentDB(bot: Bot): void;
    /**
     * Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.
     * @param bot - Bot object of the account to check
     */
    friendListCapacityCheck(bot: Bot, callback: any): void;
    /**
     * Check for friends who haven't requested comments in config.unfriendtime days and unfriend them
     */
    _lastcommentUnfriendCheck(): void;
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
     * Internal: Handles process's unhandledRejection & uncaughtException error events.
     * Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function
     */
    _handleErrors(): void;
    /**
     * Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
     * Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.
     * @param str - The profileID argument provided by the user
     * @param expectedIdType - The type of SteamID expected or `null` if type should be assumed.
     */
    handleSteamIdResolving(str: string, expectedIdType: EIdTypes, callback: any): void;
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
     * Internal: Call this function after loading advancedconfig.json to set previously inaccessible options
     * @param advancedconfig - The advancedconfig object imported by the DataManager
     */
    _loggerOptionsUpdateAfterConfigLoad(advancedconfig: any): void;
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
    /**
     * Internal: Logs in accounts on different proxies synchronously
     * @param allAccounts - Array of logininfo entries of accounts to log in
     */
    _processFastLoginQueue(allAccounts: any[]): void;
    /**
     * Internal: Logs in accounts asynchronously to allow for user interaction
     * @param allAccounts - Array of logininfo entries of accounts to log in
     */
    _processSlowLoginQueue(allAccounts: any[]): void;
}

/**
 * Process data that should be kept over restarts
 * @param data - Stringified data received by previous process
 */
declare function restartdata(data: string): void;

/**
 * ID types supported by this resolver
 */
declare const EIdTypes: any;

/**
 * ID types supported by this resolver
 */
declare const EIdTypes: any;

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
 */
declare function reinstallAll(logger: (...params: any[]) => any, callback: any): void;

/**
 * Updates all installed packages to versions listed in package.json from the project root directory.
 */
declare function update(callback: any): void;

/**
 * Updates all installed packages to versions listed in package.json
 * @param path - Custom path to read package.json from and install packages to
 */
declare function updateFromPath(path: string, callback: any): void;

/**
 * Installs the latest version available on NPM for an array of packages. Updating core dependencies might cause untested behavior, be careful.
 * @param packages - Array of package names to install the latest version of
 * @returns Resolves when done or rejects on failure
 */
declare function installLatest(packages: string[]): Promise<void>;

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
     * Internal: Loads all config & data files from disk and handles potential errors
     * @returns Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    _importFromDisk(): Promise<void>;
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
    config: any;
    /**
     * Stores all `advancedconfig.json` settings.
     */
    advancedconfig: any;
    /**
     * Stores all supported languages and their strings used for responding to a user.
     * All default strings have already been replaced with corresponding matches from `customlang.json`.
     */
    lang: any;
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
    logininfo: any;
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
     * Loads all DataManager helper files. This is done outside of the constructor to be able to await it.
     * @returns Resolved when all files have been loaded
     */
    _loadDataManagerFiles(): Promise<void>;
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
     * Internal: Loads all config & data files from disk and handles potential errors
     * @returns Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.
     */
    _importFromDisk(): Promise<void>;
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
     * @param [userIDOrLanguage] - Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language.
     * @returns Returns a promise that resolves with the language string or `null` if it could not be found.
     */
    getLang(str: string, replace: any, userIDOrLanguage?: string): Promise<string | null>;
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
     * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
     */
    _startExpiringTokensCheckInterval(): void;
    /**
     * Internal: Asks user if they want to refresh the tokens of all expiring accounts when no active request was found and relogs them
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
    decodeJWT(token: string): any | null;
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
     * @param name - Name of the file
     * @param filepath - Full path, starting from project root with './'
     * @param resolve - Your promise to resolve when file was pulled
     * @param noRequire - Optional: Set to true if resolve() should not be called with require(file) as param
     */
    _pullNewFile(name: string, filepath: string, resolve: (...params: any[]) => any, noRequire: boolean): void;
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
     * @param [userIDOrLanguage] - Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language.
     * @returns Returns a promise that resolves with the language string or `null` if it could not be found.
     */
    getLang(str: string, replace: any, userIDOrLanguage?: string): Promise<string | null>;
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
     * Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg
     */
    _startExpiringTokensCheckInterval(): void;
    /**
     * Internal: Asks user if they want to refresh the tokens of all expiring accounts when no active request was found and relogs them
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
    decodeJWT(token: string): any | null;
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
     * @param name - Name of the file
     * @param filepath - Full path, starting from project root with './'
     * @param resolve - Your promise to resolve when file was pulled
     * @param noRequire - Optional: Set to true if resolve() should not be called with require(file) as param
     */
    _pullNewFile(name: string, filepath: string, resolve: (...params: any[]) => any, noRequire: boolean): void;
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
     * Internal: Executes all due jobs.
     */
    _runDueJobs(): void;
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
 * Constructor - Creates a new Discussion object
 */
declare class CSteamDiscussion {
    constructor(community: SteamCommunity, data: any);
    _community: SteamCommunity;
    /**
     * Scrapes a range of comments from this discussion
     * @param startIndex - Index (0 based) of the first comment to fetch
     * @param endIndex - Index (0 based) of the last comment to fetch
     * @param callback - First argument is null/Error, second is array containing the requested comments
     */
    getComments(startIndex: number, endIndex: number, callback: (...params: any[]) => any): void;
    /**
     * Posts a comment to this discussion's comment section
     * @param message - Content of the comment to post
     * @param callback - Takes only an Error object/null as the first argument
     */
    postComment(message: string, callback: (...params: any[]) => any): void;
    /**
     * Delete a comment from this discussion's comment section
     * @param gidcomment - ID of the comment to delete
     * @param callback - Takes only an Error object/null as the first argument
     */
    deleteComment(gidcomment: string, callback: (...params: any[]) => any): void;
    /**
     * Subscribes to this discussion's comment section
     * @param callback - Takes only an Error object/null as the first argument
     */
    subscribe(callback: (...params: any[]) => any): void;
    /**
     * Unsubscribes from this discussion's comment section
     * @param callback - Takes only an Error object/null as the first argument
     */
    unsubscribe(callback: (...params: any[]) => any): void;
}

/**
 * @property [reviewID] - ID of review, used for voting & reporting. Remains `null` if it is your review or you are not logged in as the buttons are not presented then.
 * @property steamID - SteamID object of the review author
 * @property appID - AppID of the associated game
 * @property postedDate - Date of when the review was posted initially
 * @property [updatedDate] - Date of when the review was last updated. Remains `null` if review was never updated
 * @property recommended - True if the author recommends the game, false otherwise.
 * @property isEarlyAccess - True if the review is an early access review
 * @property content - Text content of the review
 * @property [commentsAmount] - Amount of comments reported by Steam. Remains `null` if coments are disabled
 * @property [comments] - Array of the last 10 comments left on this review
 * @property recentPlaytimeHours - Amount of hours the author played this game for in the last 2 weeks
 * @property totalPlaytimeHours - Amount of hours the author played this game for in total
 * @property [playtimeHoursAtReview] - Amount of hours the author played this game for at the point of review. Remains `null` if Steam does not provide this information.
 * @property votesHelpful - Amount of 'Review is helpful' votes
 * @property votesFunny - Amount of 'Review is funny' votes
 */
declare type Review = {
    reviewID?: string;
    steamID: SteamID;
    appID: string;
    postedDate: Date;
    updatedDate?: Date;
    recommended: boolean;
    isEarlyAccess: boolean;
    content: string;
    commentsAmount?: number;
    comments?: { index: number; id: string; authorLink: string; postedDate: Date; content: string; }[];
    recentPlaytimeHours: number;
    totalPlaytimeHours: number;
    playtimeHoursAtReview?: number;
    votesHelpful: number;
    votesFunny: number;
};

/**
 * Constructor - Creates a new CSteamReview object
 * @param community - Current SteamCommunity instance
 * @param data - Review data collected by the scraper
 */
declare class CSteamReview {
    constructor(community: SteamCommunity, data: Review);
    _community: SteamCommunity;
    /**
     * Posts a comment to this review
     * @param message - Content of the comment to post
     * @param callback - Takes only an Error object/null as the first argument
     */
    comment(message: string, callback: (...params: any[]) => any): void;
    /**
     * Votes on this review as helpful
     * @param callback - Takes only an Error object/null as the first argument
     */
    voteHelpful(callback: (...params: any[]) => any): void;
    /**
     * Votes on this review as unhelpful
     * @param callback - Takes only an Error object/null as the first argument
     */
    voteUnhelpful(callback: (...params: any[]) => any): void;
    /**
     * Votes on this review as funny
     * @param callback - Takes only an Error object/null as the first argument
     */
    voteFunny(callback: (...params: any[]) => any): void;
    /**
     * Removes funny vote from this review
     * @param callback - Takes only an Error object/null as the first argument
     */
    voteRemoveFunny(callback: (...params: any[]) => any): void;
}

/**
 * Constructor - Creates a new SharedFile object
 */
declare class CSteamSharedFile {
    constructor(community: SteamCommunity, data: any);
    _community: SteamCommunity;
    /**
     * Deletes a comment from this sharedfile's comment section
     * @param cid - ID of the comment to delete
     * @param callback - Takes only an Error object/null as the first argument
     */
    deleteComment(cid: string, callback: (...params: any[]) => any): void;
    /**
     * Favorites this sharedfile
     * @param callback - Takes only an Error object/null as the first argument
     */
    favorite(callback: (...params: any[]) => any): void;
    /**
     * Posts a comment to this sharedfile
     * @param message - Content of the comment to post
     * @param callback - Takes only an Error object/null as the first argument
     */
    comment(message: string, callback: (...params: any[]) => any): void;
    /**
     * Subscribes to this sharedfile's comment section. Note: Checkbox on webpage does not update
     * @param callback - Takes only an Error object/null as the first argument
     */
    subscribe(callback: (...params: any[]) => any): void;
    /**
     * Unfavorites this sharedfile
     * @param callback - Takes only an Error object/null as the first argument
     */
    unfavorite(callback: (...params: any[]) => any): void;
    /**
     * Unsubscribes from this sharedfile's comment section. Note: Checkbox on webpage does not update
     * @param callback - Takes only an Error object/null as the first argument
     */
    unsubscribe(callback: (...params: any[]) => any): void;
}

/**
 * Attempt to load all plugins. If a critical check fails loading will be denied
 * @param pluginName - Name of the plugin package
 * @returns Creates a plugin instance and returns it along with more information
 */
declare function loadPlugin(pluginName: string): any;

/**
 * @property load - Called on Plugin load
 * @property unload - Called on Plugin unload
 * @property ready - Controller ready event
 * @property statusUpdate - Controller statusUpdate event
 * @property steamGuardInput - Controller steamGuardInput event
 * @property steamGuardQrCode - Controller steamGuardQrCode event
 */
declare type Plugin = {
    load: (...params: any[]) => any;
    unload: (...params: any[]) => any;
    ready: (...params: any[]) => any;
    statusUpdate: (...params: any[]) => any;
    steamGuardInput: (...params: any[]) => any;
    steamGuardQrCode: (...params: any[]) => any;
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
     * Internal: Integrates changes made to a plugin's default config into the user's config
     * @param pluginName - Name of your plugin
     * @param currentConfig - Config file currently loaded for this plugin
     * @returns the config
     */
    _aggregatePluginConfig(pluginName: string, currentConfig: any): Record<string, any>;
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
     * Central part of the application and your interface to everything
     */
    controller: Controller;
    /**
     * References to all plugin objects
     */
    pluginList: any;
    /**
     * Manages all registered commands and gives you access to them
     */
    commandHandler: CommandHandler;
    /**
     * Manages and runs all jobs and lets you register your own
     */
    jobManager: JobManager;
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
     * Internal: Integrates changes made to a plugin's default config into the user's config
     * @param pluginName - Name of your plugin
     * @param currentConfig - Config file currently loaded for this plugin
     * @returns the config
     */
    _aggregatePluginConfig(pluginName: string, currentConfig: any): Record<string, any>;
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
    _handle2FA(res: StartSessionResponse): void;
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
     * Handles displaying a QR Code to login using the Steam Mobile App
     * @param res - Response object from startWithQR() promise
     */
    _handleQRCode(res: StartSessionResponse): void;
    /**
     * Helper function to make handling login errors easier
     * @param err - Error thrown by startWithCredentials()
     */
    _handleCredentialsLoginError(err: any): void;
    /**
     * Helper function to make handling login errors easier
     * @param err - Error thrown by startWithQR()
     */
    _handleQrCodeLoginError(err: any): void;
    /**
     * Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.
     * @returns Resolves with `true` if a valid token was found, `false` otherwise
     */
    hasStorageValidToken(): Promise<boolean>;
    /**
     * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
     */
    _getTokenFromStorage(callback: any): void;
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
     * Attempts to renew the refreshToken used for the current session. Whether a new token will actually be issued is at the discretion of Steam.
     * @returns Returns a promise which resolves with `true` if Steam issued a new token, `false` otherwise. Rejects if no token is stored in the database.
     */
    attemptTokenRenew(): Promise<boolean>;
    /**
     * Internal: Attaches listeners to all steam-session events we care about
     */
    _attachEvents(): void;
    /**
     * Internal: Handles submitting 2FA code
     * @param res - Response object from startWithCredentials() promise
     */
    _handle2FA(res: StartSessionResponse): void;
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
     * Handles displaying a QR Code to login using the Steam Mobile App
     * @param res - Response object from startWithQR() promise
     */
    _handleQRCode(res: StartSessionResponse): void;
    /**
     * Helper function to make handling login errors easier
     * @param err - Error thrown by startWithCredentials()
     */
    _handleCredentialsLoginError(err: any): void;
    /**
     * Helper function to make handling login errors easier
     * @param err - Error thrown by startWithQR()
     */
    _handleQrCodeLoginError(err: any): void;
    /**
     * Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.
     * @returns Resolves with `true` if a valid token was found, `false` otherwise
     */
    hasStorageValidToken(): Promise<boolean>;
    /**
     * Internal - Attempts to get a token for this account from tokens.db and checks if it's valid
     */
    _getTokenFromStorage(callback: any): void;
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
 * Provide function to only once attach listeners to parent process
 * @param callback - Called on completion
 */
declare function attachParentListeners(callback: (...params: any[]) => any): void;

/**
 * Provide function to detach parent process event listeners
 */
declare function detachParentListeners(): void;

/**
 * Provide function to attach listeners to make communicating with child possible
 */
declare function attachChildListeners(): void;

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
 * @param callback - Called with `updateFound` (Boolean) and `data` (Object) on completion. `updatefound` will be false if the check should fail. `data` includes the full data.json file found online.
 */
declare function check(datafile: any, branch: string, forceUpdate: boolean, callback: (...params: any[]) => any): void;

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
     * @returns Promise that will be resolved with false when no update was found or with true when the update check or download was completed. Expect a restart when true was returned.
     */
    run(forceUpdate: boolean, respondModule: (...params: any[]) => any, resInfo: any): Promise<boolean>;
    /**
     * Registers an update check job. This is called by Controller after the data integrity and startup update check
     */
    _registerUpdateChecker(): void;
}

