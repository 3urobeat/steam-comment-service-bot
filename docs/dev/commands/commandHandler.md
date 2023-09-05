# CommandHandler
[⬅️ Go back to dev home](../#readme) <a href="/src/commands/commandHandler.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The CommandHandler manages the Bot's functionality which is accessible by the user, for example through the Steam Chat.  
On startup, it loads a bunch of core commands shipped with the application and exposes functions to un-/register commands at runtime, for example using plugins.  
Lastly, the module contains a helper folder which stores various functions used by commands, like getting all available bot accounts or parsing command arguments.

By default, the bot comes with one command handler which implements this module: The Bot's [friendMessage](../bot/events.md#friendmessage-) event.  
This adds support for running commands and receiving answers through the Steam Chat.

&nbsp;

## Table Of Contents
- [Helpers](./helpers.md)
- [Data](#data)
- [Type Definitions](#typedefs)
- [Functions](#functions)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## Data

### controller
Reference to the active [Controller](../controller/controller.md) object.

### data
Reference to the active [DataManager](../dataManager/dataManager.md) object.

### commands
Array of [Command](#command)s which are currently registered.

&nbsp;

## Typedefs
To improve IntelliSense support and provide detailed parameter documentation, the CommandHandler contains three type definitions:

### Command
Object representing a Command which is stored in the [commands](#commands) array.  
It contains the following properties:
- `names` (string[]) - Collection of names/aliases which trigger this command
- `description` (string) - Description of what this command does
- `args` ([CommandArg](#CommandArg)[]) Array of objects containing information about each parameter supported by this command
- `ownersOnly` (boolean) - Set to true to only allow owners to use this command
- `run` (function(CommandHandler, Array, string, function(object, object, string): void, object, object): void) - Function that will be executed to run the command. Arguments: commandHandler, args, steamID64, respondModule, context, resInfo

### CommandArg
Object representing one argument (of many) supported by a [Command](#command) stored in the [commands](#commands) array.  
It contains the following properties:
- `name` (string) - Name of this argument. Use common phrases like "ID" or "amount" if possible. If a specific word is expected, put the word inside quotation marks.
- `description` (string) - Description of this argument
- `type` (string) - Expected datatype of this argument. If read from a chat it will usually be "string"
- `isOptional` (boolean) - True if this argument is optional, false if it must be provided. Make sure to check for missing arguments and return an error if false.
- `ownersOnly` (boolean) - True if this argument is only allowed to be provided by owners set in the config. If the command itself is `ownersOnly`, set this property to `true` as well.

### resInfo
Object representing the default/commonly used content the resInfo object can/should contain.  
The resInfo object is passed to every command and contains valuable information about the command handler which executes this command (plugins implementing other chat platforms need to implement their own command handler of course),
about the user who ran the command, which userIDs have owner rights, etc.  
The commandHandler of e.g. a plugin can add more information to this object as they please. This can be useful to pass more information to their commands, through the commandHandler.

It contains the following properties:
- `cmdprefix` (string) Optional: Prefix your command execution handler uses. This will be used in response messages referencing commands. Default: !
- `userID` (string) - ID of the user who executed this command. Will be used for command default behavior (e.g. commenting on the requester's profile), to check for owner privileges, apply cooldowns and maybe your respondModule implementation for responding. Strongly advised to include.
- `ownerIDs` (string[]) - Optional: Can be provided to overwrite `config.ownerid` for owner privilege checks. Useful if you are implementing a different platform and so `userID` won't be a steamID64 (e.g. discord)
- `charLimit` (number) - Optional: Supported by the Steam Chat Message handler: Overwrites the default index from which response messages will be cut up into parts
- `cutChars` (string[]) - Optional: Custom chars to search after for cutting string in parts to overwrite cutStringsIntelligently's default: [" ", "\n", "\r"]
- `fromSteamChat` (boolean) - Optional: Set to true if your command handler is receiving messages from the Steam Chat and `userID` is therefore a `steamID64`. Will be used to enable command default behavior (e.g. commenting on the requester's profile)
- `prefix` (string) - Optional: Do not provide this argument, you'll receive it from commands: Steam Chat Message prefixes like /me. Can be ignored or translated to similar prefixes your platform might support

&nbsp;

## Functions
All private functions, except the constructor, are prefixed with an _ underscore. They should not be called from external modules (e.g. plugins).

### (controller): void
- `controller` ([Controller](../controller/controller.md)) - Reference to the active controller object

Constructor - Creates a new CommandHandler object. Is called by Controller on startup.

&nbsp;

### _importCoreCommands(): Promise
Internal:  
Imports core commands on startup.

Returns a Promise which resolves when all core commands have been imported.

### registerCommand(command): boolean
- `command` ([Command](#command)) - The command object to register

Registers a new command during runtime. This is used by plugins to register commands which they are adding.

Returns `true` if the command was successfully registered, `false` otherwise.

### unregisterCommand(commandName): boolean
- `commandName` (string) - Name of the command to unregister

Unregisters a command at runtime which has one alias that matches the parameter.  

Returns `true` if the command was successfully unregistered, `false` otherwise.

### runCommand(name, args, respondModule, context, resInfo): boolean
- `name` (string) - The name of the command.
- `args` (array) - Array of arguments that will be passed to the command.
- `respondModule` (function(object, object, string): void) - Function that will be called to respond to the user's request. Passes context, resInfo and txt as parameters.
- `context` (object) - The context (`this.`) of the object calling this command. Will be passed to respondModule() as first parameter to make working in this function easier.
- `resInfo` ([resInfo](#resInfo)) - Object containing additional information.

Finds a loaded command by name and runs it.

Returns `true` if the command was found, `false` otherwise.

### reloadCommands(): void
Reloads all core commands. Does NOT reload commands registered at runtime. Please consider reloading the pluginSystem as well.
