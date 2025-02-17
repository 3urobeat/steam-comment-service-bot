<a name="Controller"></a>

## Controller
**Kind**: global class  

* [Controller](#Controller)
    * [new Controller()](#new_Controller_new)
    * [.bots](#Controller+bots) : <code>Object.&lt;string, Bot&gt;</code>
    * [.main](#Controller+main) : [<code>Bot</code>](#Bot)
    * [.misc](#Controller+misc)
        * [.syncLoop(iterations, func, exit)](#Controller+misc.syncLoop)
        * [.round(value, decimals)](#Controller+misc.round) ⇒ <code>number</code>
        * [.timeToString(timestamp)](#Controller+misc.timeToString) ⇒ <code>string</code>
        * [.checkConnection(url, [throwTimeout], [proxy])](#Controller+misc.checkConnection) ⇒ <code>Promise.&lt;{statusMessage: string, statusCode: (number\|null)}&gt;</code>
        * [.splitProxyString(url)](#Controller+misc.splitProxyString) ⇒ <code>Object</code>
        * [.cutStringsIntelligently(txt, limit, cutChars, threshold)](#Controller+misc.cutStringsIntelligently) ⇒ <code>Array</code>
    * [.info](#Controller+info)
    * [.activeRequests](#Controller+activeRequests) : <code>Object.&lt;string, {status: string, type: string, amount: number, quotesArr: (Array.&lt;string&gt;\|undefined), requestedby: string, accounts: Array.&lt;Bot&gt;, thisIteration: number, retryAttempt: number, amountBeforeRetry: (number\|undefined), until: number, ipCooldownPenaltyAdded: (boolean\|undefined), failed: object}&gt;</code>
    * [.data](#Controller+data) : [<code>DataManager</code>](#DataManager)
    * [.updater](#Controller+updater) : <code>undefined</code>
    * [.jobManager](#Controller+jobManager) : [<code>JobManager</code>](#JobManager)
    * [.commandHandler](#Controller+commandHandler) : [<code>CommandHandler</code>](#CommandHandler)
    * [.pluginSystem](#Controller+pluginSystem) : [<code>PluginSystem</code>](#PluginSystem)
    * [.filters](#Controller+filters) : <code>Object</code>
    * [.filters](#Controller+filters) : <code>Object</code>
    * [._start()](#Controller+_start)
    * [._preLogin()](#Controller+_preLogin)
    * [.restart(data)](#Controller+restart)
    * [.stop()](#Controller+stop)
    * [.login(firstLogin)](#Controller+login)
    * [._processFastLoginQueue(allAccounts)](#Controller+_processFastLoginQueue)
    * [._processSlowLoginQueue(allAccounts)](#Controller+_processSlowLoginQueue)
    * [.addAccount(accountName, password, [sharedSecret])](#Controller+addAccount)
    * [.removeAccount(accountName)](#Controller+removeAccount)
    * [.relogAccount(accountName)](#Controller+relogAccount)
    * [.respreadProxies()](#Controller+respreadProxies)
    * [.filterAccounts(predicate)](#Controller+filterAccounts) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [._dataUpdateEvent(key, oldData, newData)](#Controller+_dataUpdateEvent)
    * [._readyEvent()](#Controller+_readyEvent)
    * [._statusUpdateEvent(bot, newStatus)](#Controller+_statusUpdateEvent)
    * [._steamGuardInputEvent(bot, submitCode)](#Controller+_steamGuardInputEvent)
    * [._steamGuardQrCodeEvent(bot, challengeUrl)](#Controller+_steamGuardQrCodeEvent)
    * [.checkLastcommentDB(bot)](#Controller+checkLastcommentDB)
    * [.friendListCapacityCheck(bot, callback)](#Controller+friendListCapacityCheck)
    * [._lastcommentUnfriendCheck()](#Controller+_lastcommentUnfriendCheck)
    * [.getBots([statusFilter], [mapToObject])](#Controller+getBots) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsPerProxy([filterOffline])](#Controller+getBotsPerProxy) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
    * [._handleErrors()](#Controller+_handleErrors)
    * [.handleSteamIdResolving(str, expectedIdType, callback)](#Controller+handleSteamIdResolving)
    * [.logger(type, str, nodate, remove, animation, printNow, cutToWidth)](#Controller+logger)
    * [._loggerOptionsUpdateAfterConfigLoad(advancedconfig)](#Controller+_loggerOptionsUpdateAfterConfigLoad)
    * [._loggerLogAfterReady()](#Controller+_loggerLogAfterReady)
    * [._dataUpdateEvent(key, oldData, newData)](#Controller+_dataUpdateEvent)
    * [._readyEvent()](#Controller+_readyEvent)
    * [._statusUpdateEvent(bot, newStatus)](#Controller+_statusUpdateEvent)
    * [._steamGuardInputEvent(bot, submitCode)](#Controller+_steamGuardInputEvent)
    * [._steamGuardQrCodeEvent(bot, challengeUrl)](#Controller+_steamGuardQrCodeEvent)
    * [.checkLastcommentDB(bot)](#Controller+checkLastcommentDB)
    * [.friendListCapacityCheck(bot, callback)](#Controller+friendListCapacityCheck)
    * [._lastcommentUnfriendCheck()](#Controller+_lastcommentUnfriendCheck)
    * [.getBots([statusFilter], [mapToObject])](#Controller+getBots) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsPerProxy([filterOffline])](#Controller+getBotsPerProxy) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
    * [._handleErrors()](#Controller+_handleErrors)
    * [.handleSteamIdResolving(str, expectedIdType, callback)](#Controller+handleSteamIdResolving)
    * [.logger(type, str, nodate, remove, animation, printNow, cutToWidth)](#Controller+logger)
    * [._loggerOptionsUpdateAfterConfigLoad(advancedconfig)](#Controller+_loggerOptionsUpdateAfterConfigLoad)
    * [._loggerLogAfterReady()](#Controller+_loggerLogAfterReady)
    * [.login(firstLogin)](#Controller+login)
    * [._processFastLoginQueue(allAccounts)](#Controller+_processFastLoginQueue)
    * [._processSlowLoginQueue(allAccounts)](#Controller+_processSlowLoginQueue)
    * [.addAccount(accountName, password, [sharedSecret])](#Controller+addAccount)
    * [.removeAccount(accountName)](#Controller+removeAccount)
    * [.relogAccount(accountName)](#Controller+relogAccount)
    * [.respreadProxies()](#Controller+respreadProxies)
    * [.filterAccounts(predicate)](#Controller+filterAccounts) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)

<a name="new_Controller_new"></a>

### new Controller()
Constructor - Initializes the controller and starts all bot accounts

<a name="Controller+bots"></a>

### controller.bots : <code>Object.&lt;string, Bot&gt;</code>
Stores references to all bot account objects mapped to their accountName

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+main"></a>

### controller.main : [<code>Bot</code>](#Bot)
The main bot account

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+misc"></a>

### controller.misc
Collection of miscellaneous functions for easier access

**Kind**: instance property of [<code>Controller</code>](#Controller)  

* [.misc](#Controller+misc)
    * [.syncLoop(iterations, func, exit)](#Controller+misc.syncLoop)
    * [.round(value, decimals)](#Controller+misc.round) ⇒ <code>number</code>
    * [.timeToString(timestamp)](#Controller+misc.timeToString) ⇒ <code>string</code>
    * [.checkConnection(url, [throwTimeout], [proxy])](#Controller+misc.checkConnection) ⇒ <code>Promise.&lt;{statusMessage: string, statusCode: (number\|null)}&gt;</code>
    * [.splitProxyString(url)](#Controller+misc.splitProxyString) ⇒ <code>Object</code>
    * [.cutStringsIntelligently(txt, limit, cutChars, threshold)](#Controller+misc.cutStringsIntelligently) ⇒ <code>Array</code>

<a name="Controller+misc.syncLoop"></a>

#### misc.syncLoop(iterations, func, exit)
Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)

**Kind**: static method of [<code>misc</code>](#Controller+misc)  

| Param | Type | Description |
| --- | --- | --- |
| iterations | <code>number</code> | The amount of iterations |
| func | <code>function</code> | The function to run each iteration (Params: loop, index) |
| exit | <code>function</code> | This function will be called when the loop is finished |

<a name="Controller+misc.round"></a>

#### misc.round(value, decimals) ⇒ <code>number</code>
Rounds a number with x decimals

**Kind**: static method of [<code>misc</code>](#Controller+misc)  
**Returns**: <code>number</code> - Rounded number  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>number</code> | Number to round |
| decimals | <code>number</code> | Amount of decimals |

<a name="Controller+misc.timeToString"></a>

#### misc.timeToString(timestamp) ⇒ <code>string</code>
Converts a timestamp to a human-readable "until from now" format. Does not care about past/future.

**Kind**: static method of [<code>misc</code>](#Controller+misc)  
**Returns**: <code>string</code> - "x seconds/minutes/hours/days"  

| Param | Type | Description |
| --- | --- | --- |
| timestamp | <code>number</code> | UNIX timestamp to convert |

<a name="Controller+misc.checkConnection"></a>

#### misc.checkConnection(url, [throwTimeout], [proxy]) ⇒ <code>Promise.&lt;{statusMessage: string, statusCode: (number\|null)}&gt;</code>
Pings a *https* URL to check if the service and this internet connection is working

**Kind**: static method of [<code>misc</code>](#Controller+misc)  
**Returns**: <code>Promise.&lt;{statusMessage: string, statusCode: (number\|null)}&gt;</code> - Resolves on response code 2xx and rejects on any other response code. Both are called with parameter `response` (Object) which has a `statusMessage` (String) and `statusCode` (Number) key. `statusCode` is `null` if request failed.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  | The URL of the service to check |
| [throwTimeout] | <code>boolean</code> | <code>false</code> | If true, the function will throw a timeout error if Steam can't be reached after 20 seconds |
| [proxy] | <code>Object</code> |  | Provide a proxy if the connection check should be made through a proxy instead of the local connection |

<a name="Controller+misc.splitProxyString"></a>

#### misc.splitProxyString(url) ⇒ <code>Object</code>
Splits a HTTP proxy URL into its parts

**Kind**: static method of [<code>misc</code>](#Controller+misc)  
**Returns**: <code>Object</code> - Object containing the proxy parts  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The HTTP proxy URL |

<a name="Controller+misc.cutStringsIntelligently"></a>

#### misc.cutStringsIntelligently(txt, limit, cutChars, threshold) ⇒ <code>Array</code>
Helper function which attempts to cut Strings intelligently and returns all parts. It will attempt to not cut words & links in half.
It is used by the steamChatInteraction helper but can be used in plugins as well.

**Kind**: static method of [<code>misc</code>](#Controller+misc)  
**Returns**: <code>Array</code> - Returns all parts of the string in an array  

| Param | Type | Description |
| --- | --- | --- |
| txt | <code>string</code> | The string to cut |
| limit | <code>number</code> | Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount. |
| cutChars | <code>Array.&lt;string&gt;</code> | Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"] |
| threshold | <code>number</code> | Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length |

<a name="Controller+info"></a>

### controller.info
Collection of various misc parameters

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+activeRequests"></a>

### controller.activeRequests : <code>Object.&lt;string, {status: string, type: string, amount: number, quotesArr: (Array.&lt;string&gt;\|undefined), requestedby: string, accounts: Array.&lt;Bot&gt;, thisIteration: number, retryAttempt: number, amountBeforeRetry: (number\|undefined), until: number, ipCooldownPenaltyAdded: (boolean\|undefined), failed: object}&gt;</code>
Stores all recent comment, vote etc. requests

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+data"></a>

### controller.data : [<code>DataManager</code>](#DataManager)
The dataManager object

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+updater"></a>

### controller.updater : <code>undefined</code>
The updater object

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+jobManager"></a>

### controller.jobManager : [<code>JobManager</code>](#JobManager)
The JobManager handles the periodic execution of functions which you can register at runtime

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+commandHandler"></a>

### controller.commandHandler : [<code>CommandHandler</code>](#CommandHandler)
The commandHandler object

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+pluginSystem"></a>

### controller.pluginSystem : [<code>PluginSystem</code>](#PluginSystem)
The pluginSystem handler

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+filters"></a>

### controller.filters : <code>Object</code>
Set of premade functions for filterAccounts()

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+filters"></a>

### controller.filters : <code>Object</code>
Set of premade functions for filterAccounts()

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+_start"></a>

### controller.\_start()
Internal: Initializes the bot by importing data from the disk, running the updater and finally logging in all bot accounts.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+_preLogin"></a>

### controller.\_preLogin()
Internal: Loads all parts of the application to get IntelliSense support after the updater ran and calls login() when done.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+restart"></a>

### controller.restart(data)
Restarts the whole application

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>string</code> | Optional: Stringified restartdata object that will be kept through restarts |

<a name="Controller+stop"></a>

### controller.stop()
Stops the whole application

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+login"></a>

### controller.login(firstLogin)
Attempts to log in all bot accounts which are currently offline one after another.
Creates a new bot object for every new account and reuses existing one if possible

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| firstLogin | <code>boolean</code> | Is set to true by controller if this is the first login to display more information |

<a name="Controller+_processFastLoginQueue"></a>

### controller.\_processFastLoginQueue(allAccounts)
Internal: Logs in accounts on different proxies synchronously

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| allAccounts | <code>Array</code> | Array of logininfo entries of accounts to log in |

<a name="Controller+_processSlowLoginQueue"></a>

### controller.\_processSlowLoginQueue(allAccounts)
Internal: Logs in accounts asynchronously to allow for user interaction

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| allAccounts | <code>Array</code> | Array of logininfo entries of accounts to log in |

<a name="Controller+addAccount"></a>

### controller.addAccount(accountName, password, [sharedSecret])
Adds a new account to the set of bot accounts in use and writes changes to accounts.txt

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | Username of the account |
| password | <code>string</code> | Password of the account |
| [sharedSecret] | <code>string</code> | Optional: Shared secret of the account |

<a name="Controller+removeAccount"></a>

### controller.removeAccount(accountName)
Removes an account from the active set of bot accounts and writes changes to accounts.txt

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | Username of the account to remove |

<a name="Controller+relogAccount"></a>

### controller.relogAccount(accountName)
Relogs an account

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | Username of the account to relog |

<a name="Controller+respreadProxies"></a>

### controller.respreadProxies()
Reloads and respreads all proxies and relogs affected accounts

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+filterAccounts"></a>

### controller.filterAccounts(predicate) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Filters the active set of bot accounts by a given criteria

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - Array of bot instances that match the criteria  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function that returns true if the account should be included in the result |

<a name="Controller+_dataUpdateEvent"></a>

### controller.\_dataUpdateEvent(key, oldData, newData)
Runs internal dataUpdate event code and emits dataUpdate event for plugins. The event is emitted whenever DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Which DataManager key got updated |
| oldData | <code>any</code> | Old content of the updated key |
| newData | <code>any</code> | New content of the updated key |

<a name="Controller+_readyEvent"></a>

### controller.\_readyEvent()
Runs internal ready event code and emits ready event for plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+_statusUpdateEvent"></a>

### controller.\_statusUpdateEvent(bot, newStatus)
Runs internal statusUpdate event code and emits statusUpdate event for plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot instance |
| newStatus | [<code>EStatus</code>](#Bot.EStatus) | The new status of this bot |

<a name="Controller+_steamGuardInputEvent"></a>

### controller.\_steamGuardInputEvent(bot, submitCode)
Emits steamGuardInput event for bot & plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot instance of the affected account |
| submitCode | <code>function</code> | Function to submit a code. Pass an empty string to skip the account. |

<a name="Controller+_steamGuardQrCodeEvent"></a>

### controller.\_steamGuardQrCodeEvent(bot, challengeUrl)
Emits steamGuardQrCode event for bot & plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot instance of the affected account |
| challengeUrl | <code>string</code> | The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App. |

<a name="Controller+checkLastcommentDB"></a>

### controller.checkLastcommentDB(bot)
Check if all friends are in lastcomment database

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot object of the account to check |

<a name="Controller+friendListCapacityCheck"></a>

### controller.friendListCapacityCheck(bot, callback)
Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot object of the account to check |
| callback | <code>function</code> | Called with `remaining` (Number) on success or `null` on failure |

<a name="Controller+_lastcommentUnfriendCheck"></a>

### controller.\_lastcommentUnfriendCheck()
Check for friends who haven't requested comments in config.unfriendtime days and unfriend them

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+getBots"></a>

### controller.getBots([statusFilter], [mapToObject]) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Retrieves all matching bot accounts and returns them.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [statusFilter] | <code>EStatus</code> \| <code>Array.&lt;EStatus&gt;</code> \| <code>string</code> | <code>EStatus.ONLINE</code> | Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned. |
| [mapToObject] | <code>boolean</code> | <code>false</code> | Optional: If true, an object will be returned where every bot object is mapped to their accountName. |

<a name="Controller+getBotsPerProxy"></a>

### controller.getBotsPerProxy([filterOffline]) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code> - Bot accounts mapped to their associated proxy  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [filterOffline] | <code>boolean</code> | <code>false</code> | Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand! |

<a name="Controller+_handleErrors"></a>

### controller.\_handleErrors()
Internal: Handles process's unhandledRejection & uncaughtException error events.
Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+handleSteamIdResolving"></a>

### controller.handleSteamIdResolving(str, expectedIdType, callback)
Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | The profileID argument provided by the user |
| expectedIdType | [<code>EIdTypes</code>](#EIdTypes) | The type of SteamID expected or `null` if type should be assumed. |
| callback | <code>function</code> | Called with `err` (String or null), `id` (String or null), `idType` (String or null) parameters on completion. The `id` param has the format `userID/appID` for type review and full input url for type discussion. |

<a name="Controller+logger"></a>

### controller.logger(type, str, nodate, remove, animation, printNow, cutToWidth)
Logs text to the terminal and appends it to the output.txt file.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field. |
| str | <code>string</code> | The text to log into the terminal |
| nodate | <code>boolean</code> | Setting to true will hide date and time in the message |
| remove | <code>boolean</code> | Setting to true will remove this message with the next one |
| animation | <code>Array.&lt;string&gt;</code> | Array containing animation frames as elements |
| printNow | <code>boolean</code> | Ignores the readyafterlogs check and force prints the message now |
| cutToWidth | <code>boolean</code> | Cuts the string to the width of the terminal |

<a name="Controller+_loggerOptionsUpdateAfterConfigLoad"></a>

### controller.\_loggerOptionsUpdateAfterConfigLoad(advancedconfig)
Internal: Call this function after loading advancedconfig.json to set previously inaccessible options

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| advancedconfig | <code>object</code> | The advancedconfig object imported by the DataManager |

<a name="Controller+_loggerLogAfterReady"></a>

### controller.\_loggerLogAfterReady()
Internal: Logs all held back messages from logAfterReady array

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+_dataUpdateEvent"></a>

### controller.\_dataUpdateEvent(key, oldData, newData)
Runs internal dataUpdate event code and emits dataUpdate event for plugins. The event is emitted whenever DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Which DataManager key got updated |
| oldData | <code>any</code> | Old content of the updated key |
| newData | <code>any</code> | New content of the updated key |

<a name="Controller+_readyEvent"></a>

### controller.\_readyEvent()
Runs internal ready event code and emits ready event for plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+_statusUpdateEvent"></a>

### controller.\_statusUpdateEvent(bot, newStatus)
Runs internal statusUpdate event code and emits statusUpdate event for plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot instance |
| newStatus | [<code>EStatus</code>](#Bot.EStatus) | The new status of this bot |

<a name="Controller+_steamGuardInputEvent"></a>

### controller.\_steamGuardInputEvent(bot, submitCode)
Emits steamGuardInput event for bot & plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot instance of the affected account |
| submitCode | <code>function</code> | Function to submit a code. Pass an empty string to skip the account. |

<a name="Controller+_steamGuardQrCodeEvent"></a>

### controller.\_steamGuardQrCodeEvent(bot, challengeUrl)
Emits steamGuardQrCode event for bot & plugins

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot instance of the affected account |
| challengeUrl | <code>string</code> | The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App. |

<a name="Controller+checkLastcommentDB"></a>

### controller.checkLastcommentDB(bot)
Check if all friends are in lastcomment database

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot object of the account to check |

<a name="Controller+friendListCapacityCheck"></a>

### controller.friendListCapacityCheck(bot, callback)
Checks the remaining space on the friendlist of a bot account, sends a warning message if it is less than 10 and force unfriends oldest lastcomment db user to always keep room for 1 friend.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | Bot object of the account to check |
| callback | <code>function</code> | Called with `remaining` (Number) on success or `null` on failure |

<a name="Controller+_lastcommentUnfriendCheck"></a>

### controller.\_lastcommentUnfriendCheck()
Check for friends who haven't requested comments in config.unfriendtime days and unfriend them

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+getBots"></a>

### controller.getBots([statusFilter], [mapToObject]) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Retrieves all matching bot accounts and returns them.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [statusFilter] | <code>EStatus</code> \| <code>Array.&lt;EStatus&gt;</code> \| <code>string</code> | <code>EStatus.ONLINE</code> | Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned. |
| [mapToObject] | <code>boolean</code> | <code>false</code> | Optional: If true, an object will be returned where every bot object is mapped to their accountName. |

<a name="Controller+getBotsPerProxy"></a>

### controller.getBotsPerProxy([filterOffline]) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code> - Bot accounts mapped to their associated proxy  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [filterOffline] | <code>boolean</code> | <code>false</code> | Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand! |

<a name="Controller+_handleErrors"></a>

### controller.\_handleErrors()
Internal: Handles process's unhandledRejection & uncaughtException error events.
Should a NPM related error be detected it attempts to reinstall all packages using our npminteraction helper function

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+handleSteamIdResolving"></a>

### controller.handleSteamIdResolving(str, expectedIdType, callback)
Handles converting URLs to steamIDs, determining their type if unknown and checking if it matches your expectation.
Note: You need to provide a full URL for discussions, curators & reviews. For discussions only type checking/determination is supported.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | The profileID argument provided by the user. If `null` the function will instantly callback with `null`. |
| expectedIdType | [<code>EIdTypes</code>](#EIdTypes) | The type of SteamID expected or `null` if type should be assumed. |
| callback | <code>function</code> | Called with `err` (String or null), `id` (String or null), `idType` (String or null) parameters on completion. The `id` param has the format `userID/appID` for type review and full input url for type discussion. |

<a name="Controller+logger"></a>

### controller.logger(type, str, nodate, remove, animation, printNow, cutToWidth)
Logs text to the terminal and appends it to the output.txt file.

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | String that determines the type of the log message. Can be info, warn, error, debug or an empty string to not use the field. |
| str | <code>string</code> | The text to log into the terminal |
| nodate | <code>boolean</code> | Setting to true will hide date and time in the message |
| remove | <code>boolean</code> | Setting to true will remove this message with the next one |
| animation | <code>Array.&lt;string&gt;</code> | Array containing animation frames as elements |
| printNow | <code>boolean</code> | Ignores the readyafterlogs check and force prints the message now |
| cutToWidth | <code>boolean</code> | Cuts the string to the width of the terminal |

<a name="Controller+_loggerOptionsUpdateAfterConfigLoad"></a>

### controller.\_loggerOptionsUpdateAfterConfigLoad(advancedconfig)
Internal: Call this function after loading advancedconfig.json to set previously inaccessible options

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| advancedconfig | <code>object</code> | The advancedconfig object imported by the DataManager |

<a name="Controller+_loggerLogAfterReady"></a>

### controller.\_loggerLogAfterReady()
Internal: Logs all held back messages from logAfterReady array

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+login"></a>

### controller.login(firstLogin)
Attempts to log in all bot accounts which are currently offline one after another.
Creates a new bot object for every new account and reuses existing one if possible

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| firstLogin | <code>boolean</code> | Is set to true by controller if this is the first login to display more information |

<a name="Controller+_processFastLoginQueue"></a>

### controller.\_processFastLoginQueue(allAccounts)
Internal: Logs in accounts on different proxies synchronously

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| allAccounts | <code>Array</code> | Array of logininfo entries of accounts to log in |

<a name="Controller+_processSlowLoginQueue"></a>

### controller.\_processSlowLoginQueue(allAccounts)
Internal: Logs in accounts asynchronously to allow for user interaction

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| allAccounts | <code>Array</code> | Array of logininfo entries of accounts to log in |

<a name="Controller+addAccount"></a>

### controller.addAccount(accountName, password, [sharedSecret])
Adds a new account to the set of bot accounts in use and writes changes to accounts.txt

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | Username of the account |
| password | <code>string</code> | Password of the account |
| [sharedSecret] | <code>string</code> | Optional: Shared secret of the account |

<a name="Controller+removeAccount"></a>

### controller.removeAccount(accountName)
Removes an account from the active set of bot accounts and writes changes to accounts.txt

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | Username of the account to remove |

<a name="Controller+relogAccount"></a>

### controller.relogAccount(accountName)
Relogs an account

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| accountName | <code>string</code> | Username of the account to relog |

<a name="Controller+respreadProxies"></a>

### controller.respreadProxies()
Reloads and respreads all proxies and relogs affected accounts

**Kind**: instance method of [<code>Controller</code>](#Controller)  
<a name="Controller+filterAccounts"></a>

### controller.filterAccounts(predicate) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Filters the active set of bot accounts by a given criteria

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - Array of bot instances that match the criteria  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function that returns true if the account should be included in the result |

