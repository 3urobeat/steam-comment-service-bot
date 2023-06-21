# Version 2.9.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.9.0](#2.9.0)
- [2.9.1](#2.9.1)
- [2.9.2](#2.9.2)
  
&nbsp;

<a id="2.9.0"></a>

## 2020-09-27, Version 2.9.0
- Added shared_secret support
- Added accounts.txt file to provide accounts in the username:password:shared_secret format
- Added !log, !abort, !settings, !unfriendall, !leaveallgroups, !block, !unblock commands
- Added custom quotes argument for !comment cmd
- Added custom error messages to steam errors for !comment cmd
- Added message spam protection and cooldown
- Added message to owners on successful update
- Added other checks to provide easier error descriptions etc and to make the bot more robust
- Fixed [#57](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/57)
- Minor other changes

Commit: [5ddef2a](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/5ddef2a)

&nbsp;

<a id="2.9.1"></a>

## **2020-10-21, Version 2.9.1**
- Comment logging will now only display the first line for multi-line comments
- Fixed friendlistcapacitycheck() not displaying the correct amount and not checking child accounts correctly
- lastsuccessfulcomment will now show the local time in the log
- Fixed cooldown not being correctly applied when only one comment was requested
- Added last processed comment request to !info cmd
- Reworked !settings cmd
- Minor other changes

Commit: [d7c5335](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/d7c5335)

&nbsp;

<a id="2.9.2"></a>

## **2020-10-23, Version 2.9.2**
- Fixed cooldown calculation error [#63](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/63)
- Reworked updater function and for better code quality
- Added file integrity checks that can restore backups from cache.json or pull from GitHub
- Minor other changes

Commit: [8847635](https://github.com/HerrEurobeat/steam-comment-service-bot/commit/8847635)