# Bot
[⬅️ Go back to dev home](../#readme) <a href="/src/bot/bot.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [Events](#events)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
When logging in, the controller creates a bot object for every Steam account the user has provided.  
It creates a SteamUser and SteamCommunity instance, which allow the Controller to use this bot account to interact with Steam.  
The bot object itself handles events for this specific account (e.g. chat messages), informs the Controller about connection losses, etc.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

### index
Each bot account gets an index assigned during the first login.  
The index property must match to the index of the corresponding entry inside the `data.logininfo` array.  
Should you want to modify the account order during runtime, you must also make the same change in the logininfo array.

&nbsp;

<a id="events"></a>

# Events
Each bot object handles their own [SteamUser](https://github.com/DoctorMcKay/node-steam-user) events.  
These event handlers are located inside the bot events folder and contain each a prototype function for attaching themselves.  
These functions follow the naming scheme `_attachSteamEventNameEvent` and are being called by the Bot constructor.  


### Table of Contents
- [debug](#events-debug)
- [disconnected](#events-disconnected)
- [error](#events-error)
- [friendMessage](#events-friendmessage)
- [loggedOn](#events-loggedon)
- [relationship](#events-relationship)
- [webSession](#events-websession)

&nbsp;

<a id="events-debug"></a>

## debug & debug-verbose <a href="/src/bot/events/debug.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
The content of these events is logged to the terminal when `steamUserDebug` and `steamUserDebugVerbose` are set to `true` in the `advancedconfig.json`.

<a id="events-disconnected"></a>

## disconnected <a href="/src/bot/events/disconnected.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles a disconnect by logging to the terminal, updating its status and trying to relog itself, unless it is an intentional log off.

<a id="events-error"></a>

## error <a href="/src/bot/events/error.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles login errors by logging to the terminal, updating its status and either retrying the login or skipping the account.

<a id="events-friendmessage"></a>

## friendMessage <a href="/src/bot/events/friendMessage.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles Steam Chat messages to this account.  
If this is the main account it will instruct the [CommandHandler](../commandHandler/commandHandler.md) to run the command or apply a cooldown if the user is spamming.  
If this is a child account, it will respond with a message pointing to the main account.

<a id="events-loggedon"></a>

## loggedOn <a href="/src/bot/events/loggedOn.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Logs a message, sets the online status and increments the progress bar (on initial login) when this bot account establishes a connection to Steam.

<a id="events-relationship"></a>

## relationship <a href="/src/bot/events/relationship.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles an incoming friend request or group invite by adding the user to the `lastcomment.db` database and inviting them to the group set in `config.json`.

<a id="events-websession"></a>

## webSession <a href="/src/bot/events/webSession.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles setting cookies, accepting friend requests & group invites while the bot was offline, updates the bot's status, performs a few checks and starts playing games.  
This event is fired after loggedOn when this bot account establishes a connection to Steam.  

After this event was handled, a bot account is considered to be online and ready to be used.

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="Bot"></a>

## Bot
**Kind**: global class  

* [Bot](#Bot)
    * [new Bot(controller, index)](#new_Bot_new)
    * _instance_
        * [.controller](#Bot+controller) : [<code>Controller</code>](#Controller)
        * [.data](#Bot+data) : [<code>DataManager</code>](#DataManager)
        * [.index](#Bot+index) : <code>number</code>
        * [.status](#Bot+status) : <code>EStatus</code>
        * [.friendMessageBlock](#Bot+friendMessageBlock) : <code>Array.&lt;string&gt;</code>
        * [.loginData](#Bot+loginData)
            * [.logOnOptions](#Bot+loginData.logOnOptions) : <code>Object</code>
        * [.accountName](#Bot+accountName) : <code>string</code>
        * [.lastDisconnect](#Bot+lastDisconnect)
        * [.user](#Bot+user) : <code>SteamUser</code>
        * [.community](#Bot+community) : <code>SteamCommunity</code>
        * [._loginToSteam()](#Bot+_loginToSteam)
        * [._attachSteamDebugEvent()](#Bot+_attachSteamDebugEvent)
        * [._attachSteamDisconnectedEvent()](#Bot+_attachSteamDisconnectedEvent)
        * [._attachSteamErrorEvent()](#Bot+_attachSteamErrorEvent)
        * [._attachSteamFriendMessageEvent()](#Bot+_attachSteamFriendMessageEvent)
        * [._attachSteamLoggedOnEvent()](#Bot+_attachSteamLoggedOnEvent)
        * [._attachSteamFriendRelationshipEvent()](#Bot+_attachSteamFriendRelationshipEvent)
        * [._attachSteamGroupRelationshipEvent()](#Bot+_attachSteamGroupRelationshipEvent)
        * [._attachSteamWebSessionEvent()](#Bot+_attachSteamWebSessionEvent)
        * [.checkMsgBlock(steamID64, message)](#Bot+checkMsgBlock) ⇒ <code>boolean</code>
        * [.checkForFamilyView()](#Bot+checkForFamilyView) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.unlockFamilyView()](#Bot+unlockFamilyView) ⇒ <code>Promise.&lt;void&gt;</code>
        * [._getFamilyViewCodeFromStorage(callback)](#Bot+_getFamilyViewCodeFromStorage)
        * [._saveFamilyViewCodeToStorage(familyViewCode)](#Bot+_saveFamilyViewCodeToStorage)
        * [.handleLoginTimeout()](#Bot+handleLoginTimeout)
        * [.handleMissingGameLicenses()](#Bot+handleMissingGameLicenses)
        * [.switchProxy(newProxyIndex)](#Bot+switchProxy)
        * [.checkAndSwitchMyProxy()](#Bot+checkAndSwitchMyProxy) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.handleRelog()](#Bot+handleRelog)
        * [.sendChatMessage(_this, resInfo, txt, retry, part)](#Bot+sendChatMessage)
        * [.readChatMessage(steamID64, timeout)](#Bot+readChatMessage) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
        * [._attachSteamDebugEvent()](#Bot+_attachSteamDebugEvent)
        * [._attachSteamDisconnectedEvent()](#Bot+_attachSteamDisconnectedEvent)
        * [._attachSteamErrorEvent()](#Bot+_attachSteamErrorEvent)
        * [._attachSteamFriendMessageEvent()](#Bot+_attachSteamFriendMessageEvent)
        * [._attachSteamLoggedOnEvent()](#Bot+_attachSteamLoggedOnEvent)
        * [._attachSteamFriendRelationshipEvent()](#Bot+_attachSteamFriendRelationshipEvent)
        * [._attachSteamGroupRelationshipEvent()](#Bot+_attachSteamGroupRelationshipEvent)
        * [._attachSteamWebSessionEvent()](#Bot+_attachSteamWebSessionEvent)
        * [.checkMsgBlock(steamID64, message)](#Bot+checkMsgBlock) ⇒ <code>boolean</code>
        * [.checkForFamilyView()](#Bot+checkForFamilyView) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.unlockFamilyView()](#Bot+unlockFamilyView) ⇒ <code>Promise.&lt;void&gt;</code>
        * [._getFamilyViewCodeFromStorage(callback)](#Bot+_getFamilyViewCodeFromStorage)
        * [._saveFamilyViewCodeToStorage(familyViewCode)](#Bot+_saveFamilyViewCodeToStorage)
        * [.handleLoginTimeout()](#Bot+handleLoginTimeout)
        * [.handleMissingGameLicenses()](#Bot+handleMissingGameLicenses)
        * [.switchProxy(newProxyIndex)](#Bot+switchProxy)
        * [.checkAndSwitchMyProxy()](#Bot+checkAndSwitchMyProxy) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.handleRelog()](#Bot+handleRelog)
        * [.sendChatMessage(_this, resInfo, txt, retry, part)](#Bot+sendChatMessage)
        * [.readChatMessage(steamID64, timeout)](#Bot+readChatMessage) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * _static_
        * [.EStatus](#Bot.EStatus) : <code>enum</code>

<a name="new_Bot_new"></a>

### new Bot(controller, index)
Constructor - Initializes an object which represents a user steam account


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the controller object |
| index | <code>number</code> | The index of this account in the logininfo object |

<a name="Bot+controller"></a>

### bot.controller : [<code>Controller</code>](#Controller)
Reference to the controller object

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+data"></a>

### bot.data : [<code>DataManager</code>](#DataManager)
Reference to the DataManager object

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+index"></a>

### bot.index : <code>number</code>
Login index of this bot account

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+status"></a>

### bot.status : <code>EStatus</code>
Status of this bot account

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+friendMessageBlock"></a>

### bot.friendMessageBlock : <code>Array.&lt;string&gt;</code>
SteamID64's to ignore in the friendMessage event handler. This is used by readChatMessage() to prevent duplicate responses.

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+loginData"></a>

### bot.loginData
Additional login related information for this bot account

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+loginData.logOnOptions"></a>

#### loginData.logOnOptions : <code>Object</code>
**Kind**: static property of [<code>loginData</code>](#Bot+loginData)  
<a name="Bot+accountName"></a>

### bot.accountName : <code>string</code>
Username of this bot account

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+lastDisconnect"></a>

### bot.lastDisconnect
Stores the timestamp and reason of the last disconnect. This is used by handleRelog() to take proper action

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+user"></a>

### bot.user : <code>SteamUser</code>
This SteamUser instance

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+community"></a>

### bot.community : <code>SteamCommunity</code>
This SteamCommunity instance

**Kind**: instance property of [<code>Bot</code>](#Bot)  
<a name="Bot+_loginToSteam"></a>

### bot.\_loginToSteam()
Calls SteamUser logOn() for this account. This will either trigger the SteamUser loggedOn or error event.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamDebugEvent"></a>

### bot.\_attachSteamDebugEvent()
Handles the SteamUser debug events if enabled in advancedconfig

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamDisconnectedEvent"></a>

### bot.\_attachSteamDisconnectedEvent()
Handles the SteamUser disconnect event and tries to relog the account

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamErrorEvent"></a>

### bot.\_attachSteamErrorEvent()
Handles the SteamUser error event

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamFriendMessageEvent"></a>

### bot.\_attachSteamFriendMessageEvent()
Handles messages, cooldowns and executes commands.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamLoggedOnEvent"></a>

### bot.\_attachSteamLoggedOnEvent()
Do some stuff when account is logged in

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamFriendRelationshipEvent"></a>

### bot.\_attachSteamFriendRelationshipEvent()
Accepts a friend request, adds the user to the lastcomment.db database and invites him to your group

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamGroupRelationshipEvent"></a>

### bot.\_attachSteamGroupRelationshipEvent()
Accepts a group invite if acceptgroupinvites in the config is true

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamWebSessionEvent"></a>

### bot.\_attachSteamWebSessionEvent()
Handles setting cookies and accepting offline friend & group invites

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+checkMsgBlock"></a>

### bot.checkMsgBlock(steamID64, message) ⇒ <code>boolean</code>
Checks if user is blocked, has an active cooldown for spamming or isn't a friend

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>boolean</code> - `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled  

| Param | Type | Description |
| --- | --- | --- |
| steamID64 | <code>object</code> | The steamID64 of the message sender |
| message | <code>string</code> | The message string provided by steam-user friendMessage event |

<a name="Bot+checkForFamilyView"></a>

### bot.checkForFamilyView() ⇒ <code>Promise.&lt;boolean&gt;</code>
Attempts to check if this account has family view (feature to restrict features for child accounts) enabled

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Returns a Promise which resolves with a boolean, indicating whether family view is enabled or not. If request failed, `false` is returned.  
<a name="Bot+unlockFamilyView"></a>

### bot.unlockFamilyView() ⇒ <code>Promise.&lt;void&gt;</code>
Requests family view unlock key from user and attempts to unlock it

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Returns a Promise which resolves when done  
<a name="Bot+_getFamilyViewCodeFromStorage"></a>

### bot.\_getFamilyViewCodeFromStorage(callback)
Internal - Attempts to get a cached family view code for this account from tokens.db

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Called with `familyViewCode` (String) on success or `null` on failure |

<a name="Bot+_saveFamilyViewCodeToStorage"></a>

### bot.\_saveFamilyViewCodeToStorage(familyViewCode)
Internal - Saves a new family view code for this account to tokens.db

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| familyViewCode | <code>string</code> | The family view code to store |

<a name="Bot+handleLoginTimeout"></a>

### bot.handleLoginTimeout()
Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+handleMissingGameLicenses"></a>

### bot.handleMissingGameLicenses()
Handles checking for missing game licenses, requests them and then starts playing

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+switchProxy"></a>

### bot.switchProxy(newProxyIndex)
Changes the proxy of this bot account.

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| newProxyIndex | <code>number</code> | Index of the new proxy inside the DataManager.proxies array. |

<a name="Bot+checkAndSwitchMyProxy"></a>

### bot.checkAndSwitchMyProxy() ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks host internet connection, updates the status of all proxies checked >2.5 min ago and switches the proxy of this bot account if necessary.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves with a boolean indicating whether the proxy was switched when done. A relog is triggered when the proxy was switched.  
<a name="Bot+handleRelog"></a>

### bot.handleRelog()
Attempts to get this account, after failing all logOnRetries, back online after some time. Does not apply to initial logins.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+sendChatMessage"></a>

### bot.sendChatMessage(_this, resInfo, txt, retry, part)
Our commandHandler respondModule implementation - Sends a message to a Steam user

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| _this | <code>object</code> | The Bot object context |
| resInfo | [<code>resInfo</code>](#resInfo) | Object containing information passed to command by friendMessage event |
| txt | <code>string</code> | The text to send |
| retry | <code>boolean</code> | Internal: true if this message called itself again to send failure message |
| part | <code>number</code> | Internal: Index of which part to send for messages larger than 750 chars |

<a name="Bot+readChatMessage"></a>

### bot.readChatMessage(steamID64, timeout) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - Resolved with `String` on response or `null` on timeout.  

| Param | Type | Description |
| --- | --- | --- |
| steamID64 | <code>string</code> | The steamID64 of the user to read a message from |
| timeout | <code>number</code> | Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended) |

<a name="Bot+_attachSteamDebugEvent"></a>

### bot.\_attachSteamDebugEvent()
Handles the SteamUser debug events if enabled in advancedconfig

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamDisconnectedEvent"></a>

### bot.\_attachSteamDisconnectedEvent()
Handles the SteamUser disconnect event and tries to relog the account

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamErrorEvent"></a>

### bot.\_attachSteamErrorEvent()
Handles the SteamUser error event

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamFriendMessageEvent"></a>

### bot.\_attachSteamFriendMessageEvent()
Handles messages, cooldowns and executes commands.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamLoggedOnEvent"></a>

### bot.\_attachSteamLoggedOnEvent()
Do some stuff when account is logged in

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamFriendRelationshipEvent"></a>

### bot.\_attachSteamFriendRelationshipEvent()
Accepts a friend request, adds the user to the lastcomment.db database and invites him to your group

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamGroupRelationshipEvent"></a>

### bot.\_attachSteamGroupRelationshipEvent()
Accepts a group invite if acceptgroupinvites in the config is true

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+_attachSteamWebSessionEvent"></a>

### bot.\_attachSteamWebSessionEvent()
Handles setting cookies and accepting offline friend & group invites

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+checkMsgBlock"></a>

### bot.checkMsgBlock(steamID64, message) ⇒ <code>boolean</code>
Checks if user is blocked, has an active cooldown for spamming or isn't a friend

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>boolean</code> - `true` if friendMessage event shouldn't be handled, `false` if user is allowed to be handled  

| Param | Type | Description |
| --- | --- | --- |
| steamID64 | <code>object</code> | The steamID64 of the message sender |
| message | <code>string</code> | The message string provided by steam-user friendMessage event |

<a name="Bot+checkForFamilyView"></a>

### bot.checkForFamilyView() ⇒ <code>Promise.&lt;boolean&gt;</code>
Attempts to check if this account has family view (feature to restrict features for child accounts) enabled

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Returns a Promise which resolves with a boolean, indicating whether family view is enabled or not. If request failed, `false` is returned.  
<a name="Bot+unlockFamilyView"></a>

### bot.unlockFamilyView() ⇒ <code>Promise.&lt;void&gt;</code>
Requests family view unlock key from user and attempts to unlock it

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Returns a Promise which resolves when done  
<a name="Bot+_getFamilyViewCodeFromStorage"></a>

### bot.\_getFamilyViewCodeFromStorage(callback)
Internal - Attempts to get a cached family view code for this account from tokens.db

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Called with `familyViewCode` (String) on success or `null` on failure |

<a name="Bot+_saveFamilyViewCodeToStorage"></a>

### bot.\_saveFamilyViewCodeToStorage(familyViewCode)
Internal - Saves a new family view code for this account to tokens.db

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| familyViewCode | <code>string</code> | The family view code to store |

<a name="Bot+handleLoginTimeout"></a>

### bot.handleLoginTimeout()
Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139)

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+handleMissingGameLicenses"></a>

### bot.handleMissingGameLicenses()
Handles checking for missing game licenses, requests them and then starts playing

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+switchProxy"></a>

### bot.switchProxy(newProxyIndex)
Changes the proxy of this bot account.

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| newProxyIndex | <code>number</code> | Index of the new proxy inside the DataManager.proxies array. |

<a name="Bot+checkAndSwitchMyProxy"></a>

### bot.checkAndSwitchMyProxy() ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks host internet connection, updates the status of all proxies checked >2.5 min ago and switches the proxy of this bot account if necessary.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves with a boolean indicating whether the proxy was switched when done. A relog is triggered when the proxy was switched.  
<a name="Bot+handleRelog"></a>

### bot.handleRelog()
Attempts to get this account, after failing all logOnRetries, back online after some time. Does not apply to initial logins.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
<a name="Bot+sendChatMessage"></a>

### bot.sendChatMessage(_this, resInfo, txt, retry, part)
Our commandHandler respondModule implementation - Sends a message to a Steam user

**Kind**: instance method of [<code>Bot</code>](#Bot)  

| Param | Type | Description |
| --- | --- | --- |
| _this | [<code>Bot</code>](#Bot) | The Bot object context |
| resInfo | [<code>resInfo</code>](#resInfo) | Object containing information passed to command by friendMessage event. Supported by this handler: prefix, charLimit, cutChars |
| txt | <code>string</code> | The text to send |
| retry | <code>number</code> | Internal: Counter of retries for this part if sending failed |
| part | <code>number</code> | Internal: Index of which part to send for messages larger than charLimit chars |

<a name="Bot+readChatMessage"></a>

### bot.readChatMessage(steamID64, timeout) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.

**Kind**: instance method of [<code>Bot</code>](#Bot)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - Resolved with `String` on response or `null` on timeout.  

| Param | Type | Description |
| --- | --- | --- |
| steamID64 | <code>string</code> | The steamID64 of the user to read a message from |
| timeout | <code>number</code> | Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended) |

<a name="Bot.EStatus"></a>

### Bot.EStatus : <code>enum</code>
Status which a bot object can have

**Kind**: static enum of [<code>Bot</code>](#Bot)  
