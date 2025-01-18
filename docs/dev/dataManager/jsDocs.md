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
    * [.logininfo](#DataManager+logininfo) : [<code>Array.&lt;logOnOptions&gt;</code>](#logOnOptions)
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
    * [.importCacheFromDisk()](#DataManager+importCacheFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importDataFromDisk()](#DataManager+importDataFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importConfigFromDisk()](#DataManager+importConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importAdvancedConfigFromDisk()](#DataManager+importAdvancedConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importLogininfoFromDisk()](#DataManager+importLogininfoFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.importProxiesFromDisk()](#DataManager+importProxiesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.importQuotesFromDisk()](#DataManager+importQuotesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.importLanguagesFromDisk()](#DataManager+importLanguagesFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importCustomLangFromDisk()](#DataManager+importCustomLangFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importFromDisk()](#DataManager+importFromDisk) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.verifyIntegrity()](#DataManager+verifyIntegrity) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.checkData()](#DataManager+checkData) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.writeAllFilesToDisk()](#DataManager+writeAllFilesToDisk)
    * [.writeCachefileToDisk()](#DataManager+writeCachefileToDisk)
    * [.writeDatafileToDisk()](#DataManager+writeDatafileToDisk)
    * [.writeConfigToDisk()](#DataManager+writeConfigToDisk)
    * [.writeAdvancedconfigToDisk()](#DataManager+writeAdvancedconfigToDisk)
    * [.writeLogininfoToDisk()](#DataManager+writeLogininfoToDisk)
    * [.writeProxiesToDisk()](#DataManager+writeProxiesToDisk)
    * [.writeQuotesToDisk()](#DataManager+writeQuotesToDisk)
    * [.importCacheFromDisk()](#DataManager+importCacheFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importDataFromDisk()](#DataManager+importDataFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importConfigFromDisk()](#DataManager+importConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importAdvancedConfigFromDisk()](#DataManager+importAdvancedConfigFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importLogininfoFromDisk()](#DataManager+importLogininfoFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.importProxiesFromDisk()](#DataManager+importProxiesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.importQuotesFromDisk()](#DataManager+importQuotesFromDisk) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.importLanguagesFromDisk()](#DataManager+importLanguagesFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importCustomLangFromDisk()](#DataManager+importCustomLangFromDisk) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.importFromDisk()](#DataManager+importFromDisk) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.verifyIntegrity()](#DataManager+verifyIntegrity) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.processData()](#DataManager+processData)
    * [.checkProxy(proxyIndex)](#DataManager+checkProxy) ⇒ <code>boolean</code>
    * [.checkAllProxies([ignoreLastCheckedWithin])](#DataManager+checkAllProxies) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getLang(str, [replace], [userIDOrLanguage])](#DataManager+getLang) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [.getQuote(quotesArr)](#DataManager+getQuote) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.getUserCooldown(id)](#DataManager+getUserCooldown) ⇒ <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code>
    * [.setUserCooldown(id, timestamp)](#DataManager+setUserCooldown)
    * [.getLastCommentRequest(steamID64)](#DataManager+getLastCommentRequest) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.decodeJWT(token)](#DataManager+decodeJWT) ⇒ <code>object</code> \| <code>null</code>
    * [.refreshCache()](#DataManager+refreshCache)
    * [.processData()](#DataManager+processData)
    * [.checkProxy(proxyIndex)](#DataManager+checkProxy) ⇒ <code>boolean</code>
    * [.checkAllProxies([ignoreLastCheckedWithin])](#DataManager+checkAllProxies) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getLang(str, [replace], [userIDOrLanguage])](#DataManager+getLang) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [.getQuote(quotesArr)](#DataManager+getQuote) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.getUserCooldown(id)](#DataManager+getUserCooldown) ⇒ <code>Promise.&lt;({lastRequest: number, until: number, lastRequestStr: string, untilStr: string}\|null)&gt;</code>
    * [.setUserCooldown(id, timestamp)](#DataManager+setUserCooldown)
    * [.getLastCommentRequest(steamID64)](#DataManager+getLastCommentRequest) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.decodeJWT(token)](#DataManager+decodeJWT) ⇒ <code>object</code> \| <code>null</code>
    * [.refreshCache()](#DataManager+refreshCache)

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

### dataManager.logininfo : [<code>Array.&lt;logOnOptions&gt;</code>](#logOnOptions)
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
<a name="DataManager+importCacheFromDisk"></a>

### dataManager.importCacheFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importDataFromDisk"></a>

### dataManager.importDataFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads data.json from disk, updates datafile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importConfigFromDisk"></a>

### dataManager.importConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads config.json from disk, updates config property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importAdvancedConfigFromDisk"></a>

### dataManager.importAdvancedConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importLogininfoFromDisk"></a>

### dataManager.importLogininfoFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importProxiesFromDisk"></a>

### dataManager.importProxiesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importQuotesFromDisk"></a>

### dataManager.importQuotesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importLanguagesFromDisk"></a>

### dataManager.importLanguagesFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads languages from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importCustomLangFromDisk"></a>

### dataManager.importCustomLangFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads customlang.json from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importFromDisk"></a>

### dataManager.importFromDisk() ⇒ <code>Promise.&lt;void&gt;</code>
Loads all config & data files from disk and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves promise when all files have been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+verifyIntegrity"></a>

### dataManager.verifyIntegrity() ⇒ <code>Promise.&lt;void&gt;</code>
Verifies the data integrity of every source code file in the project by comparing its checksum.
This function is used to verify the integrity of every module loaded AFTER the controller & DataManager. Both of those need manual checkAndGetFile() calls to import, which is handled by the Controller.
If an already loaded file needed to be recovered then the bot will restart to load these changes.

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves when all files have been checked and, if necessary, restored. Does not resolve if the bot needs to be restarted.  
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
<a name="DataManager+importCacheFromDisk"></a>

### dataManager.importCacheFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads cache.json from disk, updates cachefile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importDataFromDisk"></a>

### dataManager.importDataFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads data.json from disk, updates datafile property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importConfigFromDisk"></a>

### dataManager.importConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads config.json from disk, updates config property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importAdvancedConfigFromDisk"></a>

### dataManager.importAdvancedConfigFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads advancedconfig.json from disk, updates advancedconfig property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importLogininfoFromDisk"></a>

### dataManager.importLogininfoFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Loads accounts.txt/logininfo.json from disk, updates logininfo property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importProxiesFromDisk"></a>

### dataManager.importProxiesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Loads proxies.txt from disk, updates proxies property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importQuotesFromDisk"></a>

### dataManager.importQuotesFromDisk() ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Loads quotes.txt from disk, updates quotes property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importLanguagesFromDisk"></a>

### dataManager.importLanguagesFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads languages from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importCustomLangFromDisk"></a>

### dataManager.importCustomLangFromDisk() ⇒ <code>Promise.&lt;object&gt;</code>
Loads customlang.json from disk, updates languages property in DataManager and handles potential errors

**Kind**: instance method of [<code>DataManager</code>](#DataManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves promise with file content when file has been loaded successfully. The function will log an error and terminate the application should a fatal error occur.  
<a name="DataManager+importFromDisk"></a>

### dataManager.importFromDisk() ⇒ <code>Promise.&lt;void&gt;</code>
Loads all config & data files from disk and handles potential errors

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
