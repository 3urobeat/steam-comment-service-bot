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
