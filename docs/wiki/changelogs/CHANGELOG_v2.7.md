# Version 2.7.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.7.0](#2.7.0)
- [2.7.1](#2.7.1)
- [2.7.2](#2.7.2)
- [2.7.3](#2.7.3)
  
&nbsp;

<a id="2.7.0"></a>

## 2020-06-29, Version 2.7.0
- One account can now comment multiple times (repeatedComments in config)!
- Added !failed command to see all detailed comment errors
- Revamped the console interface
- Reworked the updater with master and beta branch updating
- If your lastcomment.json got corrupted the bot will now erase the content instead of crash
- The bot will now list accounts the user has to add if they are limited instead of waiting for a steam error
- Removed a few widely unused config options
- Added heartbeat to !ping and more info to !info cmd
- You can now reset the cooldown of another user
- Added disableautoupdate to config
- Changed botsgroupid to botsgroup and made it a url
- Added more default quotes
- Many many more behind the scene changes (check out beta-testing branch commits for way more detail!)

Commit: [6b89f8c](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/6b89f8c)

&nbsp;

<a id="2.7.1"></a>

## **2020-06-30, Version 2.7.1**
- Fixed crash when child bot recieved message
- Fixed limited check crash when skipping account
- Fixed comment limited & not friend check
- Fixed auto skipSteamGuard

Commit: [7b28378](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/7b28378)

&nbsp;

<a id="2.7.2"></a>

## **2020-07-03, Version 2.7.2**
- New !addfriend command
- Added cache.json file to reduce steam group64id requests
- Fixed group invite crash
- Fixed clearLine issues ([#48](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/48))
- Fixed beta-testing not updating to new beta versions when on release version
- Fixed limited checker issues ([#49](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/49))
- Added error handling when logging in
- Removed status setting in config
- Added childaccsplaygames in config
- Added disconnected message for all bots
- Added more ascii arts
- Minor other changes

Commit: [8adc902](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/8adc902)

&nbsp;

<a id="2.7.3"></a>

## **2020-07-21, Version 2.7.3**, [removed on July 24, 2020] 
- Updated start.js to prepare for future 2.8 update.

Commit: [e945938](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/e945938)