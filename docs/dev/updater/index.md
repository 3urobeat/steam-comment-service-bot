# Updater
[⬅️ Go back to dev home](../#readme) <a href="/src/updater/updater.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [Helpers](#helpers)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
The Updater is able to fully update the application on a user's machine, without any manual interaction.  
It does so by periodically checking the GitHub repository for a new version, pulling the codebase as a zip, creating a backup, replacing the files and restarting the bot.  

To recover from a failed update, the bot creates a backup of the current codebase before updating.  
This backup will then be recovered, the bot will restart and skip any updates for some time.  

Updater's `run()` function calls [helper functions](#helpers) in the correct order which do the actual downloading, installing and backup handling.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

<a id="helpers"></a>

# Helpers
The Updater's collection of helper functions handle the downloading and installing of updates, as well as saving and recovering backups.  
The `run()` function located in the module's main file, `updater.js`, calls these functions in the correct order to install an update.  
The helper files & functions are listed on this page in the same order.

## Table of Contents
- [checkForUpdate.js](#helpers-checkforupdate)
- [prepareUpdate.js](#helpers-prepareupdate)
- [createBackup.js](#helpers-createbackup)
- [downloadUpdate.js](#helpers-downloadupdate)
- [customUpdateRules.js](#helpers-customupdaterules)
- [restoreBackup.js](#helpers-restorebackup)

&nbsp;

<a id="helpers-checkforupdate"></a>

## checkForUpdate.js <a href="/src/updater/helpers/checkForUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

<a id="helpers-prepareupdate"></a>

## prepareUpdate.js <a href="/src/updater/helpers/prepareUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

<a id="helpers-createbackup"></a>

## createBackup.js <a href="/src/updater/helpers/createBackup.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

<a id="helpers-downloadupdate"></a>

## downloadUpdate.js <a href="/src/updater/helpers/downloadUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

<a id="helpers-customupdaterules"></a>

## customUpdateRules.js <a href="/src/updater/helpers/customUpdateRules.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Some files, for example the config.json, can't just be overwritten like any of the source code files.  
Instead we need to apply custom update rules to e.g. carry over existing user settings.  

This file is loaded into memory *after* updating but is called with the existing function signature from *before* the update.  
This means we cannot change the existing parameter structure, leading to a few unused legacy parameters.  
This is a minor quirk that must be kept in mind.  

This file is not called by `updater.js` but by `downloadUpdate.js`.

&nbsp;

<a id="helpers-restorebackup"></a>

## restoreBackup.js <a href="/src/updater/helpers/restoreBackup.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="Updater"></a>

## Updater
**Kind**: global class  

* [Updater](#Updater)
    * [new Updater(controller)](#new_Updater_new)
    * [.run(forceUpdate, respondModule, resInfo)](#Updater+run) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [~stopOnFatalError()](#Updater+run..stopOnFatalError)
    * [._registerUpdateChecker()](#Updater+_registerUpdateChecker)

<a name="new_Updater_new"></a>

### new Updater(controller)
Constructor - Initializes the updater which periodically checks for new versions available on GitHub, downloads them and handles backups.


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the controller object |

<a name="Updater+run"></a>

### updater.run(forceUpdate, respondModule, resInfo) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks for any available update and installs it.

**Kind**: instance method of [<code>Updater</code>](#Updater)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Promise that will be resolved with false when no update was found or with true when the update check or download was completed. Expect a restart when true was returned.  

| Param | Type | Description |
| --- | --- | --- |
| forceUpdate | <code>boolean</code> | If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed |
| respondModule | <code>function</code> | If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters. |
| resInfo | [<code>resInfo</code>](#resInfo) | Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). |

<a name="Updater+run..stopOnFatalError"></a>

#### run~stopOnFatalError()
Shorthander to abort when a part of the updater is missing and couldn't be repaired

**Kind**: inner method of [<code>run</code>](#Updater+run)  
<a name="Updater+_registerUpdateChecker"></a>

### updater.\_registerUpdateChecker()
Registers an update check job. This is called by Controller after the data integrity and startup update check

**Kind**: instance method of [<code>Updater</code>](#Updater)  
