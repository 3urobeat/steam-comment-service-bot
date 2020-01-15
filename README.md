<div align="center">
	<h1 align="center">~ Steam Comment Service Bot ~</h1>
	<strong>Request a comment on your profile by texting a bot!</strong><br />See how to set up the bot and customize it below.<br /><br />
</div>

The bot will be online in form of an own account and operate through direct messages.  
To see a list of all commands the user can send the bot a message: `!help`.  

The bots feature a customizeable array for a selection of quotes, a variable for the name of the specific bot, a variable for the owner's profile and group link for advertisement.  
You can either provide multiple quotes for a random one every time or only one for always the same quote.  
The start script will start as many bots as you provide login-informations for. If you are planning to build your bot imperium this could be a great place to start from.  
Continue reading for a detailed setup guide.  

**Disclaimer!** > I am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.  
If you, the user, download or use this application, you agree that only you are responsible for any action.  

## Requirements

- `node` (https://nodejs.org)

Only necessary if you want to download via command prompt:
- `git` command line ([Windows](https://git-scm.com/download/win)|[Linux](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)|[MacOS](https://git-scm.com/download/mac)) installed

## Downloading

Click here: [Download](https://github.com/HerrEurobeat/steam-bots/archive/master.zip)  
Extract the zip and open the `comment-service-bot` folder.

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
| commentdelay  | Delay in ms | Adds a delay between each comment to prevent a cooldown from steam. Default: 5000
| logindelay    | Delay in ms | Adds a delay between each login when the bot is started to prevent a cooldown from steam. Default: 2500 
| game          | "my game name" | This custom text will be shown on your profile as the name of a game you are playing. |
| yourgroup     | "link to my group" | Advertise your group with the !group command. Leave it empty (like this: "") to disable the command. |
| yourgroup64id | "my group64id" | [How do I get this ID?](https://steamcommunity.com/sharedfiles/filedetails/?id=1344514370) The bot will send a group invite instead of the link to your group from above. If no ID is provided, the bot will send the link from above but no invite. |
| owner         | "link to my profile" | Advertise your own profile with the !owner command. Leave it empty (like this: "") to disable the command. |


Open `quotes.txt` with a text editor. You can add as many quotes as you want, line by line. **Don't leave an empty line anywhere in this file!**  
The bot will choose a random quote for **every** comment. If you only provide one quote, the bot will only use that quote.  

The bot(s) is/are now setup.  

## Starting the bot

To start the bots, open a command prompt and type:    
`node start.js`  

The bots should start and you will see them online. You can add them as a friend and send them a message: `!help`  
