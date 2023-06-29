# Version 2.12.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.12.0](#2.12.0)
- [2.12.1](#2.12.1)
- [2.12.2](#2.12.2)
- [2.12.3](#2.12.3)
- [2.12.4](#2.12.4)
- [2.12.5](#2.12.5)
  
&nbsp;

<a id="2.12.0"></a>

## **2022-07-30, Version 2.12.0**
**Additions:**
- Added advancedconfig.json with lots of options
- Added basic plugin support
- Added a retryComments system that can automatically retry failed comments ([#104](https://github.com/3urobeat/steam-comment-service-bot/issues/104))
- Added steamid-resolver support to !comment, !groupcomment, !abort, !failed, !rc, !addfriend, !unfriend, !block and !unblock commands so that you can now specify profile links as well and the bot automatically converts them to IDs 
- Added !sessions and !mysessions command to view all active comment sessions and their status (owner only) as well as only sessions for your profile (all users)
- Added debug messages that can be enabled in the advancedconfig
- Added a create and restore backup system that is executed by updater
- Added module to convert ownerids to steamID64s to improve amount of accepted formats in config and increase ease of setup
- Added support for setting primaryGroup (sadly currently disabled by node-steamcommunity)
- Added useLocalIP setting to disable usage of your own IP in proxy system
- Added more default quotes

&nbsp;

**Reworks:**
- Reworked profile- and groupcomment command files by splitting it up into modules and reworking loop
- Renamed cmisc.js file to commentmisc.js
- Renamed globalcommentcooldown value in config to botaccountcooldown
- Removed allowcommentcmdusage value from config as it is now controlled by maxComments
- Removed differentiation between error on first comment iteration and another, which was a relic from older versions and is now more of an inconvenience 
- Removed a default quote that was >1000 chars, leading to error

&nbsp;

**Fixes:**
- Fixed trailing slash in config owner & group urls causing a profile not found error in my node-steamid-resolver library ([#119](https://github.com/3urobeat/steam-comment-service-bot/issues/119))
- Fixed proxy index in login error message being undefined, relog message showing wrong proxy index and removed error enum from relog error message as it was undefined
- Fixed unfriend check running even when unfriendtime is set to 0 ([#124](https://github.com/3urobeat/steam-comment-service-bot/issues/124))
- Fixed chat messages failing when >1000 chars by cutting them and sending users a fallback message if Steam blocked a message ([#125](https://github.com/3urobeat/steam-comment-service-bot/issues/125))
- Fixed config owner /profiles/ URL not being accepted
- Fixed multiple useradded messages from main bot when adding x child accounts while bot was offline
- Fixed typo leading to unfriendall cmd not working
- Fixed auth code not getting regenerated on relog if user provided shared_secret in logininfo, leading to invalid steam guard code and relog failing
- Fixed numberOfComments not provided check not checking correctly
- Fixed finished message being sent again when all proxies failed message had already been sent
- Fixed getQuote helper being able to return all quotes as array at once, leading to >1000 chars error
- Fixed group invites handling when acceptgroupinvites is disabled not working as expected
- Fixed botsgroup auto join feature not working and moved it to webSession event handler
- Fixed command spam protection not working
- Fixed webSession event handler constantly re-running when no botsgroup was set (caused by botsgroup checker)
- (Hopefully) fixed encryption error disconnect leading to relog breaking with steam-user update. [Forum Thread](https://dev.doctormckay.com/topic/4187-disconnect-due-to-encryption-error-causes-relog-to-break-error-already-logged-on)

&nbsp;

**Changes:**
- Improved accountOrder algorithm, it will now prioritize bot accounts the user is already friend with to avoid repeating friend request messages
- Using !unfriend command without providing profileid now unfriends the message sender with all bot accounts
- Drastically reduced the amount of log messages (especially on startup) and improved behaviour of log lib in stdout
- Changed order of called modules in controller.js to make more sense
- Changed update from chat instructions when automatic updater is turned off
- Moved webserver to a plugin that is shipped by default
- Delayed updater to make sure accounts log off loop has finished
- Ready message now shows project name instead of bot0 username
- Hiding "Deleting node_modules folder content" message in npminteraction helper when folder was created a second earlier to reduce possible confusion
- The bot now checks if the id of a bot account matches with an owner link/id in config and displays a warning
- Improved checkAndGetFile() to handle error on require and checking controller.js as well
- Improved code quality by changing many callbacks to promises (no more callback hell in controller.js hurray!), splitting more stuff up into modules and letting the logging lib handle reading input from stdin instead of doing it myself
- Reduced RAM usage (steam-user update)
- Improved startup time by a few seconds
- Fixed a few ascii art issues and added some more arts
- Updated dependencies
- Improved and refreshed README

Commit: [a24e457](https://github.com/3urobeat/steam-comment-service-bot/commit/a24e457)

&nbsp;

<a id="2.12.1"></a>

## **2022-10-16, Version 2.12.1**
**Additions:**
- Added support for Steam's new token based login flow with a new sessionHandler module powered by [node-steam-session](https://github.com/DoctorMcKay/node-steam-session)
- Added a token storage system with invalid token checking and cleanup
- Added a token expiring in <=7 days warning system (runs every 24h) which also allows the user to directly refresh the tokens of all bot accounts while the application is running (requires a relog)
- Added compatibility system between old and new login flow to make auto updating possible
- Added info message about new login flow
- Added more debug log messages
- Added instructions comment to proxies.txt to improve first time user experience

**Fixes:**
- Fixed steamID related errors in ready.js by making sure bot object is populated before proceeding ([#135](https://github.com/3urobeat/steam-comment-service-bot/issues/135))
- Fixed relogInterval from being able to be set multiple times
- Fixed disconnected event trying to initiate a relog for accounts which are already in the relogQueue
- Fixed an error when accounts.txt or proxies.txt was completely empty (even missing the comment)
- Fixed an error when activecommentprocess entry was deleted by updater or handleExpiringTokens.js while comment module was busy handling an aborted comment process
- Fixed bot not responding to comment command when no arguments were provided
- Fixed a lot of spelling mistakes

**Changes:**
- Removed steam-user's steamGuard event which is now unused as the sessionHandler handles 2FA
- Exchanged all numeric enums with text enums to avoid issues should they change
- Removed logininfo.json from default files and focused documentation and comments more on accounts.txt to improve first time user experience (logininfo.json is still supported!) 
- Removed old unused 2.10 -> 2.11 compatibility files (not compatibility features but files that were required because of hard coded file paths)
- Prioritized logininfo empty check over config checks to make the user focus on the more important error
- Added printNow parameter to logger, making readyafterlogs detection less wonky
- Added eslint code styling rules and enforced them (massive commit)
- Updated dependencies

Commit: [d9ab995](https://github.com/3urobeat/steam-comment-service-bot/commit/d9ab995)

&nbsp;

<a id="2.12.2"></a>

## **2022-11-08, Version 2.12.2**
**Additions:**
- Added a login timeout detection system that force-progresses the relogQueue to prevent the bot from soft-locking ([#139](https://github.com/3urobeat/steam-comment-service-bot/issues/139))

**Fixes:**
- Fixed sessionHandler throwing an cancelLoginAttempt() error when skipping steamGuardCode
- Fixed ready check not working when an account was skipped
- Fixed error on cache refresh when an account was skipped
- Fixed relog retry on relog error not working
- Fixed relogAccount not countring logOnTries correctly, resulting in endless relog retries
- Fixed relog skip not removing account from relogQueue
- Fixed skipped accounts after relog being selected for comment requests, leading to comment failures

**Changes:**
- Chat messages sent by the bot will now always be logged (cut down version)
- Ready check will now be attached only on the last login iteration to improve performance a bit
- Account that encounters the "impossible 2fa code error message" in sessionHandler will now be skipped to prevent soft-lock
- Accounts disconnecting because of LogOnSessionReplaced are now skipped correctly
- Failed to send chat msg fallback msg will now be sent after 5 seconds instead of instantly to prevent further rate limiting
- Updated dependencies

Commit: [b641fd7](https://github.com/3urobeat/steam-comment-service-bot/commit/b641fd7)

&nbsp;

<a id="2.12.3"></a>

## **2023-03-06, Version 2.12.3**, co-author [@LesikEdelweiss](https://github.com/LesikEdelweiss)
**Fixes:**  
- [#150](https://github.com/3urobeat/steam-comment-service-bot/issues/150) updates `steam-session` dependency to fix [#184](https://github.com/3urobeat/steam-comment-service-bot/issues/184) and [#149](https://github.com/3urobeat/steam-comment-service-bot/issues/149) 

**Changes:**  
- Reworded second E-Mail note when retrieving new session as Steam might have fixed the bug
- Updated all dependencies

Commit: [2b6cefd](https://github.com/3urobeat/steam-comment-service-bot/commit/2b6cefd)

&nbsp;

<a id="2.12.4"></a>

## **2023-03-14, Version 2.12.4**
**Fixes:**
- Fixed bot asking for steam guard code even for accounts with a shared_secret [#152](https://github.com/3urobeat/steam-comment-service-bot/issues/152)

**Changes:**
- Updated dependency `steam-session`

Commit: [be5e154](https://github.com/3urobeat/steam-comment-service-bot/commit/be5e154)

&nbsp;

<a id="2.12.5"></a>

## **2023-03-20, Version 2.12.5**
**Additions:**
- Added force-unfriend system to always keep 1 slot free on the friendlist of every bot account
- Added automatic compatibility finding & running system
- Added comments request amount `max` as alias for keyword `all`
- Added info message on config import error should firststart be true to explain new users what happened
- Friend messages from blocked users will now be logged with logtype DEBUG

**Fixes:**
- Fixed unfriend messages missing from lang file

**Changes:**
- Edited chat message error message to be more concise
- Edited login flow change msg to warning and send it via steam chat
- Optimized accsToAdd message constructor by using the cachefile botaccid array instead of creating a new SteamID obj for every account
- Moved friendMessage event block checks to a dedicated helper
- Shortened data import section in `controller.js`
- Updated `steam-session` to v1.1.0

Commit: [0d472be](https://github.com/3urobeat/steam-comment-service-bot/commit/0d472be)