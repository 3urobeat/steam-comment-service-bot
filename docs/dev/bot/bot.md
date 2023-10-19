# Bot
[⬅️ Go back to dev home](../#readme) <a href="/src/bot/bot.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

When logging in, the controller creates a bot object for every Steam account the user has provided.  
It creates a SteamUser and SteamCommunity instance, which allow the Controller to use this bot account to interact with Steam.  
The bot object itself handles events for this specific account (e.g. chat messages), informs the Controller about connection losses, etc.  

&nbsp;

Every function and object property is documented with JsDocs in the implementation file.  
Please check them out using your IntelliSense or by clicking the button in the top right corner of this page.