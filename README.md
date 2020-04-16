<div align="center">
	<h1 align="center">~ Steam Comment Service Bot ~</h1>
	<strong>Request multiple comments on your profile by texting a bot!</strong><br />See how to set up the bot and customize it below.<br /><br />
</div>

**If you want, you can donate a few bucks on my [Patreon](https://www.patreon.com/3urobeat) or [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VAVVKE4L962H6&source=url)! I would really appreciate it!**

The bot will be online in form of an own account and operate through direct messages.  
To see a list of all commands the user can send the bot a message: `!help`.  

[Click here to see my 24/7 comment bot in action!](https://steamcommunity.com/id/3urobeatscommentbot)  
If you want to see commits of code that is unstable or not yet tested, visit the beta-testing branch of this repository.

After requesting a comment, the user will be getting a cooldown applied, changeable in the config. The comment command can also be restricted to the owner so that the owner can even **send a comment to another profile** by supplying the profile id. Type `!help` when running in Mode 2 to see the arguments.  
 
This bot cluster features two modes:  
**Mode 1:** Start as many bots as you provide logininformations for and let them operate by themselves.  
**Mode 2:** The first logininformation will start the main bot and all the other logininformations will connect with the main bot. When you text the main bot, all other accounts will comment under your profile.  
If you are planning to build your bot imperium this could be a great place to start from.  
Continue reading for a detailed setup guide **including the `Additional Informations` part!**  

**Disclaimer!** 
>I am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.  
If you, the user, download or use this application, you agree that only you are responsible for any action.  

## Requirements

- `node` (https://nodejs.org)

## Downloading

Click here: [Download](https://github.com/HerrEurobeat/steam-bots/archive/master.zip)  
Extract the zip and open the `steam-comment-service-bot` folder.

## Setting the bot up & Configuring

Open a command prompt or power shell in the folder and type `npm install`. Let it install the dependencies.  

Open `logininfo.json` with a text editor and fill out the user names and passwords of each bot account you want to use.  
You can add more login-informations by extending the list ("bot4": ["username4", "password4"], etc...). Make sure to **NOT** forget a comma after each line, **ONLY** the last line **MUST NOT** have a comma! (ignoring this will cause errors!)  

Open `config.json` with a text editor.  
You need to provide the link to your steam profile at "owner" and the steam64 id of your profile at "ownerid".
If you don't know how to find your steam64id, open [SteamDB](https://steamdb.info/calculator/), search your profile and copy the ID located down below at SteamID.  
A complete documentation of the `config.json` can be found in the [Wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki).  

Open `quotes.txt` with a text editor. You can add as many quotes as you want, line by line. **Don't leave an empty line anywhere in this file!**  
The bot will choose a random quote for **every** comment. If you only provide one quote, the bot will only use that quote.  

The bot(s) is/are now setup. Don't modify any of the other files.   

## Starting the bot

To start the bots, open a command prompt and type:    
`node start.js`  

The bots should start and you will see them online. You can add them as a friend and send them a message: `!help`  

## Additional informations

Steam limits accounts that haven't spend $5 on steam (Level 0). If you plan on using Level 0 accounts in your bot cluster, be advised that the requesting user needs to be friend with **ALL** of the accounts that will try to comment.  
This is a limitation from steam I can't do anything about.  

Keep also in mind, that steam can put a cooldown on your accounts if you try to comment too often too fast. I used a working commentdelay in the config.json but if too many individual users request a comment it can still cause errors.  

As the **license** already stated: If you want to use code from this repository in your project, feel free to do that as long as you **include credit** to this repository!  

**If you have other questions or problems feel free to open an issue.**  

Thanks to [KNO7](https://steamcommunity.com/id/KN07Gaming/) for helping with testing early beta versions!  
**If you want to buy profile comments for a small price, visit [KNO7's Discord Server](https://discordapp.com/invite/ZraK7qR)!**  
