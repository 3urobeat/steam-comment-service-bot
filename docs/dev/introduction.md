# Introduction
[⬅️ Go back to dev home](./#readme)

&nbsp;

Hey, welcome to the `steam-comment-service-bot` project!  
As the name suggests, this started as a small and simple bot cluster solely for commenting on profiles.  
As of now it however is \*way\* more than that and a name along the lines of `steam-bot-network-manager` would be better suited.  

This project now predominantly focuses on managing user data, handling issues and keeping Steam accounts logged in.  
Various core commands like commenting, voting & favorizing then provide the user the functionality to command all accounts at once.

&nbsp;

## Structure
This application consists of a few main parts, seperated into "modules". All of these run in a child process (more about that in a minute):
- **Controller** - Entry point of the child process, initializes everything and holds references to everything. This is the core part of the entire application.
- **Updater** - Handles updating an existing installation on a user's machine automatically when a new version was found on GitHub. It also creates a backup and is able to recover from it, should the installation fail.
- **Bot** - Controls the connection for one Steam account and handles events (e.g. chat messages, connection loss, ...). The Controller creates a Bot object for every account the user provided.
- **DataManager** - Handles reading and writing all config and data files from and to the disk, handles errors & and restores files either from a backup or from GitHub, displays setting recommendations and more.
- **PluginSystem** - Loads plugins installed by the user, calls their event handlers, manages their data and exposes the Controller to them.

The `src` directory also contains a folder for library patches I've made, the commands folder holding the actual features like commenting, voting, etc. visible to the user, a session manager for logging in a bot account into Steam and the data folder, storing internal data (e.g the installed version, cooldowns, ...) and config backups.

&nbsp;

## Start and Restart process
As mentioned above, the bot runs inside a child process, controlled by a parent process, which is the one you are actually starting when running the command `node start`.  
This two process architecture allows me to completely restart the bot itself without any user interaction at all and without leaving any old data in the memory behind. This was quite revolutionary for me to figure out back when I built the updater :'D  

The startup procedure looks like follows:  
`node start` **->** start.js (cannot be reloaded) **->** src/starter.js (can only be hot-reloaded) **->** src/controller.js (child process, can be fully reloaded)  
The Controller now inits the DataManager, then performs a few checks (e.g. internet connection), then inits the Updater and then starts spawning Bot objects to log in all accounts (if no update was found).

The starter process dev documentation page can be found [here](./starter.md).