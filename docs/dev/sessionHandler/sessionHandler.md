# SessionHandler
[⬅️ Go back to dev home](../#readme) <a href="/src/sessions/sessionHandler.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

Every [Bot](../bot/bot.md) object creates its own sessionHandler object.  
The sessionHandler handles getting a refreshToken to login a bot account into Steam.  
To do so, it either uses an existing refreshToken from the [tokens.db](../dataManager/dataManager.md#tokensdb) database or uses the user provided login credentials to create a new session by retrieving a Steam Guard Code.

The sessionHandler module also periodically checks for tokens which expire soon and provides various functions for interacting with the [tokens.db](../dataManager/dataManager.md#tokensdb) database.

&nbsp;

## Table Of Contents
- [Data](#data)
- [Functions](#functions)
- [Events](#events-)

&nbsp;

## Data
The SessionHandler object holds the following data:

### bot
Reference to the active [Bot](../bot/bot.md) object

### controller
Reference to the active [Controller](../controller/controller.md) object

### getTokenPromise
Promise which will be populated when [getToken()](#gettoken---void) is called.  
This is used to resolve the Promise from within another function inside the module.

### session
SteamSession LoginSession object which is populated at runtime when `_attemptCredentialsLogin()` runs.

### tokensdb
Reference to the DataManager tokensdb reference.

### logOnOptions
The loginOnOptions object for this bot account

&nbsp;

## Functions
All private functions, except the constructor, are prefixed with an `_` underscore. They should not be called from external modules (e.g. plugins).  

### (bot): void
- `bot` ([Bot](../bot/bot.md)) - Reference to the Bot object which spawns this SessionHandler instance

Constructor - Object oriented approach for handling session for one account

&nbsp;

### getToken(): Promise
Handles getting a refresh token for steam-user to auth with.

Returns a Promise which will be resolved with `refreshToken` (string) on success or `null` on failure.

### _resolvePromise(token): void
- `token` (string) - The token to resolve with or null when account should be skipped

Internal:  
Handles resolving the getToken() promise and skipping the account if necessary

### _attemptCredentialsLogin(): void
Internal:  
Attempts to log into account with credentials

### attemptTokenRenew(): Boolean
Attempts to renew the refreshToken used for the current session. Whether a new token will actually be issued is at the discretion of Steam.

Returns a promise which resolves with `true` if Steam issued a new token, `false` otherwise. Rejects if no token is stored in the database.

### _attachEvents(): void
Internal:  
Attaches listeners to all steam-session events we care about

### _handle2FA(res): void
- `res` (object) - Response object from startWithCredentials() promise

Internal:  
Handles submitting 2FA code

### _get2FAUserInput(): void
Internal:  
Helper function to get 2FA code from user and passing it to accept function or skipping account if desired

### _acceptSteamGuardCode(code): void
- `code` (string) - Input from user

Internal:  
Helper function to make accepting and re-requesting invalid steam guard codes easier

### _handleCredentialsLoginError(err): void
- `err` (any) - Error thrown by startWithCredentials()

Helper function to make handling login errors easier.

### _getTokenFromStorage(callback): void
- `callback` (function(string|null): void) - Called with `refreshToken` (String) on success or `null` on failure

Internal:  
Attempts to get a token for this account from tokens.db and checks if it's valid

### _saveTokenToStorage(token): void
- `token` (string) - The refreshToken to store

Internal:  
Saves a new token for this account to tokens.db

### invalidateTokenInStorage(): void
Remove the token of this account from tokens.db.  
Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.

&nbsp;

## Events <a href="/src/sessions/events/sessionEvents.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
The SessionHandler handles the following [node-steam-session](https://github.com/DoctorMcKay/node-steam-session) events:

### debug
Logs steam-session debug messages to the terminal if `steamSessionDebug` is set to true in the `advancedconfig.json`.

### authenticated
Fires when Steam accepted our login request, for example when the user entered their correct Steam Guard Code.  
This calls [_resolvePromise()](#_resolvepromisetoken-void) with the now populated [session](#session).refreshToken property as parameter.

### timeout
Logs warning to the terminal and calls [_resolvePromise()](#_resolvepromisetoken-void) with `null`.

### error
Logs error to the terminal and calls [_resolvePromise()](#_resolvepromisetoken-void) with `null`.