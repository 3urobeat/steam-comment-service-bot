# Version 2.15.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.15.0](#2.15.0)
- [2.15.1](#2.15.1)
- [2.15.2](#2.15.2)
- [2.15.3](#2.15.3)
- [2.15.4](#2.15.4)
  
&nbsp;

<a id="2.15.0"></a>

## **2024-03-03, Version 2.15.0**
**Changes of note (TL;DR):**  
- Added new commands: `!funnyvote`, `!jobs`
- Added support for commenting and voting on reviews and for commenting on eventcomments discussions
- Drastically decreased startup time for larger instances with many proxies by applying logindelay per proxy instead of per account
- Added QR-Code login
- Added a JobManager to group routinely executed functions in one place and allowing the registration and unregistration of jobs during runtime
- Added automatic plugin update on boot and `botVersion` parameter to check and warn of version mismatch

If you are using a `customlang.json`, make sure to read the language string changes at the end and update your file.  
If you've made a plugin, check the 'Creating Plugins' wiki page and add the `botVersion` parameter to your `package.json`.

&nbsp;
&nbsp;

**Additions:**
- Added new commands: `!funnyvote`, `!jobs`
- Added support for commenting and voting on reviews! Suggestion in [#207](https://github.com/3urobeat/steam-comment-service-bot/issues/207)
  - Updated `!comment` command to accept reviews
  - Updated `!upvote` & `!downvote` commands to accept reviews
  - Added `!funnyVote` command for reviews
  - Added review detection support to handleSteamIdResolving helper
  - Added a library patch to load my changes until [my PR to the SteamCommunity library gets accepted](https://github.com/DoctorMcKay/node-steamcommunity/pull/335)
- Added support for commenting on eventcomments discussions! Suggestion in [#219](https://github.com/3urobeat/steam-comment-service-bot/issues/219)
  - Updated the discussion library patch associated to [my SteamCommunity library PR](https://github.com/DoctorMcKay/node-steamcommunity/pull/319)
- Added a JobManager system
  - The JobManager groups routinely executed functions in one place and allows the registration and unregistration of jobs during runtime
  - Added `!jobs` command to see registered jobs directly from the Steam Chat (or any other Plugin which implements the CommandSystem)
- Added Chinese & Portuguese translation [@isyuricunha](https://github.com/isyuricunha) in [#232](https://github.com/3urobeat/steam-comment-service-bot/pull/232), Chinese updated by Scaperace
- Added automatic Plugin update on boot system
- Added `botVersion` parameter in `package.json` requirement to plugins
  - Added a version mismatch check with warning message when plugin is loaded
  - Added a `blockPluginLoadOnMismatchedBotVersion` setting to `advancedconfig.json` to manually block loading of plugins with mismatched `botVersion` parameters
- Added support for logging in with a Steam Mobile App QR-Code 
- Added support for setting online status for main account and child accounts in `advancedconfig.json`
- Added `disableSendingRequests` setting to `advancedconfig.json`
- Added `!requests` alias to `!sessions` and `!myrequests` alias to `!mysessions`
- Added EIdTypes enum to handleSteamIdResolving to document supported results
- Added a `!lang` cmd reference, including how many languages are currently supported, to `useradded` message
- Added `duplicateQuotesDetector.js` script to detect duplicate strings in `quotes.txt` file
- Added login cooldown/block detection to SessionHandler
- Added a stargazers over time chart to `README.md`

&nbsp;

**Reworks:**
- Logindelay is now applied per proxy instead of per account to greatly improve login speed for larger instances
  - Accounts are divided into a fastQueue & slowQueue, depending on if they require user interaction (e.g. Steam Guard code input)
  - Added POSTPONED bot EStatus to signal that account in fastQueue needs to be transferred to slowQueue
  - Updated associated estimated login time calculation
  - Improved logging of login progress and online status events
  - Added more login guards to potentially prevent unwanted login requests
- Languages are now loaded dynamically on startup, instead of being hardcoded
- Reworked voting commands to compress `!upvote` and `!downvote` into one function
- Converted existing individual intervals to JobManager jobs
- Improved information logged by npminteraction handler for first time users
- Improved translating chapter on contribution wiki page
- Improved errors_doc wiki page as it was pretty outdated
- Improved Setup Guide wiki page styling with markdown highlights
- Improved various JsDocs

&nbsp;

**Fixes:**
- Fixed new refreshToken not getting stored because event was not being handled
- Fixed plugins not being able to be installed without updating `fileStructure.json` by ignoring `package.json` in script
- Fixed player_name retrieval fail throwing error when user isn't cached when receiving or sending chat messages, e.g. immediately after accepting a friend request
- Fixed lang import failing when folder or only `english.json` is missing
- Fixed certain class props not being included in `types.d.ts` because a JsDoc was missing or incorrect
- Fixed `useradded` message being able to fail when sending too quickly after accepting friend request by delaying it by 2.5 seconds
- Fixed `!update` response messages being able to fail because accounts were logged off too fast by delaying initiateUpdate() call by 2.5 seconds
- Fixed incorrect command name `!vote` in help message by changing it to `!upvote`
- Fixed line number in dataImport quotes check warning message being wrongly offset by 1
- Fixed wrong/missing variable syntax in language strings associated to `!update` command
- Fixed wrong/missing variable syntax in `commentretrying` language string
- Fixed multiple "Already attempting to log on, cannot log on again" errors caused during login/relog, introduced by recent steam-user update
- Fixed low friendlist space warning showing bot[object Object]
- Fixed duplicate login requests being able to happen when login error handler and login timeout handler took action at the same time
- Fixed CommandHandler's `runCommand()` throwing error when resInfo parameter was `undefined`
- De-duped strings in `quotes.txt` file

&nbsp;

**Changes:**
- All request types will now enforce maxRequest settings set in `config.json`. Previously only the comment command would enforce it.
- Improved up-/downvote ratingHistory database operations
- Improved missing accounts error message in vote and curatorFollow requests by returning specific nounlimited message
- Primary Group will now only be set if not already done. This does not reduce amount of requests (unless Steam weights requests differently and a editProfile request is heavier than a profile fetch) made but rather reduces log-noise
- Generalized requesttoohigh & commentnounlimitedaccs language strings to be used for all request types
- The dataIntegrity check is now getting executed slightly earlier on startup
- Updated `steam-comment-bot-template`, `steam-comment-bot-webserver`, `steam-comment-bot-discord-plugin` and `steam-comment-bot-rest` ([#7](https://github.com/DerDeathraven/steam-comment-bot-rest-api/pull/7), [#8](https://github.com/DerDeathraven/steam-comment-bot-rest-api/pull/8)) to v2.15
  - Plugin `steam-comment-bot-webserver` is now shipped as a NPM registry package instead of as a locally packed one
- Updated russian translation by [@sashascurtu](https://github.com/sashascurtu) in [#235](https://github.com/3urobeat/steam-comment-service-bot/pull/235)
- Disabled now unused 32 bit int limit `requestDelay * maxRequests` startup check
- Updated wiki pages (config_doc, advancedconfig_doc, commands_doc, creating_plugins, steam_limitations, setup_guide) to accomodate changes made in this update
- Updated dependencies
- Minor other changes

<details>
  <summary>Click me to see updated language strings</summary>

  - These language keys have been added:
    - genericnounlimitedaccs
    - voteunsupportedtype
    - requesttoohigh
    - invalidreviewid
    - errloadingreview
    - jobscmdregistered
    - jobscmdnoneregistered
  - These language keys have been removed:
    - commentrequesttoohigh
    - commentnounlimitedaccs
  - These language key's values have changed:
    - commentcmdusageowner
    - commentcmdusageowner2
    - commentinvalidid
    - commentunsupportedtype
    - commentretrying
    - useradded
    - updatecmdforce
    - updatecmdcheck
    - helpvote
    - helpfavorite
    - abortcmdnoprocess
    - failedcmdnothingfound

  This list was generated using my [langStringsChangeDetector.js](/scripts/langStringsChangeDetector.js) script.

</details>

Commit: [be41d68](https://github.com/3urobeat/steam-comment-service-bot/commit/be41d68)

&nbsp;

<a id="2.15.1"></a>

## **2024-03-08, Version 2.15.1**
**Fixes:**
- Fixed login process being softlocked after an account attempted to switch from their faulty proxy
- Fixed failed vote & fav requests throwing an error when trying to log the error

**Changes:**
- Reduced amount of log messages logged during login, disconnect and relog
- Reduced amount of log messages logged during the general startup
- Reduced chances of startup ascii art showing an easter egg ascii art
- Updated dependencies
- Minor other changes

Commit: [a8a04eb](https://github.com/3urobeat/steam-comment-service-bot/commit/a8a04eb)

&nbsp;

<a id="2.15.2"></a>

## **2024-05-09, Version 2.15.2**
**Additions:**
- Added traditional chinese translation [@Tira-tw](https://github.com/Tira-tw) in [#242](https://github.com/3urobeat/steam-comment-service-bot/pull/242)
- Added !add alias to !addfriend command
- Added steamGuardQrCode event to enable plugins to resolve Steam Guard QR-Code requests
- Added more login related log messages to default log level
- Added more login related debug log messages to improve ability to debug login process resolving issues
- Added (experimental) force-resolve feature to login process when inactivity is detected
- Added setting 'enableRelogOnLogOnSessionReplaced' to `advancedconfig.json` to control whether the bot should relog accounts that have lost their connection with the error 'LogOnSessionReplaced'. Default value is `true`. To retain the same behavior as previously, where the bot would skip those accounts, set the value to `false`.

**Fixes:**
- Fixed login starting faster than plugin load, making it unable for them to handle steamGuardCode events
- Fixed proxy switcher not switching to proxy 0
- Fixed default quotes file containing a political entry
- (Potentially) finally fixed 'Already logged on, cannot log on again' errors when relogging for good
- Fixed potential login softlock when account switches proxy while a login process is active, with that account queued in it
- Fixed wrong syntax of variable in language string 'addfriendcmdsuccess'
- Fixed 'userunfriend' & 'userforceunfriend' language strings being flipped internally

**Changes:**
- The bot will now always emit the ready event on the second login rerun even if POSTPONED accounts still exist
- Refactored some code to use the proper log prefix more consistently instead of sometimes switching to bot index
- Refactored some code to surround userIDs more consistently with quotation marks
- Refactored some code to simplify the unfriendall command
- Improved contributing page
- Improved issue templates
- Migrated eslint config for eslint v9 and added & enforced two more rules
- Updated hostname check
- Updated dependencies
- Minor other changes

Commit: [df92d84](https://github.com/3urobeat/steam-comment-service-bot/commit/df92d84)

&nbsp;

<a id="2.15.3"></a>

## **2024-08-13, Version 2.15.3**
**Additions:**
- Added a few new default quotes
- Added note about escaping newline in quotes to setup guide
- Added commentsIpCooldownPenalty setting to advancedconfig [#250](https://github.com/3urobeat/steam-comment-service-bot/issues/250)
- Added VsCodium project file to remote repository to store command for starting debug session 
- Rest-API Plugin: Added support for subscribing to PluginSystem events. See the Pull Request [#10](https://github.com/DerDeathraven/steam-comment-bot-rest-api/pull/10) for more info.

**Fixes:**
- Fixed IP cooldown error penalty in comment requests stacking when using proxies [#250](https://github.com/3urobeat/steam-comment-service-bot/issues/250)
- Fixed all proxies failed detection in comment processes triggering too soon, leading to aborted request with functioning proxies still left
- Fixed Unhandled Rejection error when logging proxy used to login when proxy provided in proxies.txt did not include 'http://' [#248](https://github.com/3urobeat/steam-comment-service-bot/issues/248)
- Fixed SteamCommunity requests failing when using proxies not preceded by 'http://' [#248](https://github.com/3urobeat/steam-comment-service-bot/issues/248)
- Fixed proxy switcher logging suppressed messages during startup
- Fixed proxy error on initial login causing a softlock
- Fixed friend commands not prefixing success messages with `/me`
- Fixed intentionally escaped newline characters in quotes getting 'activated'
- Docs: Fixed broken link in setup guide
- Docs: Fixed broken link in accounts.txt comment
- Docs: Fixed missing reference to unload function in plugin documentation
- Discord Plugin: Fixed registerCommands failing when a command does not provide any args and added a check to avoid an Unhandled Rejection when using an outdated node.js version

**Changes:**
- Drastically reduced complexity of getting bot accountName by making it a top-layer property
- Refactored unfriendCheck handler
- Docs: Reworked adding proxies page
- Removed docs directory from file checksum check
- Updated dependencies
- Minor other changes

Commit: [199aa8a](https://github.com/3urobeat/steam-comment-service-bot/commit/199aa8a)

&nbsp;

<a id="2.15.4"></a>

## **2024-10-13, Version 2.15.4**
**Additions:**
- Log error stack (if available) when creating session fails
- Unified all request (comment, vote, ...) iteration skip handlers into one
- Unified all request (comment, vote, ...) error handlers into one
  - This also brings features like aborting request on IP cooldown on all proxies to non comment request types
- The `!failed` command now mentions the type of request in its response
- Added progress log message in `dataProcessing` to accurately reflect if bot is hanging on converting owner and group vanities to IDs

**Fixes:**
- Fixed continuously running "Finished logging in..." animation
- Fixed "Detected inactivity [...]" message not displaying non-populated accounts
- Fixed "Detected inactivity [...]" message printing multiple times per minute
- Fixed login softlock checker not handling inactivity when account is online but not populated
- Fixed "[...] waiting for user object [...] to populate" message spamming output file
- Fixed group issues in dataProcessing & log issues in ready when config prop is missing
- Fixed handleMissingGameLicenses causing webSession to loop when config prop is missing
- Fixed supplying steam-session login data without username/password, leading to cryptic error for users
  - The session handler now clarifies which account is missing a password
- Fixed controller interpreting Promise from Updater wrong, leading to a short lived double startup behavior after an update

**Changes:**
- Renamed `commentsIpCooldownPenalty` advancedconfig setting to `requestsIpCooldownPenalty`
  - This cooldown now applies to all request types, this rename reflects that change
  - Added compatibility feature to transfer customized setting
- The `!failed` command now refers to index as interaction to use more intuitive terms
- Revised a bunch of log messages to improve user experience
  - Failing to load a language file does not log a confusing error stack anymore before it gets replaced by `dataIntegrity`
- Softlock Handler log messages now include a timestamp
- Refactored a few parts of the codebase
- Moved expiring tokens job register call to ready event and run it instantly
- Replaced deprecated `--production` flag in npm commands with `--omit=dev`
- Updated dependencies
- Minor other changes

