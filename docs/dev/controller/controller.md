# Controller
[⬅️ Go back to dev home](../#readme) <a href="/src/controller/controller.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The Controller is the center piece of the application.  
It is the entry point of the child process, which gets spawned by the [parent process](../starter.md).  
It stores references to all the other modules, does first checks (e.g. internet connection, unsupported nodejs version) and handles the startup.  

The parent process forks a child that loads `controller.js` into memory and sets a timestamp of startup as `process.argv[3]`.  
Any data which should be passed through a restart will be set as a stringified object at `process.argv[4]`.  
If the mentioned timestamp is within the last 2.5 seconds, `controller.js` will create a new Controller object and call `_start()` to start the application.  

Most functions are prototype functions linked to the existing Controller object at runtime, some may however still be normal exported functions.  
Please check the [Helpers](./helpers.md) page of this module to see functions which still belong to this module but may not be listed directly on this page.

&nbsp;

## Table of Contents
- [Helpers](./helpers.md)
- [Events](./events.md)
- [Data](#data)
- [Functions](#functions)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## Data
The Controller object holds the following data:

### srcdir
Absolute path to the `src` directory on this user's machine.

### events
The Controller's EventEmitter. Read more about which events the Controller emits on the [Events](./events.md) page.

### misc
Object containing a collection of references to miscellaneous functions to make access easier.  
The included functions are listed below, their detailed documentation can be found on the [Helpers](./helpers.md) page.

### info
Object containing the following properties:
- `bootStartTimestamp` (number) - Timestamp when the application was started
- `lastLoginTimestamp` (number) - Timestamp of the last login attempted by any bot account
- `steamGuardInputTime` (number) - Tracks time spent waiting for user steamGuardCode input
- `startupWarnings` (number) - Amount of warnings displayed by dataCheck during startup
- `activeLogin` (boolean) - Set to true to block new comment etc. requests
- `relogAfterDisconnect` (boolean) - Set to true to prevent accounts from relogging when loosing connection (e.g. when explicitly calling logOff())
- `readyAfter` (number) - Length of last startup in seconds
- `skippedaccounts` (string[]) - Array of account names which have been skipped at login
- `commentCounter` (Number) - Tracks total amount of comments sent since startup

### activeRequests
Object containing all active requests (comments, votes, ...).  
Please see the documentation of the corresponding request to see the detailed content it writes into this object.  
All requests should however always include these properties:
- `status` (string) - "active", "error", "aborted" or "cooldown", indicating the current status of this request
- `type` (string) - The type of request (e.g. profileComment, upvote, ...)
- `amount` (number) - Amount of e.g. comments requested
- `requestedby` (string) - Unique ID of the user who initated this request
- `accounts` (string[]) - Array of bot account names involved in this request
- `until` (number) - Timestamp of when the request is estimated to be finished

&nbsp;

## Functions
All private functions, except the constructor, are prefixed with an `_` underscore. They should not be called from external modules (e.g. plugins).  

### (): void
Constructor - Creates a new Controller object.

&nbsp;

### misc.syncLoop(iterations, func, exit): object
Implementation of a synchronous loop for easy iteration management.  
This is an exported function, referenced in the `misc` object for easy access, see the [Helpers](./helpers.md) page for a more detailed documentation.

### misc.round(value, decimals): number
Rounds a number with x decimals.  
This is an exported function, referenced in the `misc` object for easy access, see the [Helpers](./helpers.md) page for a more detailed documentation.

### misc.timeToString(timestamp): string
Converts a timestamp to a human-readable "until from now" format.  
This is an exported function, referenced in the `misc` object for easy access, see the [Helpers](./helpers.md) page for a more detailed documentation.

### misc.checkConnection(url, throwTimeout): Promise
Pings an URL to check if the service and the user's internet connection is working.  
This is an exported function, referenced in the `misc` object for easy access, see the [Helpers](./helpers.md) page for a more detailed documentation.

### misc.cutStringsIntelligently(txt, limit, cutChars, threshold): string[]
Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.  
This is an exported function, referenced in the `misc` object for easy access, see the [Helpers](./helpers.md) page for a more detailed documentation.

&nbsp;

### _start(): void
Internal:  
Initializes the bot by importing data from the disk, running the updater and finally calling `_preLogin()` to start logging in bot accounts.  

This function is designed to be failsafe - an error handler gets attached instantly to handle installing npm dependencies (the "module not found" error is suppressed on first start)
and each module is being awaited to handle e.g. invalid config syntax before this issue can trigger more errors down to road.

### _preLogin(): void
Internal:  
Loads all parts of the application to get IntelliSense support after the updater ran and calls login() when done.

This is another part of the failsafe - should `_start()` have found issues, missing files or just an update, this should be handled by now. We can now require files to provide
IntelliSense support without the risk of missing files.  

&nbsp;

### restart(data?): void
- `data` (string) - Optional: A stringified JSON object containing data to keep through the restart. If not defined, the current [info.skippedaccounts](#info) array and updateFailed = false will be returned.

Sends a signal to the parent process to kill and spawn a new child process.
The Controller will handle the data key & value pairs `oldconfig`, `logafterrestart`, `skippedaccounts` and `updateFailed` directly.

### stop(): void
Sends a signal to the parent process to kill the child process and then exit.

### login(firstLogin): void <a href="/src/controller/login.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
- `firstLogin` (boolean): Is set to true by the controller if this is the first login in order to display more information

Attempts to log in all bot accounts which are currently offline one after another.  
Creates a new bot object for every new account and reuses an existing one if possible.

You MUST NOT set `firstLogin` to true. Doing so for a login request which is not the first one, will cause errors!

### _readyEvent(): void
Runs internal ready event code and emits ready event for plugins.

### _statusUpdateEvent(bot, newStatus): void
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `newStatus` (Bot.[EStatus](/src/bot/EStatus.js)) - The new status of this bot

Runs internal statusUpdate event code and emits statusUpdate event for plugins.

### _steamGuardInputEvent(bot, submitCode): void
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `submitCode` (function(string): void) - Function to submit a code. Pass an empty string to skip the account.

Emits steamGuardInput event for bot & plugins

### checkLastcommentDB(bot): void
- `bot` ([Bot](../bot/bot.md)) - Bot object of the account to check

Checks if all friends of this bot account are in the lastcomment database.  
This function is called by every bot on initial login or relog.

### friendListCapacityCheck(bot, callback): void
- `bot` ([Bot](../bot/bot.md)) - Bot object of the account to check
- `callback` (function(number | null): void) - Called with `remaining` (Number) on success or `null` on failure

Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.

### _lastcommentUnfriendCheck(): void
Check for friends who haven't requested comments in `config.unfriendtime` days and unfriend them

### getBots(statusFilter?, mapToObject?): Array | object
- `statusFilter` (Bot.[EStatus](/src/bot/EStatus.js) | [EStatus](/src/bot/EStatus.js)[] | string) - Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned.
- `mapToObject` (boolean) - Optional: If true, an object will be returned where every bot object is mapped to their accountName.

Retrieves all bot accounts whose status matches the `statusFilter` parameter.  
By default, or if `!mapToObject`, an array containing a reference to every bot will be returned.

## getBotsPerProxy(filterInactive?): Array
- `filterInactive` (boolean) - Set to true to remove inactive proxies. A proxy is deemed inactive if it is unused or all associated bot accounts are not ONLINE.

Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.  
Bot accounts mapped to their associated proxy.

### _handleErrors(): void
Internal:  
Handles process's unhandledRejection & uncaughtException error events.  
Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function.

### handleSteamIdResolving(str, expectedIdType, callback): void
- `str` (string) - Input string. This should either be an URL, a vanity or a steamID64.
- `expectedIdType` (string) - The type of SteamID expected ("profile", "group" or "sharedfile") or `null` if type should be assumed.
- `callback` (function(string | null, string | null, string | null): void) - Called with `err` (String or null), `steamID64` (String or null), `idType` (String or null) parameters on completion

Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.  
The input string is usually the `profileID` parameter which commands accept from a user when they are executed.  

Use this function whenever you can in order to support a variety of user inputs.

### logger(type, str, nodate, remove, animation, printNow): void
- `type` (string) - String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field.
- `str` (string) - The text to log into the terminal
- `nodate` (boolean) - Setting to true will hide date and time in the message
- `remove` (boolean) - Setting to true will remove this message with the next one
- `animation` (string[]) - Array containing animation frames as elements
- `printNow` (boolean) - Ignores the readyafterlogs check and force prints the message now
- `cutToWidth` (boolean) - Cuts the string to the width of the terminal

Logs text to the terminal and appends it to the output.txt file.  
Always use this function to log messages.

This function is also available as a global variable under the same name, you do not need to access it through the controller.

### _loggerOptionsUpdateAfterConfigLoad(advancedconfig): void
- `advancedconfig` (object) - The advancedconfig object imported by the DataManager

Internal: Called after loading advancedconfig.json to set previously inaccessible options

### _loggerLogAfterReady(): void
Internal: Logs all held back messages from logAfterReady array
