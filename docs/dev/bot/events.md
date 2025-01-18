Each bot object handles their own [SteamUser](https://github.com/DoctorMcKay/node-steam-user) events.  
These event handlers are located inside the bot events folder and contain each a prototype function for attaching themselves.  
These functions follow the naming scheme `_attachSteamEventNameEvent` and are being called by the Bot constructor.  


### Table of Contents
- [debug](#events-debug)
- [disconnected](#events-disconnected)
- [error](#events-error)
- [friendMessage](#events-friendmessage)
- [loggedOn](#events-loggedon)
- [relationship](#events-relationship)
- [webSession](#events-websession)

&nbsp;

<a id="events-debug"></a>

## debug & debug-verbose <a href="/src/bot/events/debug.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
The content of these events is logged to the terminal when `steamUserDebug` and `steamUserDebugVerbose` are set to `true` in the `advancedconfig.json`.

<a id="events-disconnected"></a>

## disconnected <a href="/src/bot/events/disconnected.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles a disconnect by logging to the terminal, updating its status and trying to relog itself, unless it is an intentional log off.

<a id="events-error"></a>

## error <a href="/src/bot/events/error.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles login errors by logging to the terminal, updating its status and either retrying the login or skipping the account.

<a id="events-friendmessage"></a>

## friendMessage <a href="/src/bot/events/friendMessage.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles Steam Chat messages to this account.  
If this is the main account it will instruct the [CommandHandler](../commandHandler/commandHandler.md) to run the command or apply a cooldown if the user is spamming.  
If this is a child account, it will respond with a message pointing to the main account.

<a id="events-loggedon"></a>

## loggedOn <a href="/src/bot/events/loggedOn.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Logs a message, sets the online status and increments the progress bar (on initial login) when this bot account establishes a connection to Steam.

<a id="events-relationship"></a>

## relationship <a href="/src/bot/events/relationship.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles an incoming friend request or group invite by adding the user to the `lastcomment.db` database and inviting them to the group set in `config.json`.

<a id="events-websession"></a>

## webSession <a href="/src/bot/events/webSession.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Handles setting cookies, accepting friend requests & group invites while the bot was offline, updates the bot's status, performs a few checks and starts playing games.  
This event is fired after loggedOn when this bot account establishes a connection to Steam.  

After this event was handled, a bot account is considered to be online and ready to be used.
