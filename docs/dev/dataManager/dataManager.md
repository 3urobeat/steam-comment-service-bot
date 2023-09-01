# DataManager
[⬅️ Go back to dev home](../#readme) <a href="/src/dataManager/dataManager.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The DataManager system imports, checks, handles errors and provides a file updating service for all configuration files.  
It is the central point for holding any managing any data which the application stores on the filesystem.  

Use the data and functions exposed by this module whenever you need to e.g. read and write to a config file. 

&nbsp;

## Table Of Contents
- [Data](#data)
- [Functions](#functions)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## Data
The DataManager object holds the following data:

### controller
Reference to the active controller object

### checkAndGetFile
Reference to the checkAndGetFile() function for easier usage from inside the module

### datafile
Object holding the content of `src/data/data.json`.  
You can see its content by clicking [here](/src/data/data.json).

### config
Object holding the content of `config.json`.  
You can see its content by clicking [here](/config.json).

### advancedconfig
Object holding the content of `advancedconfig.json`.  
You can see its content by clicking [here](/advancedconfig.json).

### lang
Object holding all language strings for responding to a user.  
It loads the data of `src/data/lang/defaultlang.json` and overwrites all keys with the corresponding values from `customlang.json` (does not overwrite the file on the disk).  
You can see the default lang content by clicking [here](/src/data/lang/defaultlang.json) and your customlang file by clicking [here](/customlang.json).

### quotes
Array of strings holding all quotes used for commenting which are set in `quotes.txt`.  
You can see its content by clicking [here](/quotes.txt).

### proxies
Array of strings holding all proxies used for connecting the accounts to Steam. These are set in `proxies.txt`.  
You can see its content by clicking [here](/proxies.txt).

### cachefile
Object storing IDs from config files converted at runtime and backups for all config & data files.  

If you need the steamID64 of any owner or bot account or the groupID64 of the botsgroup or configgroup, read them from here.  
The bot accepts various inputs in the config for setting owner IDs and converts them to steamID64s at startup.  
These are stored in this object and should always be used instead of reading from the config directly.

At every startup (when the Controller ready event fires) the bot writes a backup of all config and data files to this object as well.  
This content is written to `src/data/cache.json` in order to restore previous config settings should the user make a syntax mistake or the updater break.  

You can see its content by clicking [here](/src/data/cache.json), however it is empty if you have never started the bot before.

### logininfo
Object storing the login information for every bot account provided via the `logininfo.json` or `accounts.txt` files.  

The logininfo is stored in a `"accountName": { accountName: string, password: string, sharedSecret?: string, steamGuardCode?: null }` format for every account.  
The value `steamGuardCode` is populated at runtime right before logging in when the user provided a `sharedSecret`.  

### lastCommentDB
[Nedb](https://github.com/seald/nedb) database which stores the timestamp of the last request (comment, vote, fav, ...) of every user.  
This is used to enforce `config.unfriendTime` and cooldowns.  

The data is stored in documents following this format: `{ id: string, time: number }`

### ratingHistoryDB
[Nedb](https://github.com/seald/nedb) database which stores information about which bot accounts have already voted on which sharedfiles.  
This allows us to filter without pinging Steam for every account on every request.

The data is stored in documents following this format: `{ id: string, accountName: string, type: string, time: number }`

### tokensDB
[Nedb](https://github.com/seald/nedb) database which stores the refreshTokens for all bot accounts.  
These refreshTokens are used to log in bot accounts without needing to input Steam Guard Codes on every login.  
These tokens are managed by the [sessionHandler](../sessionHandler/sessionHandler.md) module.

The data is stored in documents following this format: `{ accountName: string, token: string }`

### _handleExpiringTokensInterval
Internal: Stores a reference to the active handleExpiringTokens interval to prevent duplicates on reloads

&nbsp;

## Functions
All private functions, except the constructor, are prefixed with an `_` underscore. They should not be called from external modules (e.g. plugins).  

### (controller): void
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object

Constructor - Creates a new DataManager object. Is called by Controller on startup.

&nbsp;

### _loadDataManagerFiles(): Promise
Loads all DataManager helper files. This is done outside of the constructor to be able to await it.

Returns a Promise which resolves when all source code files have been loaded.

### checkData(): Promise
Checks currently loaded data for validity and logs some recommendations for a few settings.  
This function is called on startup by the Controller but can be executed again at any time.

Returns a Promise which resolves when all checks have finished. If promise is rejected you should terminate the application or reset the changes. Reject is called with a String specifying the failed check.

### writeAllFilesToDisk(): void
Writes (all) files imported by the DataManager back to the disk.

### writeCachefileToDisk(): void
Writes [cachefile](#cachefile) to cache.json on disk.

### writeDatafileToDisk(): void
Writes [datafile](#datafile) to data.json on disk.

### writeConfigToDisk(): void
Writes [config](#config) to config.json on disk.

### writeAdvancedconfigToDisk(): void
Writes [advancedconfig](#advancedconfig) to advancedconfig.json on disk.

### writeLogininfoToDisk(): void
Writes [logininfo](#logininfo) to logininfo.json and accounts.txt on disk, depending on which of the files exist.

### writeProxiesToDisk(): void
Writes [proxies](#proxies) to proxies.txt on disk.

### writeQuotesToDisk(): void
Writes [quotes](#quotes) to quotes.txt on disk.

### _importFromDisk(): Promise
Internal: Loads all config & data files from disk and handles potential errors

Returns a Promise which resolves when all files have been loaded successfully.  
The function will log an error and terminate the application should a fatal error occur.

### processData(): void
Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)

### getQuote(quotesArr?): Promise
- `quotesArr` (string[]) - Optional: Provide a custom quotes array to not use the DataManager [quotes](#quotes) array.

Gets a random quote from the [quotes](#quotes) array or from the quotesArr parameter, if defined.

Returns a Promise which resolves with a string.  
It uses promises instead of returning instantly as the function includes a recent quotes detection and might run multiple times before resolving.

### getUserCooldown(id): Promise
- `id` (string) - ID of the user to look up

Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.  

Returns a Promise which resolves with an object containing the following values:
- `lastRequest` (number) - UNIX timestamp of the last request received from this user
- `until` (number) - UNIX timestamp of when the user's cooldown ends
- `lastRequestStr` (string) - lastRequest as a "How long ago" human readable string
- `untilStr` (string) - until as a "Wait until" human readable string
...or `null` if the ID was not found.

### setUserCooldown(id, timestamp): void
- `id` (string) - ID of the user to update
- `timestamp` (number) - Unix timestamp of the last interaction (comment, vote, fav) the user received

Updates or inserts a timestamp of a user in the [lastCommentDB](#lastcommentdb) database.

### _startExpiringTokensCheckInterval(): void
Internal:  
Checks [tokens.db](#tokensdb) every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam message.

### _askForGetNewToken(expiring): void
- `expiring` (object) - Object of botobject entries to ask the user for

Internal:  
Asks user if they want to refresh the tokens of all expiring accounts when no active request was found and relogs them.

### getLastCommentRequest(steamID64?): Promise
- `steamID64` (string) - Search for a specific user

Retrieves the last processed request of anyone or a specific steamID64 from the lastcomment database.

Returns a Promise which resolves with the greatest timestamp (number) found.

### decodeJWT(token): object | null
- `token` (string) - The token to decode

Decodes a JsonWebToken.

Returns a JWT object on success, `null` on failure.

### refreshCache(): void
Refreshes Backups in [cache.json](#cachefile) with new data

### _restoreBackup(name, filepath, cacheentry, onlinelink, resolve): void
- `name` (string) - Name of the file to restore
- `filepath` (string) - Absolute path of the file on the disk
- `cacheentry` (object) - Backup-Object of the file in cache.json
- `onlinelink` (string) - Link to the raw file in the GitHub repository
- `resolve` (function(any): void) - Function to resolve the caller's promise

Internal:  
Helper function to try and restore backup of corrupted file from [cache.json](#cachefile).  
Since this file is called from inside the file import functions in dataImport.js, which each return a Promise, this function accepts a resolve function as a parameter to resolve the caller's promise.

### _pullNewFile(name, filepath, resolve, noRequire?): void
- `name` (string) - Name of the file
- `filepath` (string) - Full path, starting from project root with './'
- `resolve` (function(any): void) - Your promise to resolve when file was pulled
- `noRequire` (boolean) - Optional: Set to true if resolve() should not be called with require(file) as param

Internal:  
Helper function to pull new file from GitHub.
Since this file is called from within [_restoreBackup()](#_restorebackupname-filepath-cacheentry-onlinelink-resolve-void), it accepts the same `resolve` parameter to resolve the caller's promise.