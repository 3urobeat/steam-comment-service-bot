# Creating plugins
[⬅️ Go back to wiki home](./#readme)

&nbsp;

The functionality of this bot can be extended using plugins.  
They allow you to intercept events from the bots, run commands, edit or supply data and much much more.

This guide will explain you the basics to get started and go through the template plugin!  
I'm expecting you already have some experience programming and have worked with JavaScript, as well as NPM packages and Git.

You do not need to read this quite long article. Feel free to [set up](#getting-started) and just start playing around with parts of the bot using your code editor's IntelliSense.  
You should definitely take a look at the developer documentation though, it explains everything every module does and the functions exposed by it.

&nbsp;

## Table Of Contents
- [Getting started](#getting-started)
- [The filestructure](#filestructure)
- [Exposed functions and events](#functions)
- [Logging messages](#logging)
- [Plugin System Interface](#pluginsystem)
- [Controller](#controller)
- [Command System](#commandhandler)
- [Job Manager](#jobmanager)
- [Typescript](#typescript)
- [Packing and installing your plugin using npm](#npm)
- [Additional information](#additional-info)

&nbsp;

<a id="getting-started"></a>

## **Getting started**

First, fork my [plugin template repository](https://github.com/3urobeat/steam-comment-bot-template-plugin).  
You can do this easily through the GitHub web interface.

Give your fork a fitting name, but make sure to keep the `steam-comment-bot-` prefix. This is important later.  
It probably also makes sense to keep the `-plugin` at the end, to indicate that your fork is a plugin.

Now, clone your fork, for example using the git cli:  
`git clone https://github.com/your_username/your_fork ./folder/path/to/clone/to`

Open the folder you cloned to with your code editor and open the package.json file inside.  
Change the name to the name you gave your fork. For the bot to recognize your plugin, it must have the `steam-comment-bot-` prefix I mentioned above.  
Populate description, author, version and botVersion as well. The plugin will be packed into an NPM package later.

Open the entry file `plugin.js` and edit the PluginSystem import file path at the top.  
It should point to your `steam-comment-service-bot` installation. This makes sure your code editor's IntelliSense will work.  
If your plugin folder is right beside the bot folder, the default path should already be correct.  

**Important:**  
When packing your plugin using npm you **need to comment this path out**. This path can only be left in while developing and debugging the plugin using `npm link` (explained at [Additional information](#additional-info)) as the relative path will change.

&nbsp;

<a id="filestructure"></a>

## **The filestructure**

Each plugin consists of three important files.

- `plugin.js` - The entry file of your plugin. This one will be loaded by the bot and contains all the functions exposed by your plugin. It must contain an exposed constructor and load function.
- `config.json` - The default configuration file of your plugin. This one will be copied into the plugin config folder by the bot the first time your plugin gets loaded. It must contain the parameter "enabled", everything else is up to you.
- `package.json` - The NPM package config file of your plugin. This one will be read by NPM to package and install your plugin. The bot will go through all installed npm packages with the `steam-comment-bot-` name prefix and attempt to load their `plugin.js` file.

You can of course add more files and folders as you like and load them from the `plugin.js` file.

&nbsp;

<a id="functions"></a>

## **Exposed functions and events**

Let's take a look at what the template plugin does:  
Your plugin file `plugin.js` must expose a constructor and load function, just like the template does.

**Constructor:**  
The template constructor stores references to the pluginSystem 'sys', the controller (which is the central part of the bot, "controlling" everything), the dataManager 'data' (which imports, checks and stores all config files) and the commandHandler (which loads, stores and runs all commands).  
This makes using those interesting parts from your plugin easier and is probably a good idea to keep. You **need** the 'sys' reference, otherwise your plugin won't be able to communicate with the bot, making it pretty much useless.  
Please also keep the `logger` overwrite. It makes sure that the log hold-back functionality during login is working.

**Load function:**  
The load function is being called when the plugin is loaded. This happens right before the bot starts logging in accounts or right after the '!reload' command was used.  
It makes sense to load your plugin config file from your plugin config folder, just like the template does.  
We are also registering a super cool command here with the names '!hello' and '!cool-alias'. If someone executes it, it will respond with 'Hello World!'. Registering commands and responding to the user is further explained below.

**Event functions:**  
The template plugin also exposes a 'ready', 'statusUpdate', 'steamGuardInput', 'steamGuardQrCode' function.  
These are functions that will be called by the plugin system when the bot emits those events.

The 'ready' event function is called when the bot has finished logging in all accounts. Should the plugin load be caused by '!reload', this function is executed milliseconds after `load()` has been called.  

The 'statusUpdate' event function is called when any bot account changes their status. Every status a bot can have is documented in the [EStatus enum](../../src/bot/EStatus.js).  

The 'steamGuardInput' event function is called when any bot account is currently being logged in and a Steam Guard Code was requested by Steam.  
The bot has a built in handler that will request code input from the terminal on this event. Plugins can use the `code()` callback function in `steamGuardInput(bot, code)` to supply a code themselves, resolving the request as well.  
If a session was started by logging in using a QrCode instead of a password, the event 'steamGuardQrCode' will be fired instead. Plugins can display the QrCode supplied in this event, for example using the [qrcode library](https://www.npmjs.com/package/qrcode), which will resolve the request once it has been scanned using a Steam Mobile App.

To check from your plugin if the Steam Guard Code/QrCode request has been resolved, wait for the statusUpdate event to announce a change.

&nbsp;

<a id="logging"></a>

## **Logging messages**

I'm using my own [logging library](https://github.com/3urobeat/output-logger) to log everything to the terminal and the `output.txt` file. It is easy to use, do not be afraid of this wall of text ^^  
Please do not use any `console.log` calls in your plugins (unless maybe for debugging).

Here is the parameter structure, first to last:

- One of these types: 'debug', 'info', 'warn', 'error'. Debug mesages are only logged if `printDebug` is set to true in `advancedconfig.json`
- The message you want to log. If not of datatype string, the library will attempt to colorize the data, just like console.log does.
- Optional - nodate: true if the message should not have a date
- Optional - remove: true if the next message should overwrite this one
- Optional - animation: An array containing strings. If this is specified, it will display each element of this array after another in the front of the message as an animation. The logger library has some default animations, check them out using your IntelliSense at: `logger.animations` or [here](https://github.com/3urobeat/output-logger/blob/master/lib/data/animations.json)
- Optional - printNow: true to force print this message now. This will skip the log hold back system explained below
- Optional - cutToWidth: true to force cut this message to the current width of the terminal

Check out the JsDoc of the logger function directly: [controller logger.js](../../src/controller/helpers/logger.js)

You can also use this library to read input from the user, display a progress bar, managing animations and much more. Please check out the [output-logger README](https://github.com/3urobeat/output-logger) for more information.

Do not be confused if your log messages are not showing up instantly while the bot is still logging in.  
The bot has a logger hold-back functionality which holds back every log message that is not of type 'debug' or 'error' or has `printNow` set to true during login. These messages will be logged as soon as the bot is started, aka the ready event has fired.

&nbsp;

<a id="pluginsystem"></a>

## **Plugin System Interface**

As mentioned above, your constructor gets a reference to the Plugin System as the first parameter.  
The Plugin System is responsible for loading, checking and calling plugin functions, as well as providing you functions to write to and read from your plugin data folder.  
It also stores references to the controller, giving you access to every part of the bot.

The Plugin System is probably the most important part for you when developing a plugin.  
Check it out using your IntelliSense and take a look at the [developer documentation](../dev/pluginSystem/pluginSystem.md).

&nbsp;

<a id="controller"></a>

## **Controller**

The Controller is the most important part of the application itself.  
It is responsible for loading all modules on start, storing references to them, logging in all bot accounts and handling any issues.

You can access it from your plugin through the Plugin System: `sys.controller`  
From there, every other module of the bot is accessible. Worth noting:

- Functions to restart/stop the application, resolving steamIDs, getting bot accounts, etc.
- `sys.controller.data` - The DataManager object which contains every loaded datafile (e.g. logininfo, config, quotes, proxies, etc.)
- `sys.controller.bots` - Object which holds references to all Bot objects, mapped to their account names. Access any bot account that is in use right now from there. I recommend using the `getBots()` function instead of accessing this object directly.
- `sys.controller.commandHandler` - The CommandHandler object, read more [below](#commandhandler).

...and much more. Check it out using your code editor's IntelliSense.

&nbsp;

<a id="commandhandler"></a>

## **Command System**

The CommandHandler allows you to register new and run existing commands.  
Commands are the core functionalities that allow you to request comments, retrieve information and manage the bot.  
Any command you register will instantly be available to all message handlers (e.g. to other plugins as well).

By default the bot has built-in Steam Chat message handling.  
You can implement your own message handler as well, allowing you to integrate all registered commands into other platforms.  
Take a look at the developer documentation (TODO) for more information about how to write a custom message handler.

Running existing commands is very easy. Let's take a look at how requesting 5 comments for 3urobeat would work:  
```js
this.sys.commandHandler.runCommand(
    "comment",                                                          // Command Name
    ["5", "3urobeat"],                                                  // Arguments Array
    (x, y, msg) => { logger("info", "Comment Command said: " + msg) },  // Response Function
    this,                                                               // The current context
    { cmdprefix: "/", userID: "12345", ownerIDs: ["12345"] }            // The resInfo object
)
```

This would cause the comment command to send 5 comments to the Steam Profile "3urobeat".  
The comments are requested by the user "12345", who has owner privileges.
Every response from the command will be logged to the terminal output using the logger function.

**Note:**  
It is very important to provide a unique `userID` parameter in the `resInfo` object, which must not clash with steamID64s.  
This ID is used to uniquely identify the requesting user, for example apply cooldown for them and check for owner privileges.  
Failing to provide an ID will result in either unprotected or no access.

This is also where the `ownerIDs` array comes into play: It allows you to overwrite the `ownerid` array set in the config to enable owner privilege checking when using commands from outside the Steam Chat. Very cool, right?

&nbsp;

<a id="jobmanager"></a>

## **JobManager**:

The JobManager is a handy module for managing reoccurring intervals, also called jobs, for you.  
For example, the updater registers a job by default to handle the update check, which runs every 6 hours.  
And you can do that too!

If you've got something which needs to run every x seconds/minutes/hours, then register your function like follows:  
```js
let myJobFunction = (jobManager) => {
    logger("info", "Hello, I'm a job! There are currently " + jobManager.jobs.length + " jobs registered.");
};

this.sys.jobManager.registerJob({ 
    name: "testjob", 
    description: "Tests things",
    interval: 10000, // 10 seconds
    func: myJobFunction, 
    runOnRegistration: true 
});
```
This example registers a job which runs instantly upon registration and then every 10 seconds.  
The job function gets a reference to the jobManager, through which you can access all other parts of the bot, like you are used to.  
Check out the JsDoc of `registerJob()` using your IntelliSense to see all options - `description` & `runOnRegistration` are optional for example.

When starting the bot, you should see your job actively logging the message and appear in the response of the command `!jobs`.  

Please always use this JobManager instead of registering your own intervals for periodic actions.

&nbsp;

<a id="typescript"></a>

## **Typescript**

You can also write your plugins in TS by utilizing the project's [typing file](https://github.com/3urobeat/steam-comment-service-bot/blob/beta-testing/types/types.d.ts).

Copy it over to your plugin project and point your TS compiler to it by adding the following to your `tsconfig.json`:
```json
{
    "compilerOptions": {
        "types": ["path/to/typing-file"]
    }
}
```

The official [REST API](https://github.com/DerDeathraven/steam-comment-bot-rest-api) plugin is written in TS and can be used as an example.

&nbsp;

<a id="npm"></a>

## **Packing and installing your plugin using npm**

If you have a version that you would like to **pack locally**, follow these steps:

-   Open the `package.json` file of your plugin and give it a proper version. NPM packages use [semantic versioning](https://semver.org/). In short, this means:
    -   The version number is split into three parts: MAJOR.MINOR.PATCH
    -   Increment MAJOR if you make breaking changes, e.g. user interaction is required to update your package
    -   Increment MINOR if you add new functionality that is backwards compatible, e.g. no direct user interaction is required to update
    -   Increment PATCH if you made bugfixes or other small changes which also do not require user interaction
    -   If you do not have a full release finished yet, e.g. a beta version, start with the version number `0.1.0`. Your first full release `1.0.0` is appropiate when the core functionality has been finished and no major bugs are to be expected
-   Set `botVersion` in `package.json` to the current version of the steam-comment-service-bot. This allows users to see for which version your plugin was made and tested. A warning will be displayed on plugin load if the bot or your plugin is outdated.
-   Open a command line/terminal window in your plugin project folder and run `npm pack`. On success a new `.tgz` archive appeared in your folder.
-   Copy the package archive to your steam-comment-service-bot folder, open a new terminal there and run `npm install ./the-archive-name.tgz`

On restart (or by running the command `!reload`) you should see your plugin get loaded!  
The bot will automatically create a new data folder for your plugin in the `plugins` folder. It will already contain the default config you shipped with your plugin.

&nbsp;

If you have a finished version of your plugin that you would like to **publish to NPM**, follow these steps:

-   If this is your first time, create an [NPM account](https://www.npmjs.com/signup), open a command line/terminal in your plugin project folder and run `npm login`. (I assume you have npm installed alongside node)
-   Once that is done, give your plugin a proper version number in `package.json`. NPM packages use semantic versioning which is explained above.
-   Set `botVersion` in `package.json` to the current version of the steam-comment-service-bot. This allows users to see for which version your plugin was made and tested. A warning will be displayed on plugin load if the bot or your plugin is outdated.
-   Run `npm publish` in the command line/terminal window from step 1.
-   If everything goes well, your package should now be accessible to anyone. Check it out by searching for it [on the npm webpage](https://www.npmjs.com/)!

To install and use your plugin anyone can now run the command `npm install steam-comment-bot-your-plugin-name` in their steam-comment-service-bot folder.  
On restart (or by running the command `!reload`) you should see your plugin get loaded!  
The bot will automatically create a new data folder for your plugin in the `plugins` folder. It will already contain the default config you shipped with your plugin.

&nbsp;

<a id="additional-info"></a>

## **Additional information**

**Debug Mode:**  
It may make sense to enable `printDebug` in the `advancedconfig.json` while you are working on your plugin.  
This will log way more stuff while the bot is running to maybe help you debug your plugin.  
Feel free to include 'debug' log calls in your plugin as well!

&nbsp;

**More efficient NPM setup for development:**  
To improve your plugin development experience it is recommended to link your project and the bot using npm.  
This will allow you to test changes without needing to pack or publish the plugin.

To do this, follow these steps:

-   Open a command line/terminal window in the folder of your plugin project
-   Run the command `npm link`. On Linux you might have to precede the command with `sudo` (or doas, or whatever you are using).  
    This will make the package available locally to all projects
-   Open a terminal window in the folder of your bot installation. Run the command `npm link name-of-your-package`
-   Open the package.json in the folder of your bot installation and add your plugin as a dependency with a random version. This is important so that the plugin loader will find your package.  
    Example: `"name-of-your-package": "^0.0.0"`  
    Don't forget to add a comma at the end of the previous line so that your JSON object is valid.

On restart (or by running the command `!reload`) you should see your plugin get loaded!  
If you make changes in your plugin project you now only need to run the `!reload` command to test them.

&nbsp;

**Issues and Pull Requests:**  
You found a bug or you think something should be changed in the bot itself?  
Feel free to [open an issue](https://github.com/3urobeat/steam-comment-service-bot/issues/new/choose) or fork the bot, make changes and [open a pull request](https://github.com/3urobeat/steam-comment-service-bot/compare) yourself! Every contribution is welcome!
