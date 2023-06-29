# Version 2.11.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.11.0](#2.11.0)
- [2.11.1](#2.11.1)
  
&nbsp;

<a id="2.11.0"></a>

## **2021-10-17, Version 2.11.0**
- The majority of the application has been restructured and rewritten
- The whole bot is now being started in a child_process
- Added !groupcomment command to be able to comment in groups
- Added !sessions and !mysessions commands ([#103](https://github.com/3urobeat/steam-comment-service-bot/issues/103))
- Improved logs by adding my output-logger library, added more log messages and improved many existing log messages
- Improved automatic error handling
- Fixed node-steamcommunity not using proxies and improved proxy support a lot in general
- Improved response of !settings, !log & !failed commands
- !failed and !abort now use the reciever steamid as parameter instead of the requester steamid
- Only certain commands are now blocked during startup ([#105](https://github.com/3urobeat/steam-comment-service-bot/issues/105))
- Probably fixed and improved a lot more stuff passively and without noticing
- Updated dependencies

If you are interested in more detail check out the 131 commits between 2.10.7 and 2.11. 

*At least node.js v14.15.0 is now required!*

Commit: [dfdec1e](https://github.com/3urobeat/steam-comment-service-bot/commit/dfdec1e)

&nbsp;

<a id="2.11.1"></a>

## **2021-10-22, Version 2.11.1**
- Fixed log spam issues with animations
- Fixed security vulnerability in !abort and !failed command

Commit: [e894361](https://github.com/3urobeat/steam-comment-service-bot/commit/e894361)