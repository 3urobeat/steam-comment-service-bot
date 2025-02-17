# DataManager
[⬅️ Go back to dev home](../#readme) <a href="/src/dataManager/dataManager.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

The DataManager system imports, checks, handles errors and provides a file updating service for all config & source code files.  
It is the central point for holding and managing any data which the application stores on the filesystem.  

Use the data and functions exposed by this module whenever you need to e.g. read and write to a config file. 

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

### logininfo
Array of objects storing the login information of every bot account.  
The index property must match to the index of the corresponding bot account.  
Should you want to modify the account order during runtime, you must also make the same change in this array.

### lang
Object storing all supported languages and their strings used for responding to a user.

It loads the files of `src/data/lang/` and overwrites all keys with the corresponding values from `customlang.json` (does not overwrite the file on the disk).  
You can see the default lang content by clicking [here](/src/data/lang/english.json) and your customlang file by clicking [here](/customlang.json).

Use the function `getLang()` to access the languages stored in this object.

### cachefile
Object storing IDs from config files converted at runtime and backups for all config & data files.  

If you need the steamID64 of any owner or bot account or the groupID64 of the botsgroup or configgroup, read them from here.  
The bot accepts various inputs in the config for setting owner IDs and converts them to steamID64s at startup.  
These are stored in this object and should always be used instead of reading from the config directly.

At every startup (when the Controller ready event fires) the bot writes a backup of all config and data files to this object as well.  
This content is written to `src/data/cache.json` in order to restore previous config settings should the user make a syntax mistake or the updater break.  

You can see its content by clicking [here](/src/data/cache.json), however it is empty if you have never started the bot before.
