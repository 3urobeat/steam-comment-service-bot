# Version 2.16.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.16.0](#2.16.0)
- [2.16.1](#2.16.1)
  
&nbsp;

<a id="2.16.0"></a>

## **2025-02-17, Version 2.16.0**
**Changes of note (TL;DR):**  
- Added new commands: `!manage`, `!plugins`, `!stats`
- Added support for specifying a `proxyFormat` in advancedconfig.json
- Added support for detecting and unlocking family view
- Added official Docker support
- Added a new manage module to Controller
- Reworked !joingroup & !addfriend to take amount as first parameter [#249](https://github.com/3urobeat/steam-comment-service-bot/issues/249)
- Reworked comment amount calculation when not all accounts are available
- Fixed a few bugs, reworked a few systems and improved user experience

- BREAKING: Changed CommandHandler's runCommand return value to a detailed object (`{ success: boolean, reason: string, message: string }`), to provide more information why running the requested command failed
  - Due to this change, `runCommand()` will not send the owneronly error message anymore. The caller is responsible to forward the provided error message to the user, if desired.
- BREAKING: Removed _ from name of all dataImport functions as they should not be private. If your plugin used one of them, you have to update your calls!

If you are using a `customlang.json`, make sure to read the language string changes at the end and update your file.  
If you've made a plugin, check the 'Creating Plugins' wiki page and add the `botVersion` parameter to your `package.json`.

&nbsp;
&nbsp;

**Additions:**
- Added new commands: `!manage`, `!plugins`, `!stats`
- Added support for specifying a `proxyFormat` in advancedconfig.json
  - Please check the adding_proxies wiki page to read how to use this new setting
  - The default setting (empty) retains the same behavior/format as previously
- Added support for detecting and unlocking family view
  - Family View Codes are cached in tokens.db to auto-unlock on restart/relogin
  - Added `skipFamilyViewUnlock` setting to advancedconfig.json
- Added feature to suggest user the most similar command to their input when no matching command was found
- Added a new manage module to Controller
  - It contains functions to manage the bot during runtime and can be implemented by plugins/commands (like the built-in `!manage` command does).
  - Added `!manage` command which implements the new manage module (and a little more) for e.g. the Steam Chat [#228](https://github.com/3urobeat/steam-comment-service-bot/issues/228)
    - See the commands documentation for more info
  - As of now, the manage module contains the functions: addAccount(), removeAccount(), filterAccounts() (comes with a list of pre-made filters), relogAccount(), respreadProxies()
- Added plugins update check job which runs every 24 hours
- Added respread proxies job which runs every 4 days
- Added support for auto reloading plugins (if necessary) to _checkPluginUpdates()
- Added proxy change detection to login() which re-creates a Bot instance to properly apply the proxy change
- Added `!plugins` command which lists all currently active plugins, including some metadata
  - Added centralized helper functions for getting all installed or active plugins
- Added support for subscribing to workshop items with !follow command [#244](https://github.com/3urobeat/steam-comment-service-bot/issues/244)
  - Added a steamcommunity sharedfile workshop subscribing library patch
- Added a `dataUpdate` event to Controller & PluginSystem which is fired on dataImport & dataExport
- Added support for special syntax `*:cookie` in logininfo to auto queue all cached accounts and add support to dataExport function to handle it [#259](https://github.com/3urobeat/steam-comment-service-bot/issues/259)
- Added counters for every request type to count amount of comments/votes/favs/follows made during runtime
- Added a statistics.db database to count all requests made in total
- Added `!stats` command which shows amount of requests made during current uptime and in total (reading from statistics.db)
- Added scripts to auto-generate dev docs from JsDocs. A shorthander command was added to package.json to easily rebuild dev docs
- Added a Dockerfile, published a docker image and added instructions to the setup guide
- Added a beta versions wiki page to explain branch switching

&nbsp;

**Reworks:**
- BREAKING: Changed CommandHandler's runCommand return value to a detailed object (`{ success: boolean, reason: string, message: string }`), to provide more information why running the requested command failed
  - Due to this change, `runCommand()` will not send the owneronly error message anymore. The caller is responsible to forward the provided error message to the user, if desired.
- Reworked !joingroup to take amount as first parameter [#249](https://github.com/3urobeat/steam-comment-service-bot/issues/249)
- Reworked !addfriend to take amount as first parameter [#249](https://github.com/3urobeat/steam-comment-service-bot/issues/249)
- Reworked comment amount calculation when not all accounts are available
  - Previously the bot would only allow you to request n comments, where n does not exceed the amount of available accounts, instead of repeatedly using an account when the settings allow. The bot now calculates the amount of account re-uses beforehand and factors them in when validating a request where not all accounts are currently available.  
  Example: 4 accounts configured, user can request max 20 comments. Only 2 accounts currently available, user is still able to request 10 comments.
- Reworked loadPlugins.js to provide functions to un-/re-/load single plugins
- Reworked dataImport to contain dedicated functions for every file to allow reloading of a single specific file during runtime
  - Functions in dataImport now overwrite their corresponding DataManager properties directly, the caller doesn't have to do that using the return value anymore
- Extract proxy ip in dataImport and include it in every proxies entry to use it in log messages without leaking credentials
- Reworked every log message referencing proxy index to use ip instead to improve user experience when needing to find a broken proxy in proxies.txt for example
  - Added mention of proxy in final login error message to ease proxy related troubleshooting
- Moved unloading all plugins from reload to a dedicated function to support unloading a plugin without instantly loading it again
- DataManager's dataExport function for logininfo now uses DataManager logininfo prop instead of reconstructing it from bots collection
  - Note: If the bot order is being changed by e.g. a plugin, logininfo MUST be updated and logininfo exported to persist that change.
- Reworked curator detection & curator clanid resolving to properly handle /publisher & /developer urls [#266](https://github.com/3urobeat/steam-comment-service-bot/issues/266)
- Biiig refactor to fix ALL jsdoc & tsd-jsdoc errors
  - Marked all _ prefixed functions with private to hide it from exported types
  - BREAKING: Removed _ from name of all dataImport functions as they should not be private. If your plugin used one of them, you have to update your calls!
- Reworked existing dev docs structure to support new dev docs auto-generate script

&nbsp;

**Fixes:**
- Fixed incorrect debug log msg function prefix
- Fixed "Waiting for bot(s)..." debug login message spamming output file
- Fixed bot not replying with correct request amount when insufficient accounts are friends but acceptFriendRequests is disabled
- Fixed broken type reference for DataManager JsDoc in controller.js
- Fixed JsDoc Bot reference being unresolved in Controller functions by improving how the reference is loaded
  - Removed now unnecessary re-import in _preLogin() for previously unresolved Bot & Updater
- Fixed incorrect & stupid filtration for getting bots for fav/follow/vote requests
- Fixed proxies dataExport writing [object object] to file
- Fixed skipped accounts not being included in DataManager's logininfo dataExport function
- Fixed login softlock handler causing a hell of a lot exceptions when taking action
- Fixed `!eval` logininfo censor regex replacing entire eval result when cookie login was used
  - By not providing a password in accounts.txt the password property in the logininfo entry of those accounts is set to an empty string. Using an empty String in a Regex results in every char being matched, leading to a gigantic wall of the replacement text.
- Fixed deleting proxies.txt causing error cascade
- Fixed bot not auto-reducing comment amount on missing friends & acceptFriendRequests false when 'all' was requested
- Fixed getSteamSharedFile() failing to detect vote status of greenlight items [#256](https://github.com/3urobeat/steam-comment-service-bot/issues/256)
- Fixed incorrect directory name in dev docs

&nbsp;

**Changes:**
- Improved logging when checking online status of proxies in checkProxies.js
- Moved plugin un-/reloading to loadPlugins.js
- Moved plugin update checking from _loadPlugins() to dedicated _checkPluginUpdates() function
- Moved unsupported node.js version check on startup up a little to protect DataManager
- The bot will no longer send the `addaccounts` message in `!comment` response when `acceptFriendRequests` setting in advancedconfig is `false`
- The bot will now refuse to load plugins already loaded/present in pluginList
- The bot will no longer mention a shared_secret in InvalidPassword login error log message if account has none provided to reduce potential confusion
- Refer to 'index' as 'interaction' in session cmds responses to be more user friendly
- Set logger options which are depending on advancedconfig being loaded a bit earlier to support DEBUG messages in dataImport
- The `!eval` error log message will now show a stacktrace
- The `!info` command now accumulates all request type counters when showing amount of requests made during uptime
- Mentioned that setup time estimate assumes some accounts have already been created in docs setup_guide
- Mentioned dev docs more & better in README & contributing page
- Mentioned InsufficientPrivilege error in errors_doc [#253](https://github.com/3urobeat/steam-comment-service-bot/issues/253)
- Updated `steam-comment-bot-template`, `steam-comment-bot-webserver`, `steam-comment-bot-discord-plugin` and `steam-comment-bot-rest` ([#11](https://github.com/DerDeathraven/steam-comment-bot-rest-api/pull/11)) to v2.16
- Updated wiki pages (adding_proxies, advancedconfig_doc, commands_doc, setup_guide) to accomodate changes made in this update
- Updated dependencies
- Minor other changes

<details>
  <summary>Click me to see updated language strings</summary>

  - These language keys have been added:
    - pluginscmdresponse
    - managecmdaddusage
    - managecmdaddsuccess
    - managecmdremoveusage
    - managecmdremovesuccess
    - managecmdfilterusage
    - managecmdfiltersuccess
    - managecmdusage
  - These language keys have been removed:
    - addfriendcmdacclimited
  - These language key's values have changed:
    - commandnotfound
    - addfriendcmdsuccess
    - joingroupcmdsuccess
    - childbotmessage

  This list was generated using my [langStringsChangeDetector.js](/scripts/langStringsChangeDetector.js) script.

</details>

Commit: [b1b500c](https://github.com/3urobeat/steam-comment-service-bot/commit/b1b500c)

&nbsp;

<a id="2.16.1"></a>

## **2025-02-19, Version 2.16.1**
**Fixes:**
- Fixed loading sharedfile being broken caused by bot using a newer cheerio version than node-steamcommunity does [#271](https://github.com/3urobeat/steam-comment-service-bot/issues/271)
- Fixed `!comment` calculating incorrect amount of bots needed when maxRequestAmount < accsAvailable and asking user to add an empty list of accounts [#272](https://github.com/3urobeat/steam-comment-service-bot/issues/272)
