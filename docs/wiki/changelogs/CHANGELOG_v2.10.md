# Version 2.10.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.10.0](#2.10.0)
- [2.10.1](#2.10.1)
- [2.10.2](#2.10.2)
- [2.10.3](#2.10.3)
- [2.10.4](#2.10.4)
- [2.10.5](#2.10.5)
- [2.10.6](#2.10.6)
- [2.10.7](#2.10.7)
  
&nbsp;

<a id="2.10.0"></a>

## **2021-03-09, Version 2.10.0**
- Switched to database storage system for lastcomment
- Added attempts to retry failed logins
- Added !stop cmd
- Reformatted some messages
- Added custom language support
- Added childaccplayinggames to set custom games and steam games for all child accounts
- Improved quote randomization
- Added account randomization option
- Improved code formatting
- Minor other changes

Commit: [3547d8d](https://github.com/3urobeat/steam-comment-service-bot/commit/3547d8d)

&nbsp;

<a id="2.10.1"></a>

## **2021-03-11, Version 2.10.1**
- Fixed unfriend check logging an steam64id undefined error ([#81](https://github.com/3urobeat/steam-comment-service-bot/issues/81))
- Removed unnecessary process event listeners (This could also fix [#78](https://github.com/3urobeat/steam-comment-service-bot/issues/78))
- Added check if all friends are in lastcomment database
- Fixed resetcooldown not being able to reset global cooldown in one try
- Fixed comment log msg displaying even on error when more than 1 comment was requested
- Minor other changes

Commit: [f2db506](https://github.com/3urobeat/steam-comment-service-bot/commit/f2db506)

&nbsp;

<a id="2.10.2"></a>

## **2021-03-16, Version 2.10.2**
- Fixed updater not waiting for active comment request to be completed
- Fixed user not getting removed from activecommentprocess array when requesting 1 comment ([#83](https://github.com/3urobeat/steam-comment-service-bot/issues/83))
- Fixed bot getting stuck on startup when accounts.txt was used and had empty lines ([#80](https://github.com/3urobeat/steam-comment-service-bot/issues/80))
- Added a commentcounter based on [#87](https://github.com/3urobeat/steam-comment-service-bot/issues/87)
- Add limited bot accounts message has now clickable links ([#84](https://github.com/3urobeat/steam-comment-service-bot/issues/84))
- Added custom lastcomment.json error message
- Added check to fix [#85](https://github.com/3urobeat/steam-comment-service-bot/issues/85)
- Increased default commentdelay to 15000
- Minor other changes

Commit: [9aaea39](https://github.com/3urobeat/steam-comment-service-bot/commit/9aaea39)

&nbsp;

<a id="2.10.3"></a>

## **2021-03-25, Version 2.10.3**
- Fixed globalcommentcooldown not getting applied correctly leading to multiple comment processes at the same time ([#91](https://github.com/3urobeat/steam-comment-service-bot/issues/91))
- Fixed HTTP 429 error not aborting comment process
- friendMessage in log will now get cut off after 75 characters
- Changed globalcommentcooldown unit from ms to minutes
- Minor other changes

Commit: [fa6d0f4](https://github.com/3urobeat/steam-comment-service-bot/commit/fa6d0f4)

&nbsp;

<a id="2.10.4"></a>

## **2021-05-02, Version 2.10.4**
- Improved functionality to keep certain data over auto restarts
- Replaced repeatedComments functionality with maxComments & maxOwnerComments in config ([#89](https://github.com/3urobeat/steam-comment-service-bot/issues/89))
- enableurltocomment is now false by default
- Added check for quote character limit
- Added community ban disclaimer to startup msgs
- Added potential fix for websession not getting set after reconnect
- Fixed [#85](https://github.com/3urobeat/steam-comment-service-bot/issues/85) for real now
- Fixed limited & not friend check not using randomizeAccounts order
- Fixed comment command not refreshing config changes made by !settings cmd
- Fixed commentdelay getting added to globalcommentcooldown when only 1 comment got requested
- Updated npm packages
- Minor other changes

Commit: [7ca8ded](https://github.com/3urobeat/steam-comment-service-bot/commit/7ca8ded)

&nbsp;

<a id="2.10.5"></a>

## **2021-05-09, Version 2.10.5**
- Added custom relog function to fix not all accounts relogging after loosing connection ([#93](https://github.com/3urobeat/steam-comment-service-bot/issues/93))
- Fixed error when not confirming/declining update on startup whith disabled auto-update
- Fixed updater not updating to/from BETA versions when branch was switched from beta-testing to master
- Minor other changes

Commit: [fafad59](https://github.com/3urobeat/steam-comment-service-bot/commit/fafad59)

&nbsp;

<a id="2.10.6"></a>

## **2021-05-16, Version 2.10.6**
- Fixed restart function not correctly unloading old session leading to crashes ([#94](https://github.com/3urobeat/steam-comment-service-bot/issues/94))
- Fixed bot not relogging after connection loss that wasn't NoConnection ([#95](https://github.com/3urobeat/steam-comment-service-bot/issues/95))
- Updater will now announce waiting for active comment process to finish when triggering update using the !update cmd
- Added delays to unfriend & leavegroup calls
- Comment log message will now specifiy comment number (x out of x)
- Updated dependencies
- Minor other changes

Commit: [560e130](https://github.com/3urobeat/steam-comment-service-bot/commit/560e130)

&nbsp;

<a id="2.10.7"></a>

## **2021-06-13, Version 2.10.7**
- Fixed !help command not working by shortening it
- Added !commands alias to !help command
- Improved instructions on how to provide login informations
- Now shipping accounts.txt file by default
- Added comment to accounts.txt file
- Added logging message that logs the OS on startup

Commit: [ba9bc71](https://github.com/3urobeat/steam-comment-service-bot/commit/ba9bc71)