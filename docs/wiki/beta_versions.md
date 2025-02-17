# Beta Versions
[⬅️ Go back to wiki home](./#readme)

&nbsp;

The project is actively being developed on the [beta-testing](https://github.com/3urobeat/steam-comment-service-bot/tree/beta-testing) branch.  
Whenever a state of the project is determined as being stable, a new version will be merged to the [master](https://github.com/3urobeat/steam-comment-service-bot/tree/master) branch, which includes all the new changes made on the beta-testing branch.

The bot uses the master branch to check for updates by default.  
You can however also opt into getting beta updates.  
These versions are unfinished and may contain unstable changes, but you can report any issues you find to support the development.

&nbsp;

## Switching update channel
The branch to fetch updates from is set in [src/data/data.json](../../src/data/data.json).

To use the master branch, edit these values to look like this:  
```
"branch": "master",
"filetostarturl": "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/src/starter.js",
```

To use the beta-testing branch, edit these values to look like this:  
```
"branch": "beta-testing",
"filetostarturl": "https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/beta-testing/src/starter.js",
```

Save the file and (re)start the bot.  
It should now automatically update to the latest version available on the branch set.  
If the currently installed version is the same as on the other (now set) branch, no update will be performed.
