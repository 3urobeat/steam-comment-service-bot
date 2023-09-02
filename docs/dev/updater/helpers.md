# Updater Helpers
[⬅️ Go back to Updater](./updater.md) <a href="/src/updater/helpers" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Folder-darkcyan"></a>

&nbsp;

The Updater's collection of helper functions handle the downloading and installing of updates, as well as saving and recovering backups.  
The `run()` function located in the module's main file, `updater.js`, calls these functions in the correct order to install an update.  
The helper files & functions are listed on this page in the same order.

&nbsp;

## Table of Contents
- [checkForUpdate.js](#checkForUpdatejs-)
- [prepareUpdate.js](#prepareUpdatejs--)
- [createBackup.js](#createBackupjs-)
- [downloadUpdate.js](#downloadUpdatejs--)
- [customUpdateRules.js](#customUpdateRulesjs--)
- [restoreBackup.js](#restoreBackupjs--)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## checkForUpdate.js <a href="/src/updater/helpers/checkForUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

### check(datafile, branch, forceUpdate, callback): void
- `datafile` (object) - The current `data.json` file from the DataManager
- `branch` (string) - Which branch you want to check. Defaults to the current branch set in `data.json`
- `forceUpdate` (boolean) - If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed
- `callback` (function(boolean, object): void) - Called with `updateFound` (boolean) and `data` (object) on completion. `updatefound` will be false if the check should fail. `data` includes the full data.json file found online.

Checks for an available update from the GitHub repository by fetching `data.json` and comparing the value of `version`.

&nbsp;

## prepareUpdate.js <a href="/src/updater/helpers/prepareUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

### run(controller, respondModule, resInfo): Promise
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object
- `respondModule` (function(object, string): void) - Optional: If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters.
- `resInfo` (CommandHandler.[resInfo](../commandHandler/commandHandler.md#resInfo)) - Optional: Object containing additional information your respondModule might need to process the response (for example the userID who executed the command).

Waits for active requests to finish, blocks new requests and logs off all bot accounts.

Returns a Promise which is resolved when the application is ready to install the update.

&nbsp;

## createBackup.js <a href="/src/updater/helpers/createBackup.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

### run(): Promise
Makes a copy of the current bot installation before updating, to be able to restore in case the updater fails.

Returns a Promise which is resolved when the function is done.

&nbsp;

## downloadUpdate.js <a href="/src/updater/helpers/downloadUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

### startDownload(controller): Promise
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object

Downloads all files from the GitHub repository and installs them.

Returns a Promise which is resolved when the function is done. `null` on success, `err` on failure.

&nbsp;

## customUpdateRules.js <a href="/src/updater/helpers/customUpdateRules.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Some files, for example the config.json, can't just be overwritten like any of the source code files.  
Instead we need to apply custom update rules to e.g. carry over existing user settings.  

This file is loaded into memory *after* updating but is called with the existing function signature from *before* the update.  
This means we cannot change the existing parameter structure, leading to a few unused legacy parameters.  
This is a minor quirk that must be kept in mind.  

This file is not called by `updater.js` but by `downloadUpdate.js`.

### customUpdateRules(compatibilityfeaturedone, oldconfig, oldadvancedconfig, olddatafile, callback): Promise
- `compatibilityfeaturedone` (any) - Legacy parameter which is now unused
- `oldconfig` (object) - The old config from before the update
- `oldadvancedconfig` (object) - The old advancedconfig from before the update
- `olddatafile` (object) - The old datafile from before the update
- `callback` (function(): void) - Legacy parameter which is now unused

Applies custom update rules for a few files (gets called by downloadUpdate.js).  

Returns a Promise which is resolved when the function is done.

&nbsp;

## restoreBackup.js <a href="/src/updater/helpers/restoreBackup.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

### run(): Promise
Tries to restore a previously made backup.

Returns a Promise which is resolved when the function is done.