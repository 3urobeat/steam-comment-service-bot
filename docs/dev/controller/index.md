# Controller
[⬅️ Go back to dev home](../#readme) <a href="/src/controller/controller.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [Events](#events)
- [Helpers](#helpers)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
The Controller is the center piece of the application.  
It is the entry point of the child process, which gets spawned by the [parent process](../starter.md).  
It stores references to all the other modules, does first checks (e.g. internet connection, unsupported nodejs version) and handles the startup.  

The parent process forks a child that loads `controller.js` into memory and sets a timestamp of startup as `process.argv[3]`.  
Any data which should be passed through a restart will be set as a stringified object at `process.argv[4]`.  
If the mentioned timestamp is within the last 2.5 seconds, `controller.js` will create a new Controller object and call `_start()` to start the application.  

Most functions are prototype functions linked to the existing Controller object at runtime, some may however still be normal exported functions.  

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

<a id="events"></a>

# Events
The events folder contains functions for events which the Controller supports.  
These functions are called by the Controller, which then in turn actually emit the event using the `controller.events` EventEmitter.  
This allows for running internal code (e.g. ready event) before an external module receives them.


### Table of Events
- [ready](#events-ready)
- [statusUpdate](#events-statusupdate)
- [steamGuardInput](#events-steamguardinput)
- [steamGuardQrCode](#events-steamguardqrcode)
- [dataUpdate](#events-dataupdate)

&nbsp;

<a id="events-ready"></a>

### ready <a href="/src/controller/events/ready.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when the bot finished logging in all bot accounts for the first time since the last start/restart.

Before emitting the event, the bot will
- ...log the ready messages containing a variety of useful information
- ...instruct the [DataManager](../dataManager/dataManager.md) to refresh the `cache.json` backups of all config files
- ...log held back log messages from during the startup
- ...perform various checks and display warnings if for example the friendlist space is running low
- ...and update the total login time in data.json.

No arguments.

<a id="events-statusupdate"></a>

### statusUpdate <a href="/src/controller/events/statusUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when any bot account changes their online status.

Before emitting the event, the bot will update the `status` property of the affected bot account to the new status.

The event is emitted with the parameters
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `newStatus` (Bot.[EStatus](/src/bot/EStatus.js)) - The new status of this bot

<a id="events-steamguardinput"></a>

### steamGuardInput <a href="/src/controller/events/steamGuardInput.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when any bot account requires a Steam Guard Code to be submitted before it can continue logging in.

The event is emitted with the parameters
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `submitCode` (function(string): void) - Function to submit a code. Pass an empty string to skip the account.

The `submitCode` function allows users to implement accepting Steam Guard Codes from users into their plugins. This is very cool.  
Check out how the [template plugin](https://github.com/3urobeat/steam-comment-bot-template-plugin/blob/main/plugin.js) implements the 
`steamGuardInput` event function (which is called by the PluginSystem when the event is emitted, instead of listening directly to it).

<a id="events-steamguardqrcode"></a>

### steamGuardQrCode <a href="/src/controller/events/steamGuardQrCode.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when any bot account is trying to log in using a QR-Code. A user needs to scan this QR-Code using their Steam Mobile App to confirm the login request.

The event is emitted with the parameters
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `challengeUrl` (string) - The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.

<a id="events-dataupdate"></a>

### dataUpdate <a href="/src/controller/events/dataUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
The event is emitted whenever DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.

The event is emitted with the parameters
- `key` (string) - Which DataManager key got updated
- `oldData` (any) - Old content of the updated key
- `newData` (any) - New content of the updated key

&nbsp;

<a id="helpers"></a>

# Helpers
The helpers folder contains functions which are regularly used, often by multiple files, also from other modules.  
Each module has their own helpers folder, containing helper functions which fit the best to that specific module, to keep the project structure organized.  

All prototype functions which are directly accessible from the active Controller object at runtime are already listed in the [Controller](./controller.md) docs page.  
This page only includes functions which are directly exported, meaning to use them you need to import that specific helper file in your code.

### Table of Helpers
- [misc.js](#helpers-miscjs)
- [npminteraction.js](#helpers-npmnteractionjs)

&nbsp;

<a id="helpers-miscjs"></a>

### misc.js <a href="/src/controller/helpers/misc.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Special Case: The functions in this helper are directly accessible from the Controller object to make using them easier. You can access them through the Controller `misc` object.

&nbsp;

<a id="helpers-npmnteractionjs"></a>

### npminteraction.js <a href="/src/controller/helpers/npminteraction.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="Controller"></a>

## Controller
**Kind**: global class  

* [Controller](#Controller)
    * [new Controller()](#new_Controller_new)
    * [.bots](#Controller+bots) : <code>Object.&lt;string, Bot&gt;</code>
    * [.main](#Controller+main) : [<code>Bot</code>](#Bot)
    * [.misc](#Controller+misc) : <code>undefined</code>
    * [.info](#Controller+info) : <code>Object</code>
    * [.activeRequests](#Controller+activeRequests) : <code>Object.&lt;string, {status: string, type: string, amount: number, quotesArr: (Array.&lt;string&gt;\|undefined), requestedby: string, accounts: Array.&lt;Bot&gt;, thisIteration: number, retryAttempt: number, amountBeforeRetry: (number\|undefined), until: number, ipCooldownPenaltyAdded: (boolean\|undefined), failed: object}&gt;</code>
    * [.data](#Controller+data) : [<code>DataManager</code>](#DataManager)
    * [.updater](#Controller+updater) : <code>undefined</code>
    * [.jobManager](#Controller+jobManager) : [<code>JobManager</code>](#JobManager)
    * [.commandHandler](#Controller+commandHandler) : [<code>CommandHandler</code>](#CommandHandler)
    * [.pluginSystem](#Controller+pluginSystem) : [<code>PluginSystem</code>](#PluginSystem)
    * [.filters](#Controller+filters) : <code>Object</code>
    * [.filters](#Controller+filters) : <code>Object</code>
    * [.restart(data)](#Controller+restart)
    * [.stop()](#Controller+stop)
    * [.login(firstLogin)](#Controller+login)
    * [.addAccount(accountName, password, [sharedSecret])](#Controller+addAccount)
    * [.removeAccount(accountName)](#Controller+removeAccount)
    * [.relogAccount(accountName)](#Controller+relogAccount)
    * [.respreadProxies()](#Controller+respreadProxies)
    * [.filterAccounts(predicate)](#Controller+filterAccounts) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.checkLastcommentDB(bot)](#Controller+checkLastcommentDB)
    * [.friendListCapacityCheck(bot, callback)](#Controller+friendListCapacityCheck)
    * [.getBots([statusFilter], [mapToObject])](#Controller+getBots) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsPerProxy([filterOffline])](#Controller+getBotsPerProxy) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
    * [.handleSteamIdResolving(str, expectedIdType, callback)](#Controller+handleSteamIdResolving)
    * [.logger(type, str, nodate, remove, animation, printNow, cutToWidth)](#Controller+logger)
    * [.checkLastcommentDB(bot)](#Controller+checkLastcommentDB)
    * [.friendListCapacityCheck(bot, callback)](#Controller+friendListCapacityCheck)
    * [.getBots([statusFilter], [mapToObject])](#Controller+getBots) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
    * [.getBotsPerProxy([filterOffline])](#Controller+getBotsPerProxy) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
    * [.handleSteamIdResolving(str, expectedIdType, callback)](#Controller+handleSteamIdResolving)
    * [.logger(type, str, nodate, remove, animation, printNow, cutToWidth)](#Controller+logger)
    * [.login(firstLogin)](#Controller+login)
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

### controller.misc : <code>undefined</code>
Collection of miscellaneous functions for easier access

**Kind**: instance property of [<code>Controller</code>](#Controller)  
<a name="Controller+info"></a>

### controller.info : <code>Object</code>
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

<a name="Controller+getBots"></a>

### controller.getBots([statusFilter], [mapToObject]) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Retrieves all matching bot accounts and returns them.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [statusFilter] | [<code>EStatus</code>](#EStatus) \| [<code>Array.&lt;EStatus&gt;</code>](#EStatus) \| <code>string</code> | <code>EStatus.ONLINE</code> | Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned. |
| [mapToObject] | <code>boolean</code> | <code>false</code> | Optional: If true, an object will be returned where every bot object is mapped to their accountName. |

<a name="Controller+getBotsPerProxy"></a>

### controller.getBotsPerProxy([filterOffline]) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number}&gt;</code> - Bot accounts mapped to their associated proxy  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [filterOffline] | <code>boolean</code> | <code>false</code> | Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand! |

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

<a name="Controller+getBots"></a>

### controller.getBots([statusFilter], [mapToObject]) ⇒ [<code>Array.&lt;Bot&gt;</code>](#Bot)
Retrieves all matching bot accounts and returns them.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: [<code>Array.&lt;Bot&gt;</code>](#Bot) - An array or object if `mapToObject == true` containing all matching bot accounts. Note: This JsDoc type param only specifies the default array version to get IntelliSense support.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [statusFilter] | [<code>EStatus</code>](#EStatus) \| [<code>Array.&lt;EStatus&gt;</code>](#EStatus) \| <code>string</code> | <code>EStatus.ONLINE</code> | Optional: EStatus or Array of EStatus's including account statuses to filter. Pass '*' to get all accounts. If omitted, only accs with status 'EStatus.ONLINE' will be returned. |
| [mapToObject] | <code>boolean</code> | <code>false</code> | Optional: If true, an object will be returned where every bot object is mapped to their accountName. |

<a name="Controller+getBotsPerProxy"></a>

### controller.getBotsPerProxy([filterOffline]) ⇒ <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
Retrieves bot accounts per proxy. This can be used to find the most and least used active proxies for example.

**Kind**: instance method of [<code>Controller</code>](#Controller)  
**Returns**: <code>Array.&lt;{bots: Array.&lt;Bot&gt;, proxy: string, proxyIndex: number, ip: string, isOnline: boolean, lastOnlineCheck: number}&gt;</code> - Bot accounts mapped to their associated proxy  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [filterOffline] | <code>boolean</code> | <code>false</code> | Set to true to remove proxies which are offline. Make sure to call `checkAllProxies()` beforehand! |

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

<a name="Controller+login"></a>

### controller.login(firstLogin)
Attempts to log in all bot accounts which are currently offline one after another.
Creates a new bot object for every new account and reuses existing one if possible

**Kind**: instance method of [<code>Controller</code>](#Controller)  

| Param | Type | Description |
| --- | --- | --- |
| firstLogin | <code>boolean</code> | Is set to true by controller if this is the first login to display more information |

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

