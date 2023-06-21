# Creating plugins
[⬅️ Go back to wiki home](./)

The functionality of this bot can be extended using plugins.  
They allow you to intercept events from the bots, run commands, edit or supply data and much much more.  

This guide will explain you the basics to get started and go through the template plugin!  
I'm expecting you already have some experience programming and have worked with JavaScript, as well as NPM packages and Git.  

&nbsp;

## **Getting started**
First, fork my [plugin template repository](https://github.com/HerrEurobeat/steam-comment-bot-template-plugin).  
You can do this easily through the GitHub web interface.  

Give your fork a fitting name, but make sure to keep the `steam-comment-bot-` prefix. This is important later.  
It probably also makes sense to keep the `-plugin` at the end, to indicate that your fork is a plugin.  

Now, clone your fork, for example using the git cli:  
`git clone https://github.com/your_username/your_fork ./folder/path/to/clone/to`

Open the folder you cloned to with your code editor and open the package.json file inside.  
Change the name to the name you gave your fork. For the bot to recognize your plugin, it must have the `steam-comment-bot-` prefix I mentioned above.  
Populate description, author and version as well. The plugin will be packed into an NPM package later.  

Open the entry file `plugin.js` and edit the PluginSystem import file path at the top.  
It should point to your `steam-comment-service-bot` installation. This makes sure your code editor's IntelliSense will work.  
If your plugin folder is right beside the bot folder, the default path should already be correct.  

&nbsp;

## **The filestructure**
Each plugin consists of three important files.  
- `plugin.js` - The entry file of your plugin. This one will be loaded by the bot and contains all the functions exposed by your plugin. It must contain an exposed constructor and load function.
- `config.json` - The default configuration file of your plugin. This one will be copied into the plugin config folder by the bot the first time your plugin gets loaded. It must contain the parameter "enabled", everything else is up to you.
- `package.json` - The NPM package config file of your plugin. This one will be read by NPM to package and install your plugin. The bot will go through all installed npm packages with the `steam-comment-bot-` name prefix and attempt to load their `plugin.js` file.

You can of course add more files and folders as you like and load them from the `plugin.js` file.  

&nbsp;

## **Exposed functions and events**
Let's take a look at what the template plugin does:  
Your plugin file `plugin.js` must expose a constructor and load function, just like the template does.  

The template constructor stores references to the pluginSystem 'sys', the controller (which is the central part of the bot, "controlling" everything), the dataManager 'data' (which imports, checks and stores all config files) and the commandHandler (which loads, stores and runs all commands).  
This makes using those interesting parts from your plugin easier and is probably a good idea to keep. You **need** the 'sys' reference, otherwise your plugin won't be able to communicate with the bot, making it pretty much useless.  
Please also keep the `logger` overwrite. It makes sure that the log hold-back functionality during login is working.  

The load function is being called when the plugin is loaded. This happens right before the bot starts logging in accounts or right after the '!reload' command was used.  
It makes sense to load your plugin config file from your plugin config folder, just like the template does.  
We are also registering a super cool command here with the names '!hello' and '!cool-alias'. If someone executes it, it will respond with 'Hello World!'. Registering commands and responding to the user is further explained below.  

The template plugin also exposes a 'ready', 'statusUpdate', 'steamGuardInput' function.  
These are functions that will be called by the plugin system when the bot emits those events.  

The ready event function is called when the bot has finished logging in all accounts. Should the plugin load be caused by '!reload', this function is executed milliseconds after `load()` has been called.  
The statusUpdate event function is called when any bot account changes their status. Every status a bot can have is documented in the [EStatus enum](../../src/bot/EStatus.js).  
The steamGuardInput event function is called when any bot account is currently being logged in, but a Steam Guard Code is requested. The bot has a built in handler that will request code input from the terminal on this event.  

&nbsp;

## **Logging messages**
I'm using my own [logging library](https://github.com/HerrEurobeat/output-logger) to log everything to the terminal and the `output.txt` file. It is easy to use, do not be afraid of this wall of text ^^  
Please do not use any `console.log` calls in your plugins (unless maybe for debugging).  

Here is the parameter structure, first to last:  
- One of these types: 'debug', 'info', 'warn', 'error'. Debug mesages are only logged if `printDebug` is set to true in `advancedconfig.json`
- The message you want to log. If not of datatype string, the library will attempt to colorize the data, just like console.log does.
- Optional - nodate: true if the message should not have a date
- Optional - remove: true if the next message should overwrite this one
- Optional - animation: An array containing strings. If this is specified, it will display each element of this array after another in the front of the message as an animation. The logger library has some default animations, check them out using your IntelliSense at: `logger.animations` or [here](https://github.com/HerrEurobeat/output-logger/blob/master/lib/data/animations.json)
- Optional - printNow: true to force print this message now. This will skip the log hold back system explained below
- Optional - cutToWidth: true to force cut this message to the current width of the terminal

Check out the JsDoc of the logger function directly: [controller logger.js](../../src/controller/helpers/logger.js)

You can also use this library to read input from the user, display a progress bar, managing animations and much more. Please check out the [output-logger README](https://github.com/HerrEurobeat/output-logger) for more information.  

Do not be confused if your log messages are not showing up instantly while the bot is still logging in.  
The bot has a logger hold-back functionality which holds back every log message that is not of type 'debug' or 'error' or has `printNow` set to true during login. These messages will be logged as soon as the bot is started, aka the ready event has fired.

&nbsp;

## **Plugin System Interface**
To be added

&nbsp;

## **Command System**
To be added

&nbsp;

## **Packing and installing your plugin using npm**
To be added

&nbsp;

## **Additional information**
**Debug Mode:**  
It may make sense to enable `printDebug` in the `advancedconfig.json` while you are working on your plugin.  
This will log way more stuff while the bot is running to maybe help you debug your plugin.  
Feel free to include 'debug' log calls in your plugin as well!  

&nbsp;

**NPM setup for development:**  
To be added

&nbsp;

**Issues and Pull Requests:**  
You found a bug or you think something should be changed in the bot itself?  
Feel free to [open an issue](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose) or fork the bot, make changes and [open a pull request](https://github.com/HerrEurobeat/steam-comment-service-bot/compare) yourself! Every contribution is welcome!  