# Controller Helpers
[⬅️ Go back to Controller](./controller.md) <a href="/src/controller/helpers" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Folder-darkcyan"></a>

&nbsp;

The helpers folder contains functions which are regularly used, often by multiple files, also from other modules.  
Each module has their own helpers folder, containing helper functions which fit the best to that specific module, to keep the project structure organized.  

All prototype functions which are directly accessible from the active Controller object at runtime are already listed in the [Controller](./controller.md) docs page.  
This page only includes functions which are directly exported, meaning to use them you need to import that specific helper file in your code.

&nbsp;

## Table of Contents
- [misc.js](#miscjs-)
- [npminteraction.js](#npminteractionjs-)

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find a specific function using its name on this page.

&nbsp;

## misc.js <a href="/src/controller/helpers/misc.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>
Special Case: The functions in this helper are directly accessible from the Controller object to make using them easier. You can access them through the Controller `misc` object.

### syncLoop(iterations, func, exit): object
- `iterations` (number) - The amount of iterations
- `func` (function(object, number): void) - The function to run each iteration (Params: loop, index)
- `exit` (function(): void) - This function will be called when the loop is finished

Implementation of a synchronous loop for easy iteration management.
It returns an object containing these functions:  
- `next` (function(): void) - Executes the next iteration of the loop or exits if this was the last one.
- `break` (function(): void) - Exits the loop.
- `iteration` (function(): number) - Returns the current iteration index.

### round(value, decimals): number
- `value` (number) - Number to round
- `decimals` (number) - Amount of decimals

Rounds a number with x decimals.  
Returns the rounded number as number.

### timeToString(timestamp): string
- `timestamp` (string) - The UNIX timestamp to convert

Converts a timestamp to a human-readable "until from now" format.  
Returns the timestamp converted to "x seconds/minutes/hours/days".

### checkConnection(url, throwTimeout, proxy): Promise
- `url` (string) - The URL of the service to check
- `throwTimeout` (boolean) - Optional: If true, the function will throw a timeout error if Steam can't be reached after 20 seconds
- `proxy` ({ ip: string, port: number, username: string, password: string }) - Optional: Provide a proxy if the connection check should be made through a proxy instead of the local connection

Pings a **https** URL to check if the service and the user's internet connection is working.  
Returns a Promise which will be resolved on response code 2xx and rejected otherwise. Both are called with an object containing `statusMessage`: string and `statusCode`: number | null.

### splitProxyString(url): object
- `url` (string) - The HTTP proxy URL

Splits a HTTP proxy URL into its parts.  
Returns an object containing these parts: `{ ip: string, port: number, username: string, password: string }`

### cutStringsIntelligently(txt, limit, cutChars?, threshold?): string[]
- `txt` (string) - The string to cut
- `limit` (number) - Maximum length for each part. The function will attempt to cut txt into parts that don't exceed this amount.
- `cutChars` (string[]) - Optional: Custom chars to search after for cutting string in parts. Default: [" ", "\n", "\r"]
- `threshold` (number) - Optional: Maximum amount that limit can be reduced to find the last space or line break. If no match is found within this limit a word will be cut. Default: 15% of total length

Helper function which attempts to cut Strings intelligently. It will attempt to not cut words & links in half.  
Returns an array containing all parts of the string.

&nbsp;

## npminteraction.js <a href="/src/controller/helpers/npminteraction.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

### reinstallAll(logger, callback): void
- `logger` (function(): void) - The currently used logger function (e.g. controller.logger or global.logger)
- `callback` (function(string | null, string | null): void) - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion

Attempts to reinstall all npm modules.  
Note: The function only installs production deps, meaning devDependencies are omitted.

### update(callback): void
- `callback` (function(string | null, string | null): void) - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion

Updates all installed packages to versions listed in package.json from the project root directory.  
Note: The function only installs production deps, meaning devDependencies are omitted.

### updateFromPath(path, callback): void
- `path` (string) - Custom path to read package.json from and install modules to
- `callback` (function(string | null, string | null): void) - Called with `err` (String) and `stdout` (String) (npm response) parameters on completion

Updates all installed packages to versions listed in a package.json at a specific path.  
Note: The function only installs production deps, meaning devDependencies are omitted.
