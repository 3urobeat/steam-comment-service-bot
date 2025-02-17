<a name="CommandHandler"></a>

## CommandHandler
**Kind**: global class  

* [CommandHandler](#CommandHandler)
    * [new CommandHandler(controller)](#new_CommandHandler_new)
    * [.commands](#CommandHandler+commands) : [<code>Array.&lt;Command&gt;</code>](#Command)
    * [._importCoreCommands()](#CommandHandler+_importCoreCommands) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.registerCommand(command)](#CommandHandler+registerCommand) ⇒ <code>boolean</code>
    * [.unregisterCommand(commandName)](#CommandHandler+unregisterCommand) ⇒ <code>boolean</code>
    * [.runCommand(name, args, respondModule, context, resInfo)](#CommandHandler+runCommand) ⇒ <code>Object</code>
    * [.reloadCommands()](#CommandHandler+reloadCommands)
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
<a name="CommandHandler+_importCoreCommands"></a>

### commandHandler.\_importCoreCommands() ⇒ <code>Promise.&lt;void&gt;</code>
Internal: Imports core commands on startup

**Kind**: instance method of [<code>CommandHandler</code>](#CommandHandler)  
**Returns**: <code>Promise.&lt;void&gt;</code> - Resolved when all commands have been imported  
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

