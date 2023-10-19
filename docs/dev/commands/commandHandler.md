# CommandHandler
[⬅️ Go back to dev home](../#readme) <a href="/src/commands/commandHandler.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The CommandHandler manages the Bot's functionality which is accessible by the user, for example through the Steam Chat.  
On startup, it loads a bunch of core commands shipped with the application and exposes functions to un-/register commands at runtime, for example using plugins.  
Lastly, the module contains a helper folder which stores various functions used by commands, like getting all available bot accounts or parsing command arguments.

By default, the bot comes with one command handler which implements this module: The Bot's [friendMessage](../bot/events.md#friendmessage-) event.  
This adds support for running commands and receiving answers through the Steam Chat.

&nbsp;

Every function and object property is documented with JsDocs in the implementation file.  
Please check them out using your IntelliSense or by clicking the button in the top right corner of this page.

&nbsp;


### resInfo
Object representing the default/commonly used content the resInfo object can/should contain.  
The resInfo object is passed to every command and contains valuable information about the command handler which executes this command (plugins implementing other chat platforms need to implement their own command handler of course),
about the user who ran the command, which userIDs have owner rights, etc.  
The commandHandler of e.g. a plugin can add more information to this object as they please. This can be useful to pass more information to their commands, through the commandHandler.

