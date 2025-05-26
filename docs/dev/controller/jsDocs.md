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

