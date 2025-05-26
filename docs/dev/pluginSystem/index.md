# PluginSystem
[⬅️ Go back to dev home](../#readme) <a href="/src/pluginSystem/pluginSystem.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
The plugin system loads plugin packages installed by the user, exposes the Controller and provides functions for managing plugin data.  
Plugins must be installed npm packages with the name prefix `steam-comment-bot-` to be recognized.

You can read more about plugin requirements and their files on the [Creating Plugins wiki page](../../wiki/creating_plugins.md).

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="PluginSystem"></a>

## PluginSystem
**Kind**: global class  

* [PluginSystem](#PluginSystem)
    * [new PluginSystem(controller)](#new_PluginSystem_new)
    * [.controller](#PluginSystem+controller) : [<code>Controller</code>](#Controller)
    * [.pluginList](#PluginSystem+pluginList) : <code>Object.&lt;string, Plugin&gt;</code>
    * [.commandHandler](#PluginSystem+commandHandler) : [<code>CommandHandler</code>](#CommandHandler)
    * [.jobManager](#PluginSystem+jobManager) : [<code>JobManager</code>](#JobManager)
    * [.getPluginDataPath(pluginName)](#PluginSystem+getPluginDataPath) ⇒ <code>string</code>
    * [.loadPluginData(pluginName, filename)](#PluginSystem+loadPluginData) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.writePluginData(pluginName, filename, data)](#PluginSystem+writePluginData) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.deletePluginData(pluginName, filename)](#PluginSystem+deletePluginData) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.loadPluginConfig(pluginName)](#PluginSystem+loadPluginConfig) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.writePluginConfig(pluginName, pluginConfig)](#PluginSystem+writePluginConfig) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.reloadPlugin(pluginName)](#PluginSystem+reloadPlugin)
    * [.reloadPlugins()](#PluginSystem+reloadPlugins)
    * [.getInstalledPlugins()](#PluginSystem+getInstalledPlugins) ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code>
    * [.getActivePlugins()](#PluginSystem+getActivePlugins) ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code>
    * [.reloadPlugin(pluginName)](#PluginSystem+reloadPlugin)
    * [.reloadPlugins()](#PluginSystem+reloadPlugins)
    * [.getPluginDataPath(pluginName)](#PluginSystem+getPluginDataPath) ⇒ <code>string</code>
    * [.loadPluginData(pluginName, filename)](#PluginSystem+loadPluginData) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.writePluginData(pluginName, filename, data)](#PluginSystem+writePluginData) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.deletePluginData(pluginName, filename)](#PluginSystem+deletePluginData) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.loadPluginConfig(pluginName)](#PluginSystem+loadPluginConfig) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.writePluginConfig(pluginName, pluginConfig)](#PluginSystem+writePluginConfig) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_PluginSystem_new"></a>

### new PluginSystem(controller)
Constructor - The plugin system loads all plugins and provides functions for plugins to hook into


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the controller object |

<a name="PluginSystem+controller"></a>

### pluginSystem.controller : [<code>Controller</code>](#Controller)
Central part of the application and your interface to everything

**Kind**: instance property of [<code>PluginSystem</code>](#PluginSystem)  
<a name="PluginSystem+pluginList"></a>

### pluginSystem.pluginList : <code>Object.&lt;string, Plugin&gt;</code>
References to all plugin objects

**Kind**: instance property of [<code>PluginSystem</code>](#PluginSystem)  
<a name="PluginSystem+commandHandler"></a>

### pluginSystem.commandHandler : [<code>CommandHandler</code>](#CommandHandler)
Manages all registered commands and gives you access to them

**Kind**: instance property of [<code>PluginSystem</code>](#PluginSystem)  
<a name="PluginSystem+jobManager"></a>

### pluginSystem.jobManager : [<code>JobManager</code>](#JobManager)
Manages and runs all jobs and lets you register your own

**Kind**: instance property of [<code>PluginSystem</code>](#PluginSystem)  
<a name="PluginSystem+getPluginDataPath"></a>

### pluginSystem.getPluginDataPath(pluginName) ⇒ <code>string</code>
Gets the path holding all data of a plugin. If no folder exists yet, one will be created

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>string</code> - Path to the folder containing your plugin data  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |

<a name="PluginSystem+loadPluginData"></a>

### pluginSystem.loadPluginData(pluginName, filename) ⇒ <code>Promise.&lt;\*&gt;</code>
Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;\*&gt;</code> - Resolves with data on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| filename | <code>string</code> | Name of the file to load |

<a name="PluginSystem+writePluginData"></a>

### pluginSystem.writePluginData(pluginName, filename, data) ⇒ <code>Promise.&lt;void&gt;</code>
Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| filename | <code>string</code> | Name of the file to load |
| data | <code>string</code> | The data to write |

<a name="PluginSystem+deletePluginData"></a>

### pluginSystem.deletePluginData(pluginName, filename) ⇒ <code>Promise.&lt;void&gt;</code>
Deletes a file in your plugin data folder if it exists.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| filename | <code>string</code> | Name of the file to load |

<a name="PluginSystem+loadPluginConfig"></a>

### pluginSystem.loadPluginConfig(pluginName) ⇒ <code>Promise.&lt;object&gt;</code>
Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |

<a name="PluginSystem+writePluginConfig"></a>

### pluginSystem.writePluginConfig(pluginName, pluginConfig) ⇒ <code>Promise.&lt;void&gt;</code>
Writes your plugin config changes to the filesystem. The object data will be processed to JSON.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| pluginConfig | <code>object</code> | Config object of your plugin |

<a name="PluginSystem+reloadPlugin"></a>

### pluginSystem.reloadPlugin(pluginName)
Reloads a plugin and calls ready event after ~2.5 seconds.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of the plugin package to reload |

<a name="PluginSystem+reloadPlugins"></a>

### pluginSystem.reloadPlugins()
Reloads all plugins and calls ready event after ~2.5 seconds.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
<a name="PluginSystem+getInstalledPlugins"></a>

### pluginSystem.getInstalledPlugins() ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code>
Helper function - Get a list of all installed plugins

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Array.&lt;Array.&lt;string&gt;&gt;</code> - Array of arrays containing package name & version of all installed plugins  
<a name="PluginSystem+getActivePlugins"></a>

### pluginSystem.getActivePlugins() ⇒ <code>Array.&lt;Array.&lt;string&gt;&gt;</code>
Helper function - Get a list of all active (loaded) plugins

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Array.&lt;Array.&lt;string&gt;&gt;</code> - Array of arrays containing package name & version of all active (loaded) plugins  
<a name="PluginSystem+reloadPlugin"></a>

### pluginSystem.reloadPlugin(pluginName)
Reloads a plugin and calls ready event after ~2.5 seconds.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of the plugin package to reload |

<a name="PluginSystem+reloadPlugins"></a>

### pluginSystem.reloadPlugins()
Reloads all plugins and calls ready event after ~2.5 seconds.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
<a name="PluginSystem+getPluginDataPath"></a>

### pluginSystem.getPluginDataPath(pluginName) ⇒ <code>string</code>
Gets the path holding all data of a plugin. If no folder exists yet, one will be created

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>string</code> - Path to the folder containing your plugin data  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |

<a name="PluginSystem+loadPluginData"></a>

### pluginSystem.loadPluginData(pluginName, filename) ⇒ <code>Promise.&lt;\*&gt;</code>
Loads a file from your plugin data folder. The data will remain unprocessed. Use `loadPluginConfig()` instead if you want to load your plugin config.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;\*&gt;</code> - Resolves with data on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| filename | <code>string</code> | Name of the file to load |

<a name="PluginSystem+writePluginData"></a>

### pluginSystem.writePluginData(pluginName, filename, data) ⇒ <code>Promise.&lt;void&gt;</code>
Writes a file to your plugin data folder. The data will remain unprocessed. Use `writePluginConfig()` instead if you want to write your plugin config.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| filename | <code>string</code> | Name of the file to load |
| data | <code>string</code> | The data to write |

<a name="PluginSystem+deletePluginData"></a>

### pluginSystem.deletePluginData(pluginName, filename) ⇒ <code>Promise.&lt;void&gt;</code>
Deletes a file in your plugin data folder if it exists.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| filename | <code>string</code> | Name of the file to load |

<a name="PluginSystem+loadPluginConfig"></a>

### pluginSystem.loadPluginConfig(pluginName) ⇒ <code>Promise.&lt;object&gt;</code>
Loads your plugin config from the filesystem or creates a new one based on the default config provided by your plugin. The JSON data will be processed to an object.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Resolves with your plugin config processed from JSON to an object. If the config failed to load, the promise will be rejected with an error.  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |

<a name="PluginSystem+writePluginConfig"></a>

### pluginSystem.writePluginConfig(pluginName, pluginConfig) ⇒ <code>Promise.&lt;void&gt;</code>
Writes your plugin config changes to the filesystem. The object data will be processed to JSON.

**Kind**: instance method of [<code>PluginSystem</code>](#PluginSystem)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolves on success, rejects otherwise with an error  

| Param | Type | Description |
| --- | --- | --- |
| pluginName | <code>string</code> | Name of your plugin |
| pluginConfig | <code>object</code> | Config object of your plugin |

