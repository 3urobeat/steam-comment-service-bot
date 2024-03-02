# Version 2.15.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.15.0](#2.15.0)
  
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
