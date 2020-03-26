<div align="center">
	<h1 align="center">~ Steam Comment Service Bot ~</h1>
	<strong>Request multiple comments on your profile by texting a bot!</strong><br />See how to set up the bot and customize it below.<br /><br />
</div>

**If you want, you can donate a few bucks on my [Patreon](https://www.patreon.com/3urobeat)! I would really appreciate it!**

The bot will be online in form of an own account and operate through direct messages.  
To see a list of all commands the user can send the bot a message: `!help`.  

[Click here to see my 24/7 comment bot in action!](https://steamcommunity.com/id/3urobeatscommentbot)  

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

Rename the `logininfo.json.example` to `logininfo.json`.  
Open the file with a text editor and fill out the user names and passwords of each bot account you wanna use.  
You can add more login-informations based on the given pattern. The bot will start as many bot accounts as you provide login-informations for.  

Open `config.json` with a text editor. You can customize the values below `version` to your liking. The values are explained below.  

| Key           | Usage            | Description  |
| ------------- | ---------------- | ----- |
| mode          | 1 or 2           | Mode 1: All bots you have logininformations provided for will start up and work for themselves. Mode 2: The first logininfo will start a bot and when a comment is requested all accounts you have provided logininfos for will comment under that one profile. |
| status        | [Status Codes](https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EPersonaState.js) | Sets your status. (Online, Busy etc.) |
| commentdelay  | Number in ms | Adds a delay between each comment to prevent a cooldown from steam. Default: 5000
| logindelay    | Number in ms | Adds a delay between each login when the bot is started to prevent a cooldown from steam. Default: 2500 
| logcommandusage | true or false | Enables or disables the logging of every command usage by a user in the console. Commenting will still be logged. |
| allowcommentcmdusage | true or false | Allows other users to use the !comment command or restrict it to the owner. **ownerid needs to be set in config!**
| commentcooldown | Number in min | Applies this cooldown in minutes to every user who used the !comment command to prevent spam. Set to 0 to disable cooldown. Default: 5
| globalcommentcooldown | Number in ms | Applies this cooldown in milliseconds to every comment command usage to prevent getting a cooldown from steam. The user specific commentcooldown will still be applied. Set to 0 to disable. |
| unfriendtime  | Days | Number of days the bot will wait before unfriending someone who hasn't requested a comment in that time period except the owner. Set to 0 to disable. |
| playinggames  | ["custom game", game id] | This custom text will be shown on your profile as the name of a game you are playing. The bot will play the set game id. |
| yourgroup     | "link to my group" | Advertise your group with the !group command. Leave it empty (like this: "") to disable the command. |
| yourgroup64id | "my group64id" | [How do I get this ID?](https://steamcommunity.com/sharedfiles/filedetails/?id=1344514370) The bot will send a group invite instead of the link to your group from above. If no ID is provided, the bot will send the link from above but no invite. |
| botsgroupid   | "group64id" | [How do I get this ID?](https://steamcommunity.com/sharedfiles/filedetails/?id=1344514370) The main bot will send a group invite to all other bots. Disable this feature by leaving the brackets empty (like this: ""). |
| acceptgroupinvites | true or false | Defines if the bots will accept group invites from other users. A group invite from the main bot will always be accepted. |
| owner         | "link to my profile" | Advertise your own profile with the !owner command. Leave it empty (like this: "") to disable the command. |
| ownerid       | ["profile id1", "id2"] | Needs to be set to enable different bot owner only features. You can set multiple ids like in the example to have multiple owners. |
| enableevalcmd | true or false | The eval command allows the botowner to run javascript code from the steam chat. **Warning: This can harm your machine! Leave it to false if you don't know what you are doing!** Default: false |


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
