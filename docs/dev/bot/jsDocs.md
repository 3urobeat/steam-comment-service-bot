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
