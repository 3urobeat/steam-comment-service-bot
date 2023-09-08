# PluginSystem
[⬅️ Go back to dev home](../#readme) <a href="/src/pluginSystem/pluginSystem.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The plugin system loads plugin packages installed by the user, exposes the Controller and provides functions for managing plugin data.  
Plugins must be installed npm packages with the name prefix `steam-comment-bot-` to be recognized.

You can read more about plugin requirements and their files on the [Creating Plugins wiki page](../../wiki/creating_plugins.md).

&nbsp;

## Table Of Contents
- [Data](#data)
- [Type Definitions](#typedefs)
- [Functions](#functions)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## Data
The PluginSystem object holds the following data:

### controller
Reference to the active controller object

### pluginList
Object holding references to all plugin objects created by [_loadPlugins()](#_loadPlugins()).  

Key is the plugin's name as a string, value is [Plugin](#plugin).

&nbsp;

## Typedefs
To improve IntelliSense support and provide detailed parameter documentation, the PluginSystem contains a type definition:

### Plugin
Functions which are supported and will be executed by the PluginSystem, if defined in the plugin:
- `load` (function(): void) - Called on Plugin load
- `unload` (function(): void) - Called on Plugin unload
- `ready` (function(): void) - Controller ready event
- `statusUpdate` (function([Bot](../bot/bot.md), Bot.[EStatus](/src/bot/EStatus.js), Bot.[EStatus](/src/bot/EStatus.js)): void) - Controller statusUpdate event
- `steamGuardInput` (function(Bot, function(string): void): void) - Controller steamGuardInput event

&nbsp;

## Functions

### (controller): void
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object

Constructor - Creates a new PluginSystem object. Is called by Controller on startup.

&nbsp;

### reloadPlugins(): void
Reloads all plugins and calls ready event after ~2.5 seconds.

### _loadPlugins(): void
Internal:  
Loads all plugin npm packages and populates pluginList

### _checkPlugin(folderName, thisPlugin, thisPluginConf): Promise
- `folderName` (string) - Name of the plugin folder. This is used to reference the plugin when thisPluginConf is undefined
- `thisPlugin` (object) - Plugin file object returned by require()
- `thisPluginConf` (object) - package.json object of this plugin

Internal:  
Checks a plugin, displays relevant warnings and decides whether the plugin is allowed to be loaded

Returns a Promise which resolves with `true` (can be loaded) or `false` (must not be loaded) on completion.

### getPluginDataPath(pluginName): string
- `pluginName` (string) - Name of your plugin

Gets the path holding all data of a plugin. If no folder exists yet, one will be created.

Returns the path to the folder containing your plugin data as a string.

### loadPluginData(pluginName, filename): Promise
- `pluginName` (string) - Name of your plugin
- `filename` (string) - Name of the file to load

Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.

Returns a Promise which resolves with data on success, rejects otherwise with an error.

### writePluginData(pluginName, filename, data): Promise
- `pluginName` (string) - Name of your plugin
- `filename` (string) - Name of the file to load
- `data` (string) - The data to write

Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.

Returns a Promise which resolves on success, rejects otherwise with an error

### deletePluginData(pluginName, filename): Promise
- `pluginName` (string) - Name of your plugin
- `filename` (string) - Name of the file to load

Deletes a file in your plugin data folder if it exists.

Returns a Promise which resolves on success, rejects otherwise with an error

### loadPluginConfig(pluginName): Promise
- `pluginName` (string) - Name of your plugin

Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.

Returns a Promise which resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.

### writePluginConfig = function (pluginName, pluginConfig): Promise
- `pluginName` (string) - Name of your plugin
- `pluginConfig` (object) - Config object of your plugin

Writes your plugin config changes to the filesystem. The object data will be processed to JSON.

Returns a Promise which resolves on success, rejects otherwise with an error.

### aggregatePluginConfig(pluginName): Record
- `pluginName` (string) - Name of your plugin

Integrates changes made to the config to the users config.

Returns a Record containing the plugin's config.