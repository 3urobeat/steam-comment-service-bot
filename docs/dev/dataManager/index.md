# DataManager
[⬅️ Go back to dev home](../#readme) <a href="/src/dataManager/dataManager.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
The DataManager system imports, checks, handles errors and provides a file updating service for all config & source code files.  
It is the central point for holding and managing any data which the application stores on the filesystem.  

Use the data and functions exposed by this module whenever you need to e.g. read and write to a config file. 

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

### logininfo
Array of objects storing the login information of every bot account.  
The index property must match to the index of the corresponding bot account.  
Should you want to modify the account order during runtime, you must also make the same change in this array.

### lang
Object storing all supported languages and their strings used for responding to a user.

It loads the files of `src/data/lang/` and overwrites all keys with the corresponding values from `customlang.json` (does not overwrite the file on the disk).  
You can see the default lang content by clicking [here](/src/data/lang/english.json) and your customlang file by clicking [here](/customlang.json).

Use the function `getLang()` to access the languages stored in this object.

### cachefile
Object storing IDs from config files converted at runtime and backups for all config & data files.  

If you need the steamID64 of any owner or bot account or the groupID64 of the botsgroup or configgroup, read them from here.  
The bot accepts various inputs in the config for setting owner IDs and converts them to steamID64s at startup.  
These are stored in this object and should always be used instead of reading from the config directly.

At every startup (when the Controller ready event fires) the bot writes a backup of all config and data files to this object as well.  
This content is written to `src/data/cache.json` in order to restore previous config settings should the user make a syntax mistake or the updater break.  

You can see its content by clicking [here](/src/data/cache.json), however it is empty if you have never started the bot before.

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="DataManager"></a>

## DataManager
**Kind**: global class  

* [DataManager](#DataManager)
    * [new DataManager(controller)](#new_DataManager_new)
    * [.controller](#DataManager+controller) : [<code>Controller</code>](#Controller)
    * [.datafile](#DataManager+datafile) : <code>Object</code>
    * [.config](#DataManager+config) : <code>Object.&lt;string, any&gt;</code>
    * [.advancedconfig](#DataManager+advancedconfig) : <code>Object.&lt;string, any&gt;</code>
    * [.lang](#DataManager+lang) : <code>Object.&lt;string, Object.&lt;string, string&gt;&gt;</code>
    * [.quotes](#DataManager+quotes) : <code>Array.&lt;string&gt;</code>
    * [.proxies](#DataManager+proxies) : <code>Array.&lt;{proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
    * [.cachefile](#DataManager+cachefile) : <code>Object</code>
    * [.logininfo](#DataManager+logininfo) : <code>Array.&lt;{index: number, accountName: string, password: string, sharedSecret: (string\|undefined), steamGuardCode: (null\|undefined), machineName: (string\|undefined), deviceFriendlyName: (string\|undefined)}&gt;</code>
    * [.lastCommentDB](#DataManager+lastCommentDB) : <code>Nedb</code>
    * [.ratingHistoryDB](#DataManager+ratingHistoryDB) : <code>Nedb</code>
    * [.tokensDB](#DataManager+tokensDB) : <code>Nedb</code>
    * [.userSettingsDB](#DataManager+userSettingsDB) : <code>Nedb</code>
    * [.checkData()](#DataManager+checkData) ⇒ <code>Promise.&lt;(null\|string)&gt;</code>
    * [.writeAllFilesToDisk()](#DataManager+writeAllFilesToDisk)
    * [.writeCachefileToDisk()](#DataManager+writeCachefileToDisk)
    * [.writeDatafileToDisk()](#DataManager+writeDatafileToDisk)
    * [.writeConfigToDisk()](#DataManager+writeConfigToDisk)
    * [.writeAdvancedconfigToDisk()](#DataManager+writeAdvancedconfigToDisk)
    * [.writeLogininfoToDisk()](#DataManager+writeLogininfoToDisk)
    * [.writeProxiesToDisk()](#DataManager+writeProxiesToDisk)
    * [.writeQuotesToDisk()](#DataManager+writeQuotesToDisk)
    * [._importCacheFromDisk()](#DataManager+_importCacheFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importDataFromDisk()](#DataManager+_importDataFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importConfigFromDisk()](#DataManager+_importConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importAdvancedConfigFromDisk()](#DataManager+_importAdvancedConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importLogininfoFromDisk()](#DataManager+_importLogininfoFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [._importProxiesFromDisk()](#DataManager+_importProxiesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [._importQuotesFromDisk()](#DataManager+_importQuotesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [._importLanguagesFromDisk()](#DataManager+_importLanguagesFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importCustomLangFromDisk()](#DataManager+_importCustomLangFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importFromDisk()](#DataManager+_importFromDisk) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.verifyIntegrity()](#DataManager+verifyIntegrity) ⇒ <code>Promise.&lt;void&gt;</code>
    * [._loadDataManagerFiles()](#DataManager+_loadDataManagerFiles) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.checkData()](#DataManager+checkData) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.writeAllFilesToDisk()](#DataManager+writeAllFilesToDisk)
    * [.writeCachefileToDisk()](#DataManager+writeCachefileToDisk)
    * [.writeDatafileToDisk()](#DataManager+writeDatafileToDisk)
    * [.writeConfigToDisk()](#DataManager+writeConfigToDisk)
    * [.writeAdvancedconfigToDisk()](#DataManager+writeAdvancedconfigToDisk)
    * [.writeLogininfoToDisk()](#DataManager+writeLogininfoToDisk)
    * [.writeProxiesToDisk()](#DataManager+writeProxiesToDisk)
    * [.writeQuotesToDisk()](#DataManager+writeQuotesToDisk)
    * [._importCacheFromDisk()](#DataManager+_importCacheFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importDataFromDisk()](#DataManager+_importDataFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importConfigFromDisk()](#DataManager+_importConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importAdvancedConfigFromDisk()](#DataManager+_importAdvancedConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importLogininfoFromDisk()](#DataManager+_importLogininfoFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [._importProxiesFromDisk()](#DataManager+_importProxiesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [._importQuotesFromDisk()](#DataManager+_importQuotesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [._importLanguagesFromDisk()](#DataManager+_importLanguagesFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importCustomLangFromDisk()](#DataManager+_importCustomLangFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [._importFromDisk()](#DataManager+_importFromDisk) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.verifyIntegrity()](#DataManager+verifyIntegrity) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.processData()](#DataManager+processData)
    * [.checkProxy(proxyIndex)](#DataManager+checkProxy) ⇒ <code>boolean</code>
    * [.checkAllProxies([ignoreLastCheckedWithin])](#DataManager+checkAllProxies) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getLang(str, [replace], [userIDOrLanguage])](#DataManager+getLang) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [.getQuote(quotesArr)](#DataManager+getQuote) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.getUserCooldown(id)](#DataManager+getUserCooldown) ⇒ <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code>
    * [.setUserCooldown(id, timestamp)](#DataManager+setUserCooldown)
    * [._startExpiringTokensCheckInterval()](#DataManager+_startExpiringTokensCheckInterval)
    * [._askForGetNewToken(expiring)](#DataManager+_askForGetNewToken)
    * [.getLastCommentRequest(steamID64)](#DataManager+getLastCommentRequest) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.decodeJWT(token)](#DataManager+decodeJWT) ⇒ <code>object</code> \| <code>null</code>
    * [.refreshCache()](#DataManager+refreshCache)
    * [._restoreBackup(name, filepath, cacheentry, onlinelink, resolve)](#DataManager+_restoreBackup)
    * [._pullNewFile(name, filepath, resolve, noRequire)](#DataManager+_pullNewFile)
    * [.processData()](#DataManager+processData)
    * [.checkProxy(proxyIndex)](#DataManager+checkProxy) ⇒ <code>boolean</code>
    * [.checkAllProxies([ignoreLastCheckedWithin])](#DataManager+checkAllProxies) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getLang(str, [replace], [userIDOrLanguage])](#DataManager+getLang) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [.getQuote(quotesArr)](#DataManager+getQuote) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.getUserCooldown(id)](#DataManager+getUserCooldown) ⇒ <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code>
    * [.setUserCooldown(id, timestamp)](#DataManager+setUserCooldown)
    * [._startExpiringTokensCheckInterval()](#DataManager+_startExpiringTokensCheckInterval)
    * [._askForGetNewToken(expiring)](#DataManager+_askForGetNewToken)
    * [.getLastCommentRequest(steamID64)](#DataManager+getLastCommentRequest) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.decodeJWT(token)](#DataManager+decodeJWT) ⇒ <code>object</code> \| <code>null</code>
    * [.refreshCache()](#DataManager+refreshCache)
    * [._restoreBackup(name, filepath, cacheentry, onlinelink, resolve)](#DataManager+_restoreBackup)
    * [._pullNewFile(name, filepath, resolve, noRequire)](#DataManager+_pullNewFile)

<a name="new_DataManager_new"></a>

### new DataManager(controller)
Constructor - The dataManager system imports, checks, handles errors and provides a file updating service for all configuration files


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the controller object |

<a name="DataManager+controller"></a>

### dataManager.controller : [<code>Controller</code>](#Controller)
Reference to the controller object

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+datafile"></a>

### dataManager.datafile : <code>Object</code>
Stores all `data.json` values.
Read only - Do NOT MODIFY anything in this file!

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+config"></a>

### dataManager.config : <code>Object.&lt;string, any&gt;</code>
Stores all `config.json` settings.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+advancedconfig"></a>

### dataManager.advancedconfig : <code>Object.&lt;string, any&gt;</code>
Stores all `advancedconfig.json` settings.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+lang"></a>

### dataManager.lang : <code>Object.&lt;string, Object.&lt;string, string&gt;&gt;</code>
Stores all supported languages and their strings used for responding to a user.
All default strings have already been replaced with corresponding matches from `customlang.json`.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+quotes"></a>

### dataManager.quotes : <code>Array.&lt;string&gt;</code>
Stores all quotes used for commenting provided via the `quotes.txt` file.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+proxies"></a>

### dataManager.proxies : <code>Array.&lt;{proxy: string, proxyIndex: number, isOnline: boolean, lastOnlineCheck: number}&gt;</code>
Stores all proxies provided via the `proxies.txt` file.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+cachefile"></a>

### dataManager.cachefile : <code>Object</code>
Stores IDs from config files converted at runtime and backups for all config & data files.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+logininfo"></a>

### dataManager.logininfo : <code>Array.&lt;{index: number, accountName: string, password: string, sharedSecret: (string\|undefined), steamGuardCode: (null\|undefined), machineName: (string\|undefined), deviceFriendlyName: (string\|undefined)}&gt;</code>
Stores the login information for every bot account provided via the `logininfo.json` or `accounts.txt` files.

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+lastCommentDB"></a>

### dataManager.lastCommentDB : <code>Nedb</code>
Database which stores the timestamp of the last request of every user. This is used to enforce `config.unfriendTime`.
Document structure: { id: string, time: Number }

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+ratingHistoryDB"></a>

### dataManager.ratingHistoryDB : <code>Nedb</code>
Database which stores information about which bot accounts have fulfilled one-time requests (vote, fav, follow). This allows us to filter without pinging Steam for every account on every request.
Document structure: { id: string, accountName: string, type: string, time: Number }

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+tokensDB"></a>

### dataManager.tokensDB : <code>Nedb</code>
Database which stores the refreshTokens for all bot accounts.
Document structure: { accountName: string, token: string }

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+userSettingsDB"></a>

### dataManager.userSettingsDB : <code>Nedb</code>
Database which stores user specific settings, for example the language set
Document structure: { id: string, lang: string }

**Kind**: instance property of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+checkData"></a>

### dataManager.checkData() ⇒ <code>Promise.&lt;(null\|string)&gt;</code>
Checks currently loaded data for validity and logs some recommendations for a few settings.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;(null\|string)&gt;</code> - Resolves with `null` when all settings have been accepted, or with a string containing reasons if a setting has been reset. On reject you should terminate the application. It is called with a String specifying the failed check.  
<a name="DataManager+writeAllFilesToDisk"></a>

### dataManager.writeAllFilesToDisk()
Writes (all) files imported by DataManager back to the disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeCachefileToDisk"></a>

### dataManager.writeCachefileToDisk()
Writes cachefile to cache.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeDatafileToDisk"></a>

### dataManager.writeDatafileToDisk()
Writes datafile to data.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeConfigToDisk"></a>

### dataManager.writeConfigToDisk()
Writes config to config.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeAdvancedconfigToDisk"></a>

### dataManager.writeAdvancedconfigToDisk()
Writes advancedconfig to advancedconfig.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeLogininfoToDisk"></a>

### dataManager.writeLogininfoToDisk()
Writes logininfo to logininfo.json and accounts.txt on disk, depending on which of the files exist

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeProxiesToDisk"></a>

### dataManager.writeProxiesToDisk()
Writes proxies to proxies.txt on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeQuotesToDisk"></a>

### dataManager.writeQuotesToDisk()
Writes quotes to quotes.txt on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+_importCacheFromDisk"></a>

### dataManager.\_importCacheFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importDataFromDisk"></a>

### dataManager.\_importDataFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads data.json from disk, updates datafile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importConfigFromDisk"></a>

### dataManager.\_importConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads config.json from disk, updates config property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importAdvancedConfigFromDisk"></a>

### dataManager.\_importAdvancedConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importLogininfoFromDisk"></a>

### dataManager.\_importLogininfoFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Internal: Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importProxiesFromDisk"></a>

### dataManager.\_importProxiesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Internal: Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importQuotesFromDisk"></a>

### dataManager.\_importQuotesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Internal: Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importLanguagesFromDisk"></a>

### dataManager.\_importLanguagesFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads languages from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importCustomLangFromDisk"></a>

### dataManager.\_importCustomLangFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads customlang.json from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importFromDisk"></a>

### dataManager.\_importFromDisk() ⇒ <code>Promise.&lt;void&gt;</code>
Internal: Loads all config & data files from disk and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+verifyIntegrity"></a>

### dataManager.verifyIntegrity() ⇒ <code>Promise.&lt;void&gt;</code>
Verifies the data integrity of every source code file in the project by comparing its checksum.
This function is used to verify the integrity of every module loaded AFTER the controller & DataManager. Both of those need manual checkAndGetFile() calls to import, which is handled by the Controller.
If an already loaded file needed to be recovered then the bot will restart to load these changes.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves when all files have been checked and, if necessary, restored. Does not resolve if the bot needs to be restarted.  
<a name="DataManager+_loadDataManagerFiles"></a>

### dataManager.\_loadDataManagerFiles() ⇒ <code>Promise.&lt;void&gt;</code>
Loads all DataManager helper files. This is done outside of the constructor to be able to await it.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolved when all files have been loaded  
<a name="DataManager+checkData"></a>

### dataManager.checkData() ⇒ <code>Promise.&lt;void&gt;</code>
Checks currently loaded data for validity and logs some recommendations for a few settings.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves promise when all checks have finished. If promise is rejected you should terminate the application or reset the changes. Reject is called with a string specifying the failed check.  
<a name="DataManager+writeAllFilesToDisk"></a>

### dataManager.writeAllFilesToDisk()
Writes (all) files imported by DataManager back to the disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeCachefileToDisk"></a>

### dataManager.writeCachefileToDisk()
Writes cachefile to cache.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeDatafileToDisk"></a>

### dataManager.writeDatafileToDisk()
Writes datafile to data.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeConfigToDisk"></a>

### dataManager.writeConfigToDisk()
Writes config to config.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeAdvancedconfigToDisk"></a>

### dataManager.writeAdvancedconfigToDisk()
Writes advancedconfig to advancedconfig.json on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeLogininfoToDisk"></a>

### dataManager.writeLogininfoToDisk()
Writes logininfo to logininfo.json and accounts.txt on disk, depending on which of the files exist

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeProxiesToDisk"></a>

### dataManager.writeProxiesToDisk()
Writes proxies to proxies.txt on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+writeQuotesToDisk"></a>

### dataManager.writeQuotesToDisk()
Writes quotes to quotes.txt on disk

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+_importCacheFromDisk"></a>

### dataManager.\_importCacheFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importDataFromDisk"></a>

### dataManager.\_importDataFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads data.json from disk, updates datafile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importConfigFromDisk"></a>

### dataManager.\_importConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads config.json from disk, updates config property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importAdvancedConfigFromDisk"></a>

### dataManager.\_importAdvancedConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importLogininfoFromDisk"></a>

### dataManager.\_importLogininfoFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Internal: Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importProxiesFromDisk"></a>

### dataManager.\_importProxiesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Internal: Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importQuotesFromDisk"></a>

### dataManager.\_importQuotesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Internal: Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importLanguagesFromDisk"></a>

### dataManager.\_importLanguagesFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads languages from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importCustomLangFromDisk"></a>

### dataManager.\_importCustomLangFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Internal: Loads customlang.json from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+_importFromDisk"></a>

### dataManager.\_importFromDisk() ⇒ <code>Promise.&lt;void&gt;</code>
Internal: Loads all config & data files from disk and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+verifyIntegrity"></a>

### dataManager.verifyIntegrity() ⇒ <code>Promise.&lt;void&gt;</code>
Verifies the data integrity of every source code file in the project by comparing its checksum.
This function is used to verify the integrity of every module loaded AFTER the controller & DataManager. Both of those need manual checkAndGetFile() calls to import, which is handled by the Controller.
If an already loaded file needed to be recovered then the bot will restart to load these changes.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves when all files have been checked and, if necessary, restored. Does not resolve if the bot needs to be restarted.  
<a name="DataManager+processData"></a>

### dataManager.processData()
Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+checkProxy"></a>

### dataManager.checkProxy(proxyIndex) ⇒ <code>boolean</code>
Checks if a proxy can reach steamcommunity.com and updates its isOnline and lastOnlineCheck

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>boolean</code> - True if the proxy can reach steamcommunity.com, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| proxyIndex | <code>number</code> | Index of the proxy to check in the DataManager proxies array |

<a name="DataManager+checkAllProxies"></a>

### dataManager.checkAllProxies([ignoreLastCheckedWithin]) ⇒ <code>Promise.&lt;void&gt;</code>
Checks all proxies if they can reach steamcommunity.com and updates their entries

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves when all proxies have been checked  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ignoreLastCheckedWithin] | <code>number</code> | <code>0</code> | Ignore proxies that have already been checked in less than `ignoreLastCheckedWithin` ms |

<a name="DataManager+getLang"></a>

### dataManager.getLang(str, [replace], [userIDOrLanguage]) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Retrieves a language string from one of the available language files and replaces keywords if desired.
If a userID is provided it will lookup which language the user has set. If nothing is set, the default language set in the config will be returned.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - Returns a promise that resolves with the language string or `null` if it could not be found.  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | Name of the language string to be retrieved |
| [replace] | <code>Object.&lt;string, string&gt;</code> | Optional: Object containing keywords in the string to replace. Pass the keyword as key and the corresponding value to replace as value. |
| [userIDOrLanguage] | <code>string</code> | Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language. |

<a name="DataManager+getQuote"></a>

### dataManager.getQuote(quotesArr) ⇒ <code>Promise.&lt;string&gt;</code>
Gets a random quote

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Resolves with `quote` (string)  

| Param | Type | Description |
| --- | --- | --- |
| quotesArr | <code>Array</code> | Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used. |

<a name="DataManager+getUserCooldown"></a>

### dataManager.getUserCooldown(id) ⇒ <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code>
Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code> - Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as string), `untilStr` (Wait until as string). If id wasn't found, `null` will be returned.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of the user to look up |

<a name="DataManager+setUserCooldown"></a>

### dataManager.setUserCooldown(id, timestamp)
Updates or inserts timestamp of a user

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of the user to update |
| timestamp | <code>number</code> | Unix timestamp of the last interaction the user received |

<a name="DataManager+_startExpiringTokensCheckInterval"></a>

### dataManager.\_startExpiringTokensCheckInterval()
Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=7 days, logs warning and sends botowner a Steam msg

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+_askForGetNewToken"></a>

### dataManager.\_askForGetNewToken(expiring)
Internal: Asks user if they want to refresh the tokens of all expiring accounts when no active request was found and relogs them

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| expiring | <code>object</code> | Object of botobject entries to ask user for |

<a name="DataManager+getLastCommentRequest"></a>

### dataManager.getLastCommentRequest(steamID64) ⇒ <code>Promise.&lt;number&gt;</code>
Retrieves the last processed request of anyone or a specific steamID64 from the lastcomment database

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;number&gt;</code> - Called with the greatest timestamp (Number) found  

| Param | Type | Description |
| --- | --- | --- |
| steamID64 | <code>string</code> | Search for a specific user |

<a name="DataManager+decodeJWT"></a>

### dataManager.decodeJWT(token) ⇒ <code>object</code> \| <code>null</code>
Decodes a JsonWebToken - https://stackoverflow.com/a/38552302

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>object</code> \| <code>null</code> - JWT object on success, `null` on failure  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | The token to decode |

<a name="DataManager+refreshCache"></a>

### dataManager.refreshCache()
Refreshes Backups in cache.json with new data

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+_restoreBackup"></a>

### dataManager.\_restoreBackup(name, filepath, cacheentry, onlinelink, resolve)
Internal: Helper function to try and restore backup of corrupted file from cache.json

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the file |
| filepath | <code>string</code> | Absolute path of the file on the disk |
| cacheentry | <code>object</code> | Backup-Object of the file in cache.json |
| onlinelink | <code>string</code> | Link to the raw file in the GitHub repository |
| resolve | <code>function</code> | Function to resolve the caller's promise |

<a name="DataManager+_pullNewFile"></a>

### dataManager.\_pullNewFile(name, filepath, resolve, noRequire)
Internal: Helper function to pull new file from GitHub

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the file |
| filepath | <code>string</code> | Full path, starting from project root with './' |
| resolve | <code>function</code> | Your promise to resolve when file was pulled |
| noRequire | <code>boolean</code> | Optional: Set to true if resolve() should not be called with require(file) as param |

<a name="DataManager+processData"></a>

### dataManager.processData()
Converts owners and groups imported from config.json to steam ids and updates cachefile. (Call this after dataImport and before dataCheck)

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+checkProxy"></a>

### dataManager.checkProxy(proxyIndex) ⇒ <code>boolean</code>
Checks if a proxy can reach steamcommunity.com and updates its isOnline and lastOnlineCheck

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>boolean</code> - True if the proxy can reach steamcommunity.com, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| proxyIndex | <code>number</code> | Index of the proxy to check in the DataManager proxies array |

<a name="DataManager+checkAllProxies"></a>

### dataManager.checkAllProxies([ignoreLastCheckedWithin]) ⇒ <code>Promise.&lt;void&gt;</code>
Checks all proxies if they can reach steamcommunity.com and updates their entries

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves when all proxies have been checked  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ignoreLastCheckedWithin] | <code>number</code> | <code>0</code> | Ignore proxies that have already been checked in less than `ignoreLastCheckedWithin` ms |

<a name="DataManager+getLang"></a>

### dataManager.getLang(str, [replace], [userIDOrLanguage]) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Retrieves a language string from one of the available language files and replaces keywords if desired.
If a userID is provided it will lookup which language the user has set. If nothing is set, the default language set in the config will be returned.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;(string\|null)&gt;</code> - Returns a promise that resolves with the language string or `null` if it could not be found.  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | Name of the language string to be retrieved |
| [replace] | <code>Object.&lt;string, string&gt;</code> | Optional: Object containing keywords in the string to replace. Pass the keyword as key and the corresponding value to replace as value. |
| [userIDOrLanguage] | <code>string</code> | Optional: ID of the user to lookup in the userSettings database. You can also pass the name of a supported language like "english" to get a specific language. |

<a name="DataManager+getQuote"></a>

### dataManager.getQuote(quotesArr) ⇒ <code>Promise.&lt;string&gt;</code>
Gets a random quote

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Resolves with `quote` (String)  

| Param | Type | Description |
| --- | --- | --- |
| quotesArr | <code>Array</code> | Optional: Custom array of quotes to choose from. If not provided the default quotes set which was imported from the disk will be used. |

<a name="DataManager+getUserCooldown"></a>

### dataManager.getUserCooldown(id) ⇒ <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code>
Checks if a user ID is currently on cooldown and formats human readable lastRequestStr and untilStr strings.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code> - Resolves with object containing `lastRequest` (Unix timestamp of the last interaction received), `until` (Unix timestamp of cooldown end), `lastRequestStr` (How long ago as String), `untilStr` (Wait until as String). If id wasn't found, `null` will be returned.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of the user to look up |

<a name="DataManager+setUserCooldown"></a>

### dataManager.setUserCooldown(id, timestamp)
Updates or inserts timestamp of a user

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | ID of the user to update |
| timestamp | <code>number</code> | Unix timestamp of the last interaction the user received |

<a name="DataManager+_startExpiringTokensCheckInterval"></a>

### dataManager.\_startExpiringTokensCheckInterval()
Internal: Checks tokens.db every 24 hours for refreshToken expiration in <=31 days and attempts to renew.
If this fails and the token expires in <=7 days, it logs a warning and sends the botowner a Steam msg

Note: This function should be redundant as SteamUser now automatically attempts to renew refreshTokens when `renewRefreshTokens` is enabled.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+_askForGetNewToken"></a>

### dataManager.\_askForGetNewToken(expiring)
Internal: Asks user if they want to refresh the tokens of all expiring accounts when no active request was found and relogs them

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| expiring | <code>object</code> | Object of botobject entries to ask user for |

<a name="DataManager+getLastCommentRequest"></a>

### dataManager.getLastCommentRequest(steamID64) ⇒ <code>Promise.&lt;number&gt;</code>
Retrieves the last processed request of anyone or a specific steamID64 from the lastcomment database

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;number&gt;</code> - Called with the greatest timestamp (Number) found  

| Param | Type | Description |
| --- | --- | --- |
| steamID64 | <code>string</code> | Search for a specific user |

<a name="DataManager+decodeJWT"></a>

### dataManager.decodeJWT(token) ⇒ <code>object</code> \| <code>null</code>
Decodes a JsonWebToken - https://stackoverflow.com/a/38552302

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>object</code> \| <code>null</code> - JWT object on success, `null` on failure  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | The token to decode |

<a name="DataManager+refreshCache"></a>

### dataManager.refreshCache()
Refreshes Backups in cache.json with new data

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
<a name="DataManager+_restoreBackup"></a>

### dataManager.\_restoreBackup(name, filepath, cacheentry, onlinelink, resolve)
Internal: Helper function to try and restore backup of corrupted file from cache.json

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the file |
| filepath | <code>string</code> | Absolute path of the file on the disk |
| cacheentry | <code>object</code> | Backup-Object of the file in cache.json |
| onlinelink | <code>string</code> | Link to the raw file in the GitHub repository |
| resolve | <code>function</code> | Function to resolve the caller's promise |

<a name="DataManager+_pullNewFile"></a>

### dataManager.\_pullNewFile(name, filepath, resolve, noRequire)
Internal: Helper function to pull new file from GitHub

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the file |
| filepath | <code>string</code> | Full path, starting from project root with './' |
| resolve | <code>function</code> | Your promise to resolve when file was pulled |
| noRequire | <code>boolean</code> | Optional: Set to true if resolve() should not be called with require(file) as param |

