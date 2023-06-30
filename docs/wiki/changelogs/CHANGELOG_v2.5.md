# Version 2.5.x Changelog
[⬅️ Go back to version overview](../version_changelogs.md)

&nbsp;

**Current**  
- [2.5.0](#2.5.0)
- [2.5.1](#2.5.1)
  
&nbsp;

<a id="2.5.0"></a>

## **2020-03-07, Version 2.5.0**
- Added !info command
- Fixed bug that would occur when the bot tried to add someone to lastcomment.json after accepting request when he was offline
- User specific comment cooldown will now only be handled by lastcomment.json
- Added feature to disable eval command (default)

Commit: [bf84246](https://github.com/3urobeat/steam-comment-service-bot/commit/bf84246)

&nbsp;

<a id="2.5.1"></a>

## **2020-03-10, Version 2.5.1**
- Added checker to check on startup if all friends are in lastcomment.json
- Fixed lastcomment cooldown checker
- Fixed resetcooldown cmd
- Fixed config checker for my name
- Changed a few logger messages

Commit: [afd519f](https://github.com/3urobeat/steam-comment-service-bot/commit/afd519f)