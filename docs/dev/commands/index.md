# CommandHandler
[⬅️ Go back to dev home](../#readme) <a href="/src/commands/commandHandler.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
The CommandHandler manages the Bot's functionality which is accessible by the user, for example through the Steam Chat.  
On startup, it loads a bunch of core commands shipped with the application and exposes functions to un-/register commands at runtime, for example using plugins.  
Lastly, the module contains a helper folder which stores various functions used by commands, like getting all available bot accounts or parsing command arguments.

By default, the bot comes with one command handler which implements this module: The Bot's [friendMessage](../bot/index.md#events-friendmessage) event.  
This adds support for running commands and receiving answers through the Steam Chat.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

### resInfo
Object representing the default/commonly used content the resInfo object can/should contain.  
The resInfo object is passed to every command and contains valuable information about the command handler which executes this command (plugins implementing other chat platforms need to implement their own command handler of course),
about the user who ran the command, which userIDs have owner rights, etc.  
The commandHandler of e.g. a plugin can add more information to this object as they please. This can be useful to pass more information to their commands, through the commandHandler.

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="CommandHandler"></a>

## CommandHandler
**Kind**: global class  

* [CommandHandler](#CommandHandler)
    * [new CommandHandler(controller)](#new_CommandHandler_new)
    * [.commands](#CommandHandler+commands) : [<code>Array.&lt;Command&gt;</code>](#Command)
    * [.registerCommand(command)](#CommandHandler+registerCommand) ⇒ <code>boolean</code>
    * [.unregisterCommand(commandName)](#CommandHandler+unregisterCommand) ⇒ <code>boolean</code>
    * [.runCommand(name, args, respondModule, context, resInfo)](#CommandHandler+runCommand) ⇒ <code>Object</code>
    * [.reloadCommands()](#CommandHandler+reloadCommands)
    * [.calculateCommandSuggestions(input)](#CommandHandler+calculateCommandSuggestions) ⇒ <code>Array.&lt;{name: string, closeness: number}&gt;</code>
    * [.calculateCommandSuggestions(input)](#CommandHandler+calculateCommandSuggestions) ⇒ <code>Array.&lt;{name: string, closeness: number}&gt;</code>

<a name="new_CommandHandler_new"></a>

### new CommandHandler(controller)
Constructor - Initializes the commandHandler which allows you to integrate core commands into your plugin or add new commands from your plugin.


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the current controller object |

<a name="CommandHandler+commands"></a>

### commandHandler.commands : [<code>Array.&lt;Command&gt;</code>](#Command)
Array of objects, where each object represents a registered command

**Kind**: instance property of [<code>CommandHandler</code>](#CommandHandler)  
<a name="CommandHandler+registerCommand"></a>

### commandHandler.registerCommand(command) ⇒ <code>boolean</code>
Registers a new command during runtime

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
**Returns**: <code>boolean</code> - true if the command was successfully registered, false otherwise  

| Param | Type | Description |
| --- | --- | --- |
| command | [<code>Command</code>](#Command) | The command object to register |

<a name="CommandHandler+unregisterCommand"></a>

### commandHandler.unregisterCommand(commandName) ⇒ <code>boolean</code>
The name of the command to unregister during runtime

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
**Returns**: <code>boolean</code> - `true` if the command was successfully unregistered, `false` otherwise  

| Param | Type | Description |
| --- | --- | --- |
| commandName | <code>string</code> | Name of the command to unregister |

<a name="CommandHandler+runCommand"></a>

### commandHandler.runCommand(name, args, respondModule, context, resInfo) ⇒ <code>Object</code>
Finds a loaded command by name and runs it

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
**Returns**: <code>Object</code> - Returns an object indicating whether the command was found and executed or not. If success is `false`, a reason and corresponding message will be provided which can be sent to the user.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the command |
| args | <code>Array</code> | Array of arguments that will be passed to the command |
| respondModule | <code>function</code> | Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters. |
| context | <code>object</code> | The context (`this.`) of the object calling this command. Will be passed to respondModule() as first parameter to make working in this function easier. |
| resInfo | [<code>resInfo</code>](#resInfo) | Object containing additional information |

<a name="CommandHandler+reloadCommands"></a>

### commandHandler.reloadCommands()
Reloads all core commands. Does NOT reload commands registered at runtime. Please consider reloading the pluginSystem as well.

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
<a name="CommandHandler+calculateCommandSuggestions"></a>

### commandHandler.calculateCommandSuggestions(input) ⇒ <code>Array.&lt;{name: string, closeness: number}&gt;</code>
Calculates command suggestions using the Jaro Winkler distance of `input` to all registered commands

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
**Returns**: <code>Array.&lt;{name: string, closeness: number}&gt;</code> - Returns a sorted Array of Objects, containing the command name and closeness in percent of name to `input` of every registered command  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | String to get the nearest registered commands of |

<a name="CommandHandler+calculateCommandSuggestions"></a>

### commandHandler.calculateCommandSuggestions(input) ⇒ <code>Array.&lt;{name: string, closeness: number}&gt;</code>
Calculates command suggestions using the Jaro Winkler distance of `input` to all registered commands

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
**Returns**: <code>Array.&lt;{name: string, closeness: number}&gt;</code> - Returns a sorted Array of Objects, containing the command name and closeness in percent of name to `input` of every registered command  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | String to get the nearest registered commands of |

