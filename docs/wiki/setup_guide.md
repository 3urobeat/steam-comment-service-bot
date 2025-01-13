# Setup Guide
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This page will walk you through downloading, setting up and configuring the bot!  
This process usually takes around 10 minutes, provided you've already created a few Steam accounts to use with the bot.  

If you would like to rather follow a video than these written instructions, click: <a href="https://youtu.be/8J78rC9Z28U" target="_blank"><img src="https://img.shields.io/badge/YouTube-Tutorial-red"></a>  
Every headline on this page also contains a YouTube badge which will take you to the corresponding video part when clicked!  

&nbsp;

> [!WARNING]
> I, 3urobeat (the developer), am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.  
> By using this application, you agree to using it responsibly!  

&nbsp;

## Table Of Contents
- [Download](#download-)
- [Setup & Configuration](#setup--configuration-)
  - [Accounts](#accounts)
  - [Config](#config-)
  - [Custom Quotes](#custom-quotes)
- [Usage](#usage-)

&nbsp;

## Download: <a href="https://youtu.be/8J78rC9Z28U?t=45" target="_blank"><img align="right" src="https://img.shields.io/badge/YouTube-Tutorial%20section-red"></a>

Click here: [Download](https://github.com/3urobeat/steam-comment-service-bot/archive/master.zip)  
Extract the zip and open the `steam-comment-service-bot` folder.  
  
You need to have at least node.js version 16.0.0 installed: [Download](https://nodejs.org)  
If you already have node installed, check the version number by running `node --version` in your console or terminal.  
If you need a tutorial for this specific node part, [click here.](https://youtu.be/8J78rC9Z28U?t=60)  

&nbsp;

## Setup & Configuration: <a href="https://youtu.be/8J78rC9Z28U?t=125" target="_blank"><img align="right" src="https://img.shields.io/badge/YouTube-Tutorial%20section-red"></a>
#### Accounts:
The bot needs at least a few Steam Accounts configured to be effective.  
These accounts are used to do the interactions in the SteamCommunity which you request (e.g. commenting, voting, favorizing, ...).  
Creating a few accounts manually shouldn't take long. Make sure to give them a username and profile picture so they don't *instantly* look like random Bot accounts.  

Open the `accounts.txt` file with a text editor and provide your accounts in the `username:password` format, one account per line.  
If you have a shared secret to bypass Steam Guard, you can provide it in this format: `username:password:shared_secret`. This is completely optional.   
The first account which you provide in this file will be the one you interact with to run commands to request comments, see info, etc.  

Login using QR-Code:  
Should an account use Mobile Steam Guard, and you'd like to login by scanning a QR-Code using your phone, then this is possible as well!  
Just provide "qrcode" as the password, basically like this: `username:qrcode`.  
The bot will then print a QR-Code to the terminal when logging in, allowing you to scan it using the Steam Mobile App.

Steam Guard info:  
Make sure your accounts have at least E-Mail Steam Guard activated! This is a requirement from Steam to be able to comment at all!  
I highly recommend that you take a quick look at the [Steam Limitations wiki page](./steam_limitations.md) to learn more about what you can and cannot do with your accounts.

<details>
  <summary>Another, optional method (not recommended anymore):</summary>
  
  If you'd rather like to provide your accounts in an object notation (JSON), then empty the accounts.txt file and create a `logininfo.json` file.  
  Fill out the usernames and passwords of each bot account you want to use, following this object notation format:  
  ```json
  {
    "bot0": ["username0", "password0", "shared_secret"],
    "bot1": ["username1", "password1", "shared_secret"],
    "bot2": ["username2", "password2", "shared_secret"]
  }
  ```
  If you have a shared_secret then you can add it there too, otherwise just leave the brackets empty.  
  You can add more accounts by extending the list ("bot4": ["username4", "password4", "shared_secret"], etc...).  
    
  Make sure to **NOT** forget a comma after each line, **ONLY** the last line **MUST NOT** have a comma! (ignoring this will cause errors!)  

  This was the method of providing login credentials back in the day and is kept for backwards compatiblity.  
  It is not recommended anymore as the chance of making a syntax mistake is way higher and requires more effort to extend for lots of accounts.
</details>  
  
&nbsp;

#### Config: <a href="https://youtu.be/8J78rC9Z28U?t=181" target="_blank"><img align="right" src="https://img.shields.io/badge/YouTube-Tutorial%20section-red"></a> 
Open the `config.json` file with a text editor of your choice.  
We need to configure just a couple of things - your profile link, your ID and max comments - the rest can be left at default for now.

- **First,** provide the link to your steam profile at "owner". Example: `"owner": "https://steamcommunity.com/id/3urobeat",`
- **Second,** provide the same link, just the vanity or steamID64 inside the "ownerid" array. This will give yourself owner rights, giving you access to more features and certain owner only commands. If you want to set multiple owners, check out the [config documentation](./config_doc.md).  
Example (using the vanity): `"ownerid": ["3urobeat"]`
- **Third,** set an amount a normal user and an owner is allowed to request from the bot at once. This largely depends on how many accounts you use, the delay set and if you use proxies.  
For now, I would recommend max 2 comments per account if you use no proxies and default settings. So if you use 5 accounts, try setting "maxRequests" and "maxOwnerRequests" to `10` and leave the requestDelay at default.  
Example: `"maxRequests": 10,` & `"maxOwnerRequests": 10,`
  
Make sure your formatting follows the default `config.json` exactly (especially the commas at the end of every line and quotation marks)!

For now you can ignore all the other settings, however if you'd like to customize more values later on then check out the [complete config documentation](./config_doc.md).  

&nbsp;

<a id="custom-quotes"></a>
<details>
  <summary><strong>Custom Quotes:</strong> (optional)</summary>

  The bot comes with a default set of quotes which are randomly selected for each comment.  
  If you'd like to specify your own selection of quotes you can do so:  
    
  Open `quotes.txt` with a text editor. You can add as many quotes as you want, line by line.  
  Make sure to not leave a line empty as it can otherwise lead to errors.   
  The bot will choose a random quote for **every** comment. If you only provide one quote, the bot will only use that one for all comments.  

  You can also set comments that go over multiple lines (ASCII-Art, etc.).  
  To do that, just put a `\n` at the end of each line of the multi-line comment. Then move the next line of your comment behind the `\n` so that your multi line comment is **only one line** in your quotes.txt, with each line of the actual comment seperated by a `\n`.  

  > Example: `My cool comment: \nline1\nline2\nline3`  

  > Note: If your comment contains `\n` that should not get converted to a line break, you need to escape the backslash like this: `\\n`
</details>
  
&nbsp;

The bot is now ready to be started! Do not modify any of the other files.  

&nbsp;

## Usage: <a href="https://youtu.be/8J78rC9Z28U?t=239" target="_blank"><img align="right" src="https://img.shields.io/badge/YouTube-Tutorial%20section-red"></a>
Open up a power shell/terminal in this folder and type `node start.js`.  

> [!IMPORTANT]
> Do not start the bot with a tool that restarts on changes, like for example 'nodemon'! Always use plain `node`.  

Head over to your Steam client, add the main bot (the first account in your accounts.txt) as friend and send him the chat message `!help`.  
It should respond with a list of commands available to you.  

To request a comment, simply type `!comment 1`!  
Click on the <a href="https://youtu.be/8J78rC9Z28U?t=239" target="_blank"><img src="https://img.shields.io/badge/YouTube-Tutorial%20section-red"></a> badge to see a demo.  

You can see all commands and their usage [here in the wiki](./commands_doc.md).  

&nbsp;

## That's it! 🎉
Congrats, you've successfully set up the bot!  
Head back to the README by [clicking here](../..#setup-config-guide)!
