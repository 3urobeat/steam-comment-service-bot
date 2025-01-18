<a name="SessionHandler"></a>

## SessionHandler
**Kind**: global class  

* [SessionHandler](#SessionHandler)
    * [new SessionHandler(bot)](#new_SessionHandler_new)
    * [.hasStorageValidToken()](#SessionHandler+hasStorageValidToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.invalidateTokenInStorage()](#SessionHandler+invalidateTokenInStorage)
    * [.getToken()](#SessionHandler+getToken) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [.attemptTokenRenew()](#SessionHandler+attemptTokenRenew) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.hasStorageValidToken()](#SessionHandler+hasStorageValidToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.invalidateTokenInStorage()](#SessionHandler+invalidateTokenInStorage)

<a name="new_SessionHandler_new"></a>

### new SessionHandler(bot)
Constructor - Object oriented approach for handling session for one account


| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | The bot object of this account |

<a name="SessionHandler+hasStorageValidToken"></a>

### sessionHandler.hasStorageValidToken() ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves with `true` if a valid token was found, `false` otherwise  
<a name="SessionHandler+invalidateTokenInStorage"></a>

### sessionHandler.invalidateTokenInStorage()
Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+getToken"></a>

### sessionHandler.getToken() ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Handles getting a refresh token for steam-user to auth with

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - `refreshToken` on success or `null` on failure  
<a name="SessionHandler+attemptTokenRenew"></a>

### sessionHandler.attemptTokenRenew() ⇒ <code>Promise.&lt;boolean&gt;</code>
Attempts to renew the refreshToken used for the current session. Whether a new token will actually be issued is at the discretion of Steam.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Returns a promise which resolves with `true` if Steam issued a new token, `false` otherwise. Rejects if no token is stored in the database.  
<a name="SessionHandler+hasStorageValidToken"></a>

### sessionHandler.hasStorageValidToken() ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves with `true` if a valid token was found, `false` otherwise  
<a name="SessionHandler+invalidateTokenInStorage"></a>

### sessionHandler.invalidateTokenInStorage()
Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
