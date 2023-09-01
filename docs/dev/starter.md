# Starter Process
[⬅️ Go back to dev home](./#readme)

&nbsp;

As mentioned in the [introduction](./introduction.md), the application operates within two processes.  
When executing the application using the terminal command `npm start`, you execute the file `start.js`, which in turn instructs `starter.js` to spawn a new child process with the entry file `controller.js`.

This architecture allows the application to completely restart itself by instructing the parent process to kill and respawn its child.  
This leaves no old data behind in the memory, which is especially important for the automatic updater.  

&nbsp;

## Table of Contents
- [start.js](#startjs-)
- [starter.js](#starterjs-)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## start.js <a href="/start.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

This is the entry point of the parent process.  
If `src/data/data.json` exists, it reads the next file to start from it. If not, it defaults to `./src/starter.js`.  
This allows the parent process to be semi-updateable, should the file structure change.  
Should this file be missing, it is able to fetch it from GitHub, allowing the bot to restore itself just from this single file.  

Following up, it executes the `run()` function which `starter.js` exposes.  

### Functions
start.js exposes one function:

#### restart(args): void
- `args` (string) - Stringified JSON object, containing data that should be kept through restarts

This function is called by `starter.js` when the child process requests to be restarted.  
It deletes the cache of `starter.js`, re-requires it and calls its `restart(args)` function.

&nbsp;

## starter.js <a href="/src/starter.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

The job of this file is to install dependencies and handle starting & restarting the child process.  
To do so, it attaches various event listeners to the parent process:  
- `handleUnhandledRejection`: Catches generic Unhandled Rejection errors. Should never fire and is only included to prevent a possible crash
- `handleUncaughtException`: Catches errors which have not been handled properly, mainly "Module Not Found" errors. This catch is used to install dependencies for first-time users.
- `exit`: Triggered when the parent process is about to stop. It stops the child process to avoid an orphan and logs to the output.

These listeners can also be detached again when restarting.

To receive restart and stop requests from the child process, as well as detecting an unexpected crash of it, it attaches various listeners to the child process as well:  
- `message` - Handles the `process.send()` messages `restart()` and `stop()` by calling the matching function in `start.js`.
- `close` - Handles an unexpected exit of the child process and restarts the application.

By default the child process is spawned with the flags `--max-old-space-size=2048` and `--optimize-for-size`.  
You can add more by extending the `execArgs` array at the top of the file.  
To enable the memory debugger you can for example pass the flag `--inspect`.

### Functions
starter.js exposes the following functions:

#### run(): void
Sets `process.env.started = true` to avoid the same parent process from spawning multiple child processes.  
It then attaches the parent listeners mentioned above, fetches `controller.js` should it be missing, forks a new child process and attaches the mentioned child process listeners.

#### restart(args): void
- `args` - Stringified JSON object containing restart data which will be passed to the child process

This function is executed instead of `run()` when the bot was previously started and so this is a restart. It is called by `start.js`.    
It makes sure the current child process has exited by sending a SIGKILL packet, forks a new child process after 2 seconds and attaches the child listeners again.

#### checkAndGetFile(file, logger, norequire?, force?): Promise
- `file` (string) - The file path (from project root) to check and get if missing/corrupted
- `logger` (function(string, string): void) - The currently active logger function (this is used to support a fake logger if no dependencies could be loaded)
- `norequire` (boolean) - If set to true the function will return the path instead of importing it. Default: false
- `force` (boolean) - If set to true the function will skip checking if the file exists and overwrite it. Default: false

Checks if a file exists and pulls it from GitHub if it doesn't.  
This function is heavily used to require files the first time inside the child process to handle potential missing or corrupted files.  
It returns a Promise which will be resolved when the file was successfully loaded.  