# Updater Helpers
[⬅️ Go back to Updater](./updater.md) <a href="/src/updater/helpers" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Folder-darkcyan"></a>

&nbsp;

The Updater's collection of helper functions handle the downloading and installing of updates, as well as saving and recovering backups.  
The `run()` function located in the module's main file, `updater.js`, calls these functions in the correct order to install an update.  
The helper files & functions are listed on this page in the same order.

&nbsp;

## Table of Contents
- [checkForUpdate.js](#checkForUpdatejs-)
- [prepareUpdate.js](#prepareupdatejs-)
- [createBackup.js](#createBackupjs-)
- [downloadUpdate.js](#downloadupdatejs-)
- [customUpdateRules.js](#customupdaterulesjs-)
- [restoreBackup.js](#restorebackupjs-)

&nbsp;

## checkForUpdate.js <a href="/src/updater/helpers/checkForUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## prepareUpdate.js <a href="/src/updater/helpers/prepareUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## createBackup.js <a href="/src/updater/helpers/createBackup.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## downloadUpdate.js <a href="/src/updater/helpers/downloadUpdate.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## customUpdateRules.js <a href="/src/updater/helpers/customUpdateRules.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Some files, for example the config.json, can't just be overwritten like any of the source code files.  
Instead we need to apply custom update rules to e.g. carry over existing user settings.  

This file is loaded into memory *after* updating but is called with the existing function signature from *before* the update.  
This means we cannot change the existing parameter structure, leading to a few unused legacy parameters.  
This is a minor quirk that must be kept in mind.  

This file is not called by `updater.js` but by `downloadUpdate.js`.

&nbsp;

## restoreBackup.js <a href="/src/updater/helpers/restoreBackup.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
