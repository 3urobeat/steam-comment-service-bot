# SessionHandler
[⬅️ Go back to dev home](../#readme) <a href="/src/sessions/sessionHandler.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
Every [Bot](../bot/index.md) object creates its own sessionHandler object.  
The sessionHandler handles getting a refreshToken to login a bot account into Steam.  
To do so, it either uses an existing refreshToken from the [tokens.db](../dataManager/index.md#tokensdb) database or uses the user provided login credentials to create a new session by retrieving a Steam Guard Code.

The sessionHandler module also periodically checks for tokens which expire soon and provides various functions for interacting with the [tokens.db](../dataManager/index.md#tokensdb) database.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="SessionHandler"></a>

## SessionHandler
**Kind**: global class  

* [SessionHandler](#SessionHandler)
    * [new SessionHandler(bot)](#new_SessionHandler_new)
    * [._attachEvents()](#SessionHandler+_attachEvents)
    * [._handle2FA(res)](#SessionHandler+_handle2FA)
    * [._get2FAUserInput()](#SessionHandler+_get2FAUserInput)
    * [._acceptSteamGuardCode(code)](#SessionHandler+_acceptSteamGuardCode)
    * [._handleQRCode(res)](#SessionHandler+_handleQRCode)
    * [._handleCredentialsLoginError(err)](#SessionHandler+_handleCredentialsLoginError)
    * [._handleQrCodeLoginError(err)](#SessionHandler+_handleQrCodeLoginError)
    * [.hasStorageValidToken()](#SessionHandler+hasStorageValidToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [._getTokenFromStorage(callback)](#SessionHandler+_getTokenFromStorage)
    * [._saveTokenToStorage(token)](#SessionHandler+_saveTokenToStorage)
    * [.invalidateTokenInStorage()](#SessionHandler+invalidateTokenInStorage)
    * [.getToken()](#SessionHandler+getToken) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [._resolvePromise(token)](#SessionHandler+_resolvePromise)
    * [._attemptCredentialsLogin()](#SessionHandler+_attemptCredentialsLogin)
    * [.attemptTokenRenew()](#SessionHandler+attemptTokenRenew) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [._attachEvents()](#SessionHandler+_attachEvents)
    * [._handle2FA(res)](#SessionHandler+_handle2FA)
    * [._get2FAUserInput()](#SessionHandler+_get2FAUserInput)
    * [._acceptSteamGuardCode(code)](#SessionHandler+_acceptSteamGuardCode)
    * [._handleQRCode(res)](#SessionHandler+_handleQRCode)
    * [._handleCredentialsLoginError(err)](#SessionHandler+_handleCredentialsLoginError)
    * [._handleQrCodeLoginError(err)](#SessionHandler+_handleQrCodeLoginError)
    * [.hasStorageValidToken()](#SessionHandler+hasStorageValidToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [._getTokenFromStorage(callback)](#SessionHandler+_getTokenFromStorage)
    * [._saveTokenToStorage(token)](#SessionHandler+_saveTokenToStorage)
    * [.invalidateTokenInStorage()](#SessionHandler+invalidateTokenInStorage)

<a name="new_SessionHandler_new"></a>

### new SessionHandler(bot)
Constructor - Object oriented approach for handling session for one account


| Param | Type | Description |
| --- | --- | --- |
| bot | [<code>Bot</code>](#Bot) | The bot object of this account |

<a name="SessionHandler+_attachEvents"></a>

### sessionHandler.\_attachEvents()
Internal: Attaches listeners to all steam-session events we care about

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+_handle2FA"></a>

### sessionHandler.\_handle2FA(res)
Internal: Handles submitting 2FA code

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| res | <code>StartSessionResponse</code> | Response object from startWithCredentials() promise |

<a name="SessionHandler+_get2FAUserInput"></a>

### sessionHandler.\_get2FAUserInput()
Internal: Helper function to get 2FA code from user and passing it to accept function or skipping account if desired

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+_acceptSteamGuardCode"></a>

### sessionHandler.\_acceptSteamGuardCode(code)
Internal: Helper function to make accepting and re-requesting invalid steam guard codes easier

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | Input from user |

<a name="SessionHandler+_handleQRCode"></a>

### sessionHandler.\_handleQRCode(res)
Handles displaying a QR Code to login using the Steam Mobile App

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| res | <code>StartSessionResponse</code> | Response object from startWithQR() promise |

<a name="SessionHandler+_handleCredentialsLoginError"></a>

### sessionHandler.\_handleCredentialsLoginError(err)
Helper function to make handling login errors easier

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>\*</code> | Error thrown by startWithCredentials() |

<a name="SessionHandler+_handleQrCodeLoginError"></a>

### sessionHandler.\_handleQrCodeLoginError(err)
Helper function to make handling login errors easier

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>\*</code> | Error thrown by startWithQR() |

<a name="SessionHandler+hasStorageValidToken"></a>

### sessionHandler.hasStorageValidToken() ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves with `true` if a valid token was found, `false` otherwise  
<a name="SessionHandler+_getTokenFromStorage"></a>

### sessionHandler.\_getTokenFromStorage(callback)
Internal - Attempts to get a token for this account from tokens.db and checks if it's valid

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Called with `refreshToken` (String) on success or `null` on failure |

<a name="SessionHandler+_saveTokenToStorage"></a>

### sessionHandler.\_saveTokenToStorage(token)
Internal - Saves a new token for this account to tokens.db

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | The refreshToken to store |

<a name="SessionHandler+invalidateTokenInStorage"></a>

### sessionHandler.invalidateTokenInStorage()
Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+getToken"></a>

### sessionHandler.getToken() ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Handles getting a refresh token for steam-user to auth with

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - `refreshToken` on success or `null` on failure  
<a name="SessionHandler+_resolvePromise"></a>

### sessionHandler.\_resolvePromise(token)
Internal - Handles resolving the getToken() promise and skipping the account if necessary

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | The token to resolve with or null when account should be skipped |

<a name="SessionHandler+_attemptCredentialsLogin"></a>

### sessionHandler.\_attemptCredentialsLogin()
Internal - Attempts to log into account with credentials

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+attemptTokenRenew"></a>

### sessionHandler.attemptTokenRenew() ⇒ <code>Promise.&lt;boolean&gt;</code>
Attempts to renew the refreshToken used for the current session. Whether a new token will actually be issued is at the discretion of Steam.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Returns a promise which resolves with `true` if Steam issued a new token, `false` otherwise. Rejects if no token is stored in the database.  
<a name="SessionHandler+_attachEvents"></a>

### sessionHandler.\_attachEvents()
Internal: Attaches listeners to all steam-session events we care about

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+_handle2FA"></a>

### sessionHandler.\_handle2FA(res)
Internal: Handles submitting 2FA code

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| res | <code>object</code> | Response object from startWithCredentials() promise |

<a name="SessionHandler+_get2FAUserInput"></a>

### sessionHandler.\_get2FAUserInput()
Internal: Helper function to get 2FA code from user and passing it to accept function or skipping account if desired

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
<a name="SessionHandler+_acceptSteamGuardCode"></a>

### sessionHandler.\_acceptSteamGuardCode(code)
Internal: Helper function to make accepting and re-requesting invalid steam guard codes easier

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | Input from user |

<a name="SessionHandler+_handleQRCode"></a>

### sessionHandler.\_handleQRCode(res)
Handles displaying a QR Code to login using the Steam Mobile App

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| res | <code>StartSessionResponse</code> | Response object from startWithQR() promise |

<a name="SessionHandler+_handleCredentialsLoginError"></a>

### sessionHandler.\_handleCredentialsLoginError(err)
Helper function to make handling login errors easier

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>\*</code> | Error thrown by startWithCredentials() |

<a name="SessionHandler+_handleQrCodeLoginError"></a>

### sessionHandler.\_handleQrCodeLoginError(err)
Helper function to make handling login errors easier

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>\*</code> | Error thrown by startWithQR() |

<a name="SessionHandler+hasStorageValidToken"></a>

### sessionHandler.hasStorageValidToken() ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if the database contains a valid token for this account. You can assume that the next login attempt with this token will succeed if `true` is returned.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves with `true` if a valid token was found, `false` otherwise  
<a name="SessionHandler+_getTokenFromStorage"></a>

### sessionHandler.\_getTokenFromStorage(callback)
Internal - Attempts to get a token for this account from tokens.db and checks if it's valid

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Called with `refreshToken` (String) on success or `null` on failure |

<a name="SessionHandler+_saveTokenToStorage"></a>

### sessionHandler.\_saveTokenToStorage(token)
Internal - Saves a new token for this account to tokens.db

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | The refreshToken to store |

<a name="SessionHandler+invalidateTokenInStorage"></a>

### sessionHandler.invalidateTokenInStorage()
Remove the token of this account from tokens.db. Intended to be called from the steam-user login error event when an invalid token was used so the next login attempt will create a new one.

**Kind**: instance method of [<code>SessionHandler</code>](#SessionHandler)  
