# Updater
[⬅️ Go back to dev home](../#readme) <a href="/src/updater/updater.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The Updater is able to fully update the application on a user's machine, without any manual interaction.  
It does so by periodically checking the GitHub repository for a new version, pulling the codebase as a zip, creating a backup, replacing the files and restarting the bot.  

To recover from a failed update, the bot creates a backup of the current codebase before updating.  
This backup will then be recovered, the bot will restart and skip any updates for some time.  

Updater's `run()` function calls [helper functions](./helpers.md) in the correct order which do the actual downloading, installing and backup handling.

&nbsp;

## Table Of Contents
- [Helpers](./helpers.md)
- [Data](#data)
- [Functions](#functions)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## Data
The Updater only holds two references for easier usage internally:

### controller
Reference to the active [Controller](../controller/controller.md) object.

### data
Reference to the active [DataManager](../dataManager/dataManager.md) object.

&nbsp;

## Functions

## (): 
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object

Constructor - Initializes the updater which periodically checks for new versions available on GitHub, downloads them and handles backups.

&nbsp;

### run(forceUpdate, respondModule?, resInfo?): Promise
- `forceUpdate` (boolean) - If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
- `respondModule` (function(object, string): void) - Optional: If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters.
- `resInfo` (CommandHandler.[resInfo](../commandHandler/commandHandler.md#resInfo)) - Optional: Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).

Checks for any available update and installs it by calling helper functions in the correct order.  
This function is called by the update check interval every 6 hours.

Returns a Promise that will be resolved with `false` when no update was found or with `true` when the update check or download was completed.  
Expect a restart when `true` was returned.