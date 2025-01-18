# Bot
[⬅️ Go back to dev home](../#readme) <a href="/src/bot/bot.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

When logging in, the controller creates a bot object for every Steam account the user has provided.  
It creates a SteamUser and SteamCommunity instance, which allow the Controller to use this bot account to interact with Steam.  
The bot object itself handles events for this specific account (e.g. chat messages), informs the Controller about connection losses, etc.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

### index
Each bot account gets an index assigned during the first login.  
The index property must match to the index of the corresponding entry inside the `data.logininfo` array.  
Should you want to modify the account order during runtime, you must also make the same change in the logininfo array.
