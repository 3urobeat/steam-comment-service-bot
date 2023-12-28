# Version 2.14.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.14.0](#2.14.0)
- [2.14.1](#2.14.1)
  
&nbsp;

<a id="2.14.0"></a>

## **2023-10-21, Version 2.14.0**
**Changes of note (TL;DR):**  
- Added support for commenting in discussions using !comment
- Added support for following & unfollowing users/workshops/curators using !follow & !unfollow 
- Added support for setting specific games for specific accounts
- Added a language system which currently supports english & russian. Each user can set their lang using !lang
  - Reworked `customlang.json` structure to work with the new language system. Please read the updated [customlang wiki page](/docs/wiki/customlang_doc.md)!
- Added a relogging handler which also attempts to switch out broken proxies - you no longer need to manually intervene to get accounts back online!
  - The bot now longer stops itself when the main account looses connection
- Renamed `config.json` keys `commentdelay`, `commentcooldown`, `maxComments` & `maxOwnerComments` to `requestDelay`, `requestCooldown`, `maxRequests`, `maxOwnerRequests` to apply to all request types
- Renamed advancedconfig.json key `relogTimeout` to `loginRetryTimeout`
- Fixed a lot of bugs

If you are using a `customlang.json`, make sure to read the language string changes at the end and update your file.

&nbsp;
&nbsp;

**Additions:**
- Added new commands: !follow, !unfollow
- Added support for commenting in discussions by updating !comment! Suggestion in [#128](https://github.com/3urobeat/steam-comment-service-bot/issues/128)
  - Added a library patch to load my changes until [my PR to the SteamCommunity library gets accepted](https://github.com/DoctorMcKay/node-steamcommunity/pull/319)
- Added support for following & unfollowing users/workshops and curators by adding two new commands as mentioned above! Suggestion in [#163](https://github.com/3urobeat/steam-comment-service-bot/issues/163) & [#207](https://github.com/3urobeat/steam-comment-service-bot/issues/207)
  - This feature was added to the SteamCommunity library [in my PR #320](https://github.com/DoctorMcKay/node-steamcommunity/pull/320)
- Added a language system
  - Added a `!lang` command to see all supported languages and to update your chosen one
  - Added a userSettings database to save language settings for every user who adds the bot
  - Added a defaultLanguage setting to `config.json`
  - Added a `getLang()` function to the DataManager to get a language string
    - Supports replacing language string variables for you
    - Automatically fetches the correct language for the user when a userID is provided
  - Added russian translation [@Blueberryy](https://github.com/Blueberryy) [#186](https://github.com/3urobeat/steam-comment-service-bot/pull/186), updated by [@sashascurtu](https://github.com/sashascurtu) [#212](https://github.com/3urobeat/steam-comment-service-bot/pull/212)
  - Added an unsupported language check to DataManager's dataCheck
- Added automatic renewal of refreshTokens that expire soon
  - Enabled automatic renewal in steam-user options
  - Added a `attemptTokenRenew()` function to the sessionHandler and call it from the handleExpiringTokens.js helper (this was done before steam-user added support, it now acts as a backup)
- Added a relogging system to attempt to recover failed logins after 15 minutes
  - Supports switching out broken proxies - you no longer need to manually intervene to get accounts back online!
  - Added a Controller `getBotsPerProxy()` function to enable finding least used proxies
  - Added the advancedconfig `relogTimeout` setting to customize the 15 minutes default setting
  - Added proxy support to the Controller `checkConnection()` helper and added a `splitProxyString()` helper to Controller.misc
  - Added DataManager `checkProxy()` and `checkAllProxies()` helper functions to update `isOnline` for every proxy
  - Added a Bot `switchProxy()` function to relog a bot account with a different proxy without needing a restart
- Added a (stripped down for now) developer wiki
- Added a dataIntegrity check to the DataManager to automatically recover corrupted source files by checking their checksum
  - The bot can now recover itself from only the initial `start.js` file. Impressive, right?
- Added support for setting specific games for specific accounts. Suggestion in [#193](https://github.com/3urobeat/steam-comment-service-bot/issues/193)
- Added a scripts directory
  - Added the langStringsChangeDetector script to generate the lang keys updated list for each changelog
  - Added the generateFileStructure script to update `/src/data/fileStructure.json`
  - Added the checkTranslationKeys script to find missing or misnamed lang keys in translations
- Added a contributing wiki page
- Added 351 more quotes to default quotes.txt file [@8C](https://github.com/8C) [#210](https://github.com/3urobeat/steam-comment-service-bot/pull/210)
- Added compatibility feature for update from 2.13 to 2.14

&nbsp;

**Reworks:**
- Reworked `customlang.json` structure to work with the new language system. Please read the updated [customlang wiki page](/docs/wiki/customlang_doc.md)!
- Reworked how variables are set in language strings to easily distinguish them from normal text. They now follow this syntax: `${variableName}`
- Reworked how proxies are loaded and stored in the DataManager to store connection status information
  - They are now stored in an array of objects instead of a string array and contain the properties `proxy`, `proxyIndex`, `isOnline` & `lastOnlineCheck`
- Reworked how the logininfo is stored in the DataManager to fix an invalid account order when a username consisting of only numbers was provided
  - The accounts are now stored in an array of objects instead of an object with the username as key
- Reworked bot accounts password protection in `!eval`
- Reworked `advancedconfig.json` by adding dummy values that act as separators to group certain settings together
- Reworked Updater's `customUpdateRules()` to carry removed config & advancedconfig values through an update
  - The corresponding compatiblity feature must handle the processing & removal of these values
- Replaced all writeFile() calls with DataManager write helper calls
- Replaced every lang usage with `data.getLang()`
- Improved `!settings` command array & object conversion
- Improved log for first time user when installing dependencies
- Improved creating plugins, accounts setup and config setup guide
- The `controller.restart()` function now automatically sets default params if undefined to simplify usage
- DataManager's dataCheck now returns a string containing information when a config value has been reset to default
  - The `!settings` command now handles this setting change rejection by informing the user
- Generalized a few lang strings to make translation easier

&nbsp;

**Fixes:**
- Fixed parent process not setting process title when restarting after automatic dependency installation
- Fixed `checkAndGetFile()` failing if npminteraction.js helper is missing
- Fixed npminteraction helper failing if package.json is missing
- Fixed dataManager failing if helpers are missing
- Fixed dataCheck failing if DataManager helpers were not replaced quick enough
- Fixed compability feature check failing if folder is missing
- Fixed handleErrors.js failing if npminteraction.js is helper is missing
- Fixed `dataIntegrity()` resolving too fast when restart is needed
- Fixed weird infinite loop crash in `syncLoop()` when calling `next()` too fast
- Fixed missing game licenses check not working when cache.json is empty
- Fixed dataCheck not resetting change of setting which triggered a promise rejection
- Fixed up-/downvote error detection in sharedfiles libraryPatch for `!vote` & `!downvote` commands
- Fixed sharedfile comment error detection in sharedfiles libraryPatch
- Fixed compatibility check not finding anything due to typo
- Fixed undefined playing status in ready message when config.playingGames = []
- Fixed the connection check in the Controller not being awaited properly on startup
- Fixed handleMissingGameLicenses only filtering the main account
- Fixed `getBots()` not supporting OFFLINE filter
- Fixed invalid account order when a username consisting only numbers was provided by changing how the logininfo is stored (see above)

&nbsp;

**Changes:**
- Removed library patch for re-enabling primaryGroup profile setting [#287](https://github.com/DoctorMcKay/node-steamcommunity/pull/287) & [#307](https://github.com/DoctorMcKay/node-steamcommunity/pull/307) as the PR was merged
- Removed machineName from logOnOptions. The bot will no longer identify itself when logging into an account
- The bot now longer stops itself when the main account looses connection as the relogging helper takes over
- The bot now only runs botsgroup and missing game licenses checks on the intial login of a bot account, no longer also on relogs
- Create accounts.txt file in dataImport if it is missing
- Miscellaneous log improvements (e.g. less newlines, less messages without dates)
- Renamed `config.json` keys `commentdelay`, `commentcooldown`, `maxComments` & `maxOwnerComments` to `requestDelay`, `requestCooldown`, `maxRequests`, `maxOwnerRequests` to apply to all request types
- Renamed `advancedconfig.json` key `relogTimeout` to `loginRetryTimeout`. `relogTimeout` is now used in `handleRelog`.
- Renamed `defaultlang.json` in `src/data/lang/` to `english.json`
- Updated dataCheck to support the new language system
- Updated `!help` command response to include voting, favorizing and following request types
- Updated wiki pages related to new or changed features
- Updated dependencies
- Minor other changes

<details>
  <summary>A lot of language strings have changed because the variable syntax has been improved. This list is long, to see it click me</summary>

  - These language keys have been added:
    - langname
    - commentunsupportedtype
    - genericnoaccounts
    - genericrequestless
    - genericnotenoughavailableaccs
    - followprocessstarted
    - followsuccess
    - helpcommentowner
    - helpcommentuser
    - helpvote
    - helpfavorite
    - helpfollow
    - langcmdsupported
    - langcmdnotsupported
    - langcmdsuccess
    - settingscmdcouldnotconvert
    - settingscmdvaluereset
- These language keys have been removed:
    - votenoaccounts
    - voterequestless
    - votenotenoughavailableaccs
    - favoritenoaccounts
    - favoriterequestless
    - favoritenotenoughavailableaccs
    - helpcommentowner1
    - helpcommentowner2
    - helpcommentuser1
    - helpcommentuser2
    - helpping
    - helpjoingroup
- These language key's values have changed:
    - updaterautoupdatedisabled
    - commentcmdusageowner
    - commentcmdusageowner2
    - commentcmdusage
    - commentcmdusage2
    - commentrequesttoohigh
    - commentinvalidid
    - commentmissingnumberofcomments
    - commentzeroavailableaccs
    - commentnotenoughavailableaccs
    - commentnoaccounts
    - commentnounlimitedaccs
    - commentprocessstarted
    - commentfailedcmdreference
    - comment429stop
    - commentretrying
    - commentsuccess
    - voteprocessstarted
    - votesuccess
    - favoriteprocessstarted
    - favoritesuccess
    - useradded
    - userunfriend
    - userforceunfriend
    - commandnotfound
    - invalidnumber
    - invalidprofileid
    - invalidsharedfileid
    - idoncooldown
    - requestaborted
    - helpcommandlist
    - helpinfo
    - helpabort
    - helpabout
    - helpowner
    - helpreadothercmdshere
    - pingcmdmessage
    - ownercmdmsg
    - abortcmdnoprocess
    - abortcmdsuccess
    - resetcooldowncmdsuccess
    - settingscmdsamevalue
    - settingscmdvaluechanged
    - failedcmdnothingfound
    - failedcmdmsg
    - sessionscmdmsg
    - addfriendcmdacclimited
    - addfriendcmdsuccess
    - unfriendidcmdsuccess
    - unfriendallcmdpending
    - joingroupcmdsuccess
    - leavegroupcmdsuccess
    - leaveallgroupscmdpending
    - blockcmdsuccess
    - unblockcmdsuccess
    - childbotmessage

  This list was generated using my [langStringsChangeDetector.js](/scripts/langStringsChangeDetector.js) script.

</details>

Commit: [b4072cf](https://github.com/3urobeat/steam-comment-service-bot/commit/b4072cf)

&nbsp;

<a id="2.14.1"></a>

## **2023-12-28, Version 2.14.1**
**Additions:**
- Added logging of username in friendMessage event
- Added logging of friend relationship status in friendMessage and steamChatInteraction handlers
- Added [official discord plugin](https://github.com/3urobeat/steam-comment-bot-discord-plugin) to default package set
- Added a few emojis to the README.md to visually break up the wall of text
- Added a deprecation warning to `logininfo.json` import; please use `accounts.txt`

**Fixes:**
- Fixed data integrity check failing when using an absolute path [#217](https://github.com/3urobeat/steam-comment-service-bot/issues/217) by forcing working dir to `__dirname` in `start.js`
- Fixed two dependency errors on initial start caused by outdated node.js version
- Fixed `downloadUpdate()` deleting ratingHistory & userSetting database contents (whoops, sorry!)
- Fixed plugin config not being updated when plugin data directory of previously installed plugin has been deleted
- Fixed TypeError and missing license detected when null was provided in `config.json` `childaccplayinggames`
- Fixed comments not allowed on friendsonly profiles
  - Profile visibility is now handled better in general
- Fixed dataImport not resolving language correctly on restore

**Changes:**
- **Bumped minimum supported node.js version to v16.0.0!**
  - This fixes the two aforementioned dependency issues on initial start
- Improved how logininfo object is accessed during login and clarified index -> accountName association in wiki
- Failed follow request now inserts user into `ratingHistory.db` anyway because enum 2 is also used for a duplicate request
- Simplified inserting user into `lastcomment.db` database on friend request accept
- Improved language string `failedcmdnothingfound` to include all request types; russian translation update by [@sashascurtu](https://github.com/sashascurtu)
- Ignored `package-lock.json` in dataIntegrity check system
- Removed a few unnecessary last iteration checks when nothing async was happening
- Made `aggregatePluginConfig()` private
- Updated every file header to ISO date and update copyright date
- Wiki: Improved `unfriendtime` config key explanation
- Updated dependencies
- Minor other changes
