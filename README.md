<div align="center" markdown=1>
	<p align="center"><img width=45% src="https://3urobeat.com/comment-bot/steamLogo.png"></p>
	<strong>Request multiple profile comments by texting a bot network!</strong>
	<br>See how to set up the bot and customize it below.<br>
	<p></p>
</div>

<div align="center">

[![YouTube](https://img.shields.io/badge/YouTube-Tutorial-red)](https://youtu.be/8J78rC9Z28U)
[![nodejs](https://img.shields.io/badge/node.js-v14-brightgreen)](https://nodejs.org/)
[![Star](https://img.shields.io/badge/-Give%20this%20repo%20a%20star!-yellow)](https://github.com/3urobeat/steam-comment-service-bot)
[![Steam Group](https://img.shields.io/badge/Steam%20Group-Join!-blue)](https://steamcommunity.com/groups/3urobeatGroup)
[![Donate](https://img.shields.io/badge/Donate-%241-orange)](https://github.com/sponsors/3urobeat)
<p align="center">Click on a badge to learn more.</p>

</div>

<p align="center">
  <a href="#introduction">Introduction</a> •
  <a href="#download-">Download</a> •
  <a href="#setup--configuration-">Setup & Config</a> •
  <a href="#usage-">Usage</a> •
  <a href="#additional-information-">Additional information</a>
</p>
  
![Showcase](https://3urobeat.com/comment-bot/showcase.gif)

&nbsp;

## **Introduction**  
<img align="right" width="200" height="200" src="https://3urobeat.com/comment-bot/mesh.png">  
  
* Request many profile comments directly from the steam chat  
* Easily host multiple steam accounts and control them from **one** console and chat with this bot cluster  
* Send comments to other steam profiles  
* Apply cooldowns & customize nearly any value  
* Advertise your group & automatically invite users to it  
* Use proxies and requests comments via URL in your browser  
  
You can see and test out my 24/7 hosted comment bot in action [by clicking here!](https://steamcommunity.com/id/3urobeatscommentbot)  
  
If you would like to see a detailed tutorial in the form of a video, [click here!](https://www.youtube.com/watch?v=8J78rC9Z28U)  
This written tutorial also contains a video tutorial badge link for each specific part besides each header!  

&nbsp;

**Disclaimer!**  
>I, 3urobeat (the developer), am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.  
>By starting this bot you agree to not misuse it!  
  
*Although this setup may seem long, don't worry, the setup can be done in <5 minutes.*  
This is the basic setup guide. Visit the [Wiki](https://github.com/3urobeat/steam-comment-service-bot/wiki) for more detailed documentations! Let's get started:

&nbsp;

## **Download:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/8J78rC9Z28U?t=45)  
Click here: [Download](https://github.com/3urobeat/steam-comment-service-bot/archive/master.zip)  
Extract the zip and open the `steam-comment-service-bot` folder.  
  
You need to have at least node.js version 14.15.0 installed: [Download](https://nodejs.org)  
To get your version number type `node --version` in your console or terminal.  
If you need a tutorial for this specific node part, [click here.](https://youtu.be/8J78rC9Z28U?t=60)  

&nbsp;

## **Setup & Configuration:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/8J78rC9Z28U?t=125)    
#### **Accounts**
Open the `accounts.txt` file and provide your accounts in the `username:password:shared_secret` format, one account per line.  
If you don't want to use a shared_secret just leave it out and only provide the account in the `username:password` format.  
  
Please make sure you know about limited/unlimited accounts. Your accounts also need to have E-Mail Steam Guard active.  
You can read a detailed explanation [here in the wiki](https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/steam_limitations.md).
  
<details>
  <summary>Another, optional method (not recommended anymore):</summary>
  
  If you'd rather like to provide your accounts in an object notation (JSON), then empty the accounts.txt file and create a `logininfo.json` file.  
  Fill out the usernames and passwords of each bot account you want to use, following this object notation format:  
  ```
  {
    "bot0": ["username0", "password0", "shared_secret"],
    "bot1": ["username1", "password1", "shared_secret"],
    "bot2": ["username2", "password2", "shared_secret"]
  }
  ```
  If you have a shared_secret then you can add it there too, otherwise just leave the brackets empty.  
  You can add more accounts by extending the list ("bot4": ["username4", "password4", "shared_secret"], etc...).  
    
  Make sure to **NOT** forget a comma after each line, **ONLY** the last line **MUST NOT** have a comma! (ignoring this will cause errors!)  
</details>  
  
&nbsp;

#### **Config** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/8J78rC9Z28U?t=181)  
Open `config.json` with a text editor.  
You need to provide the link to your steam profile at "owner" and the link or your steam64id of your profile at "ownerid", following the existing template.  
Make sure to put your link and or ID inside the brackets, just like the template shows.  
  
Set an amount of comments a normal user and the amount an owner is allowed to request from the bot.  
This largely depends on how many accounts you use, the commentdelay set and if you use proxies.  
I would recommend max 2 comments per account if you use no proxies and default settings, so if you use 5 accounts, try setting maxComments and maxOwnerComments to 10.  
  
For now you can ignore all the other settings, however if you'd like to customize more values later on then check out the [complete config documentation](https://github.com/3urobeat/steam-comment-service-bot/wiki).  

&nbsp;

<details>
  <summary><strong>Custom Quotes</strong> (optional)</summary>

  The bot comes with a default set of quotes which are randomly selected for each comment.  
  If you'd like to specify your own selection of quotes you can do so:  
    
  Open `quotes.txt` with a text editor. You can add as many quotes as you want, line by line.  
  Make sure to not leave a line empty as it can otherwise lead to errors.   
  The bot will choose a random quote for **every** comment. If you only provide one quote, the bot will only use that one for all comments.  

  You can also use comments that go over multiple lines (ASCII-Art, etc.).  
  To do that, just put a `\n` at the end of each line of the multi-line comment. Then move the next line of your comment behind the `\n` so that your multi line comment is **only one line** in your quotes.txt, with each line of the actual comment seperated by a `\n`.  

  > Example: `My cool comment: \nline1\nline2\nline3`  
</details>
  
&nbsp;

The bot is now ready! Do not modify any of the other files.  

&nbsp;

## **Usage:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/8J78rC9Z28U?t=239)  
Open up a power shell/terminal in this folder and type `node start.js`.  

> **Important Disclaimer:** Do not start the bot with a tool that restarts on changes (like nodemon etc)! Only use normal `node`.  

Head over to your Steam client, add the main bot (the first account in your accounts.txt) as friend and send him the message `!help`.  
It should respond with a list of commands available to you.  

To request a comment, simply type `!comment 1`! [Click to see Demo](https://youtu.be/8J78rC9Z28U?t=294)  
You can see all commands and their usage [here in the wiki](https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/commands_doc.md).  

&nbsp;

## **Additional Information:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/8J78rC9Z28U?t=339)  
<div align="center">

[![Sponsor](https://img.shields.io/badge/Sponsor-%241-orange)](https://github.com/sponsors/3urobeat) ![Star](https://img.shields.io/github/stars/3urobeat/steam-comment-service-bot)  
> If you like this project please consider donating a dollar by clicking on the **Sponsor** badge and by giving this repository a **Star** at the top!  

</div>

&nbsp;

#### **The Wiki**
The Wiki of this repository holds a lot of valuable information, please [check it out](https://github.com/3urobeat/steam-comment-service-bot/tree/master/docs/wiki#readme)!  
You'll find pages on how to add proxies to drastically increase the amount of possible comments, how to integrate the bot into your own application, adding your own language, documentation on errors, the config, advancedconfig and much more.  

#### **Questions, Bugs, Issues & Betas**
If you have any questions, please feel free to open a [Q&A discussion](https://github.com/3urobeat/steam-comment-service-bot/discussions/new?category=q-a)!  
If you encountered a **bug** or wish a feature to be added, please open an [**issue!**](https://github.com/3urobeat/steam-comment-service-bot/issues/new/choose)  
If you are interested in beta builds of this project, visit the [beta-testing branch.](https://github.com/3urobeat/steam-comment-service-bot/tree/beta-testing)  
If you are interested in the active development progress, visit the [projects section.](https://github.com/3urobeat/steam-comment-service-bot/projects)

#### **License**
This project and all code included is distributed under the GPL-3.0 license.  
If you want to use code from this repository in your project, feel free to do so as long as you **include a URL** as comment above the code block to the file in this repository!  
When using this project as a whole you are only allowed to edit the config files. You are **not** allowed to edit any files in a way that would remove credit to myself, the author.  

#### **Credits & Donations**
Thank you [DoctorMcKay](https://github.com/DoctorMcKay) for creating the [steam-user](https://github.com/DoctorMcKay/node-steam-user) and [steamcommunity](https://github.com/DoctorMcKay/node-steamcommunity) libraries which this project heavily depends on!  

Thank you so much to every single one who donated a dollar or two; there are now too many names to list them one by one! ❤️  