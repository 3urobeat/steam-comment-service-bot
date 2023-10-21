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

&nbsp;

## start.js <a href="/start.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

This file cannot be updated!

This is the entry point of the parent process.  
If `src/data/data.json` exists, it reads the next file to start from it. If not, it defaults to `./src/starter.js`.  
This allows the parent process to be semi-updateable, should the file structure change.  
Should this file be missing, it is able to fetch it from GitHub, allowing the bot to restore itself just from this single file.  

Following up, it executes the `run()` function which `starter.js` exposes.  

&nbsp;

Every function and object property is documented with JsDocs in the implementation file.  
Please check them out using your IntelliSense or by clicking the button in the top right corner of this paragraph.

&nbsp;

## starter.js <a href="/src/starter.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

This file can be semi-updated. When restarting after an update, start.js clears the cache of this file which will load changes but can leave old references behind in the memory. 

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

&nbsp;

Every function and object property is documented with JsDocs in the implementation file.  
Please check them out using your IntelliSense or by clicking the button in the top right corner of this paragraph.