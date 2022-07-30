<div align="center" markdown=1>
	<p align="center"><img width=45% src="https://3urobeat.com/comment-bot/steamLogo.png"></p>
	<strong>Request multiple profile comments by texting a bot network!</strong>
	<br>See how to set up the bot and customize it below.<br>
	<p></p>
</div>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![YouTube](https://img.shields.io/badge/YouTube-Tutorial-red)](https://youtu.be/gmA-ccD05g4)
[![nodejs](https://img.shields.io/badge/node.js-v14-brightgreen)](https://nodejs.org/)
[![Star](https://img.shields.io/badge/-Give%20this%20repo%20a%20star!-yellow)](https://github.com/HerrEurobeat/steam-comment-service-bot)
[![Steam Group](https://img.shields.io/badge/Steam%20Group-Join!-blue)](https://steamcommunity.com/groups/3urobeatGroup)
[![Donate](https://img.shields.io/badge/donate-%241-orange)](https://paypal.me/3urobeat)
<p align="center">Click on a badge to learn more.</p>

<p align="center">
  <a href="#introduction">Introduction</a> •
  <a href="#download-">Download</a> •
  <a href="#setup--configuration-">Setup & Config</a> •
  <a href="#usage-">Usage</a> •
  <a href="#additional-informations-">Additional information</a>
</p>
  
![Showcase](https://3urobeat.com/comment-bot/showcase.gif)
  
## **Introduction**  
<img align="right" width="200" height="200" src="https://3urobeat.com/comment-bot/mesh.png">  
  
* Request many profile comments directly from the steam chat  
* Easily host multiple steam accounts and control them from **one** console and chat with this bot cluster  
* Send comments to other steam profiles  
* Apply cooldowns & customize nearly any value  
* Advertise your group & automatically invite users to it  
* Use proxies and requests comments via URL in your browser  
  
You can see and test out my 24/7 hosted comment bot in action [by clicking here!](https://steamcommunity.com/id/3urobeatscommentbot)  
  
If you would like to see a detailed tutorial in the form of a video, [click here!](https://www.youtube.com/watch?v=gmA-ccD05g4)  
This written tutorial also contains a video tutorial badge link for each specific part besides each header!  
  
**Disclaimer!**  
>I, the developer, am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.  
  
*Although this setup may seem long, don't worry, the setup can be done in <3 minutes.*  
This is a basic setup guide. Visit the [Wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki) for more detailed documentations!
  
## **Download:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=12)  
Click here: [Download](https://github.com/HerrEurobeat/steam-comment-service-bot/archive/master.zip)  
Extract the zip and open the `steam-comment-service-bot` folder.  
  
You need to have at least node.js version 14.15.0 installed: [Download](https://nodejs.org)  
To get your version number type `node --version` in your console or terminal.  
If you need a tutorial for this specific node part, [click here.](https://youtu.be/gmA-ccD05g4?t=35)  
  
## **Setup & Configuration:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=111)    
#### **Accounts**
Open the `accounts.txt` file and provide your accounts in the `username:password:shared_secret` format, one account per line.  
If you don't want to use a shared_secret just leave it out and only provide the account in the `username:password` format.  
  
Please make sure you know about limited/unlimited accounts. Your accounts also need to have E-Mail Steam Guard active.  
You can read a detailed explanation [here in the wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Steam-limitations).
  
<details>
  <summary>Another, optional method (not recommended for new users):</summary>
  
  If you'd rather like to provide your accounts in an object notation (JSON), then delete the accounts.txt file and open the `logininfo.json` file.  
  Fill out the usernames and passwords of each bot account you want to use, following the existing format.  
  If you have a shared_secret then you can add it there too, otherwise just leave the brackets empty.  
  You can add more accounts by extending the list ("bot4": ["username4", "password4", "shared_secret"], etc...).  
    
  Make sure to **NOT** forget a comma after each line, **ONLY** the last line **MUST NOT** have a comma! (ignoring this will cause errors!)  
</details>  
  
#### **Config**
Open `config.json` with a text editor.  
You need to provide the link to your steam profile at "owner" and the link or your steam64id of your profile at "ownerid", following the existing template.  
Make sure to put your link and or ID inside the brackets, just like the template shows.  
  
For now you can ignore all the other settings, however if you'd like to customize more values later on then check out the [complete config documentation](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki).  
  
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

The bot is now ready! Don't modify any of the other files.  

## **Usage:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=385)  
Open up a power shell/terminal in this folder and type `node start.js`.  

> **Important Disclaimer:** Do not start the bot with a tool that restarts on changes (like nodemon etc)! Only use normal `node`.  

Head over to your Steam client, add the main bot (the first account in your accounts.txt) as friend and send him the message `!help`.  
It should respond with a list of commands available to you.  

To request a comment, simply type `!comment 1`!  
You can see all commands and their usage [here in the wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki/Commands-documentation).  

## **Additional Information:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=611)  
Hey, if you like this project please consider donating a buck on my [PayPal!](https://paypal.me/3urobeat)  
[![Donate](https://img.shields.io/badge/donate-%241-orange)](https://paypal.me/3urobeat)  
If you like the work I put into this project, please give this repository a star!  
![Star](https://img.shields.io/github/stars/HerrEurobeat/steam-comment-service-bot)  

#### **The Wiki**
The Wiki of this repository holds a lot of valuable information, please [check it out](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki)!  
You can find pages there on how to add proxies to drastically increase the amount of possible comments, how to integrate the bot into your own application, adding your own language, documentation on errors, the config, advancedconfig and more.  

#### **Bugs, Issues & Betas**
If you encountered a **bug**, you **need help** or wish a feature to be added, please open an [**issue!**](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose)  
If you are interested in beta builds of this project, visit the [beta-testing branch.](https://github.com/HerrEurobeat/steam-comment-service-bot/tree/beta-testing)  
If you are interested in the active development progress, visit the [projects section.](https://github.com/HerrEurobeat/steam-comment-service-bot/projects)

#### **License**
The code is distributed under the GPL-3.0 license.  
If you want to use code from this repository in your project, feel free to do so as long as you **include a link** as a comment to the file in this repository!  
If you are using this bot as a whole: You are only allowed to change the config files. You are **not** allowed to remove any credit to myself.  

#### **Credits & Donations**
Thank you [DoctorMcKay](https://github.com/DoctorMcKay) for creating the [steam-user](https://github.com/DoctorMcKay/node-steam-user) and [steamcommunity](https://github.com/DoctorMcKay/node-steamcommunity) libraries!  

Special thanks to [KNO7](https://steamcommunity.com/id/KN07Gaming/) for testing early beta versions, providing many ideas behind this project and donating 5€!  
I also want to thank [Stiefel](https://steamcommunity.com/id/Stiefel1234) for finding weird bugs I wouldn't have found alone, being a cool dude and for hosting the bot with 9 unlimited accounts.  
Another thank you goes out to [effex1337](https://github.com/effex1337) for donating $5 via bitcoin, helping in issues and for supporting the project!  
Also thank you [steel4me](https://github.com/steel4me) for donating 5€!  
Thanks [mikelobam](https://github.com/mikelobam) for contributing to this project!  
Thanks [dunderzutt](https://steamcommunity.com/id/Dunderzutt/) for donating 25€! Really appreciate it!  
Thanks [Lujza](https://steamcommunity.com/id/7656119829563751) for donating ~4€ in TF2 keys!  
Thanks [Orel](https://steamcommunity.com/id/ReloBOT/) for donating 4€!  
Thanks [Ecstasyyy](https://steamcommunity.com/id/elrondnetwork/) for donating ~10€ in TF2 keys!  
Thanks [Leezzy](https://steamcommunity.com/id/Leezzy) for donating ~6,50€ in CSGO items!  
