# Controller Events
[⬅️ Go back to Controller](./controller.md) <a href="/src/controller/events" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Folder-darkcyan"></a>

&nbsp;

The events folder contains functions for events which the Controller supports.  
These functions are called by the Controller, which then in turn actually emit the event using the `controller.events` EventEmitter.  
This allows for running internal code (e.g. ready event) before an external module receives them.

&nbsp;

## Table of Contents
- [ready](#ready-)
- [statusUpdate](#statusUpdate-)
- [steamGuardInput](#steamGuardInput-)
- [steamGuardQrCode](#steamGuardQrCode-)
- [dataUpdate](#dataUpdate-)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific event using its name on this page.

&nbsp;

## ready <a href="/src/controller/events/ready.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when the bot finished logging in all bot accounts for the first time since the last start/restart.

Before emitting the event, the bot will
- ...log the ready messages containing a variety of useful information
- ...instruct the [DataManager](../dataManager/dataManager.md) to refresh the `cache.json` backups of all config files
- ...log held back log messages from during the startup
- ...perform various checks and display warnings if for example the friendlist space is running low
- ...and update the total login time in data.json.

No arguments.

## statusUpdate <a href="/src/controller/events/statusUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when any bot account changes their online status.

Before emitting the event, the bot will update the `status` property of the affected bot account to the new status.

The event is emitted with the parameters
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `newStatus` (Bot.[EStatus](/src/bot/EStatus.js)) - The new status of this bot

## steamGuardInput <a href="/src/controller/events/steamGuardInput.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when any bot account requires a Steam Guard Code to be submitted before it can continue logging in.

The event is emitted with the parameters
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `submitCode` (function(string): void) - Function to submit a code. Pass an empty string to skip the account.

The `submitCode` function allows users to implement accepting Steam Guard Codes from users into their plugins. This is very cool.  
Check out how the [template plugin](https://github.com/3urobeat/steam-comment-bot-template-plugin/blob/main/plugin.js) implements the 
`steamGuardInput` event function (which is called by the PluginSystem when the event is emitted, instead of listening directly to it).

## steamGuardQrCode <a href="/src/controller/events/steamGuardQrCode.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
This event is emitted when any bot account is trying to log in using a QR-Code. A user needs to scan this QR-Code using their Steam Mobile App to confirm the login request.

The event is emitted with the parameters
- `bot` ([Bot](../bot/bot.md)) - Bot instance of the affected account
- `challengeUrl` (string) - The QrCode Challenge URL supplied by Steam. Display this value using a QR-Code parser and let a user scan it using their Steam Mobile App.

## dataUpdate <a href="/src/controller/events/dataUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
The event is emitted whenever DataManager is instructed to import a file from the disk or export a DataManager property to it. On data export `oldData` will always be `null`.

The event is emitted with the parameters
- `key` (string) - Which DataManager key got updated
- `oldData` (any) - Old content of the updated key
- `newData` (any) - New content of the updated key
