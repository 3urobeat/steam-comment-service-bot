# Bot
[⬅️ Go back to wiki home](../#readme) <a href="/src/bot/bot.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

When logging in, the controller creates a bot object for every Steam account the user has provided.  
It creates a SteamUser and SteamCommunity instance, which allow the Controller to use this bot account to interact with Steam.  
The bot object itself handles events for this specific account (e.g. chat messages), informs the Controller about connection losses, etc.  

&nbsp;

## Table of Contents
- [Event Handlers](./events.md)
- [Data](#data)
- [Functions](#functions)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## Data
The Bot object holds the following data:

### controller
Reference to the active [Controller](../controller/controller.md) object

## data
Reference to the active [DataManager](../dataManager/dataManager.md) object

## index
The login index of this bot account, matching the index of it in the logininfo object (and accounts.txt)  
Warning: This index can change at runtime if accounts are reordered. To uniquely identify an account, use its accountName.

## status
[EStatus](/src/bot/EStatus.js) of this bot account. Indicates whether the bot account is online, offline, skipped, etc.

Default: `EStatus.OFFLINE`

## friendMessageBlock
Array of steamID64s to ignore in the friendMessage event handler. This is used by readChatMessage() to prevent duplicate responses.

## proxyIndex


## loginData
Object containing login related information for this bot account with the following properties:
- `logOnOptions` (Object) - Object containing the login information of this bot account
- `logOnTries` (number) - Amount of logOnTries used in the most recent login/relog attempt
- `waitingFor2FA` (boolean) - Set by [sessionHandler](../sessionHandler/sessionHandler.md)'s handle2FA helper to prevent login timeout from triggering when waiting for user input
- `proxyIndex` (Number) - Index of the proxy in the [DataManager.proxies](../dataManager/dataManager.md#proxies) array which this account uses to connect to Steam
- `proxy` (String) - The proxy URL behind the used proxyIndex

## sessionHandler
Reference to the active [sessionHandler](../sessionHandler/sessionHandler.md) object for this bot object.

## user
Reference to the active [SteamUser](https://github.com/DoctorMcKay/node-steam-user) object for this bot account.  
This allows you to interact with Steam using this logged in Steam account.

## community
Reference to the active [SteamCommunity](https://github.com/DoctorMcKay/node-steamcommunity) object for this bot account.  
This allows you to interact with the SteamCommunity using this logged in Steam account.

&nbsp;

## Functions
All private functions, except the constructor, are prefixed with an `_` underscore. They should not be called from external modules (e.g. plugins).  

### (controller, index): void
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object
- `index` (number) - The loginindex of this account in the logininfo object

Constructor - Initializes an object which represents a user steam account

&nbsp;

### _loginToSteam(): void
Calls SteamUser logOn() for this account. This will either trigger the SteamUser loggedOn or error event.

### checkMsgBlock(steamID64, message): boolean
- `steamID64` (object) - The steamID64 of the message sender
- `message` (string) - The message string provided by the steam-user friendMessage event

Checks if user is blocked, has an active cooldown for spamming or isn't a friend.
Returns a boolean, indicating whether the user is blocked or not.

### handleLoginTimeout(): void
Handles aborting a login attempt should an account get stuck to prevent the bot from softlocking (see issue #139).

### handleMissingGameLicenses(): void
Handles checking for missing game licenses, requests them and then starts playing.

### sendChatMessage(_this, resInfo, txt, retry, part?): void
- `_this` (object) - The Bot object context
- `resInfo` (CommandHandler.[resInfo](../commandHandler/commandHandler.md#resInfo)) - Object containing information passed to command by friendMessage event
- `txt` (string) - The text to send
- `retry` (boolean) - Internal: true if this message called itself again to send failure message
- `part` (number) - Internal: Index of which part to send for messages larger than 750 chars
 
Our commandHandler respondModule implementation - Sends a message to a Steam user

### readChatMessage(steamID64, timeout): Promise
- `steamID64` (string) - The steamID64 of the user to read a message from
- `timeout` (number) - Time in ms after which the Promise will be resolved if user does not respond. Pass 0 to disable (not recommended)

Waits for a Steam Chat message from this user to this account and resolves their message content. The "normal" friendMessage event handler will be blocked for this user.  
Returns a Promise which will be resolved with a string on user response or `null` on timeout.