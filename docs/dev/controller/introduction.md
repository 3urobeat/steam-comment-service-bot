# Controller
[⬅️ Go back to dev home](../#readme) <a href="/src/controller/controller.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

The Controller is the center piece of the application.  
It is the entry point of the child process, which gets spawned by the [parent process](../starter.md).  
It stores references to all the other modules, does first checks (e.g. internet connection, unsupported nodejs version) and handles the startup.  

The parent process forks a child that loads `controller.js` into memory and sets a timestamp of startup as `process.argv[3]`.  
Any data which should be passed through a restart will be set as a stringified object at `process.argv[4]`.  
If the mentioned timestamp is within the last 2.5 seconds, `controller.js` will create a new Controller object and call `_start()` to start the application.  

Most functions are prototype functions linked to the existing Controller object at runtime, some may however still be normal exported functions.  

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.
