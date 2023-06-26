# Version 2.6.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.6.0](#2.6.0)
- [2.6.1](#2.6.1)
- [2.6.2](#2.6.2)
- [2.6.3](#2.6.3)
- [2.6.4](#2.6.4)
  
&nbsp;

<a id="2.6.0"></a>

## **2020-04-30, Version 2.6.0**
- Added option to skip steamGuard
- Added dynamic login time evaluation and wait time conversion
- Added data.json
- Changed filestructure
- Changed updater functionality
- Reworked lastcomment functionality
- Added dynamic help message
- Cleared up startup logs
- Minor other changes and bugfixes

Commit: [0d0f633](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/0d0f633)

&nbsp;

<a id="2.6.1"></a>

## **2020-04-30, Version 2.6.1**
- Fixed a mistake that would crash the bot when the user adds a child bot account
- Added default quotes in quotes.txt

Commit: [c6fe60a](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/c6fe60a)

&nbsp;

<a id="2.6.2"></a>

## **2020-05-01, Version 2.6.2**
- Fixed skipped accounts not being skipped after restart
- Change file updating order
- Fixed bot crashing when trying to logOff in updater
- Fixed config existing keys checker in updater
- Fixed updateeverywhere() still using loginindex instead of accountid when writing to lastcomment.json
- Changed one wrong error description in error catch in commenteverywhere()

Commit: [29e43b3](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/29e43b3)

&nbsp;

<a id="2.6.3"></a>

## **2020-05-15, Version 2.6.3**
- Added check if user is somehow not in lastcomment.json to prevent crash right infront of cooldown check
- Fixed messages going to the receiver when sending comments to another profile by saving the requester's steamID
- Changed command usage messages to account for user's priviliges
- Other minor fixes/changes

Commit: [29a0d82](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/29a0d82)

&nbsp;

<a id="2.6.4"></a>

## **2020-05-21, Version 2.6.4**
- Fixed bot corrupting the config and crashing on restart due to simultaneous writes

Commit: [6c06b31](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/6c06b31)