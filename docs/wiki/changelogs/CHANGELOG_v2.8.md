# Version 2.8.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.8.0](#2.8.0)
- [2.8.1](#2.8.1)
  
&nbsp;

<a id="2.8.0"></a>

## **2020-07-29, Version 2.8.0**
- Added proxy support (add them in proxies.txt)
- Added webserver to request comments and view the log
- Added !update command. Added !rc alias to !resetcooldown and "global" argument to reset global cooldown
- A Steam cooldown error will now apply a 5 min global cooldown to cmd requests
- Moved updater.js to src folder
- Fixed a lot of bugs, made things a bit more user-friendly and made other more minor changes

Commit: [091d7bd](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/091d7bd)

&nbsp;

<a id="2.8.1"></a>

## **2020-08-11, Version 2.8.1**
- Added whatsnew message to update confirmation
- Bot should now be able to change the terminal title on Linux
- Added quotes multi-line support
- Added more default quotes
- Added status codes to all webserver responses
- Corrected proxyShift behaviour
- A private profile check error won't stop the comment process anymore
- Fixed wrong proxy number when logging in with proxy x message

Commit: [3125654](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/3125654)