<div align="center" markdown=1>
	<p align="center"><img width=45% src="https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/.github/img/steamLogo.png"></p>
	<strong>Request multiple profile comments by texting a bot network!</strong>
	<br>See how to set up the bot and customize it below.<br>
	<p></p>
</div>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![YouTube](https://img.shields.io/badge/YouTube-Tutorial-red)](https://youtu.be/gmA-ccD05g4)
[![nodejs](https://img.shields.io/badge/node.js-v12-brightgreen)](https://nodejs.org/)
[![Star](https://img.shields.io/badge/-Give%20this%20repo%20a%20star!-yellow)](https://github.com/HerrEurobeat/steam-comment-service-bot)
[![Steam Group](https://img.shields.io/badge/Steam%20Group-Join!-blue)](https://steamcommunity.com/groups/3urobeatGroup)
[![Donate](https://img.shields.io/badge/donate-%241-orange)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VAVVKE4L962H6&source=url)
<p align="center">Click on a badge to learn more.</p>

<p align="center">
  <a href="#introduction">Introduction</a> •
  <a href="#download-">Download</a> •
  <a href="#setup--configuration-">Setup & Config</a> •
  <a href="#usage-">Usage</a> •
  <a href="#additional-informations-">Additional information</a>
</p>
  
![Showcase](https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/.github/img/showcase.gif)
  
## **Introduction**  
<img align="right" width="200" height="200" src="https://raw.githubusercontent.com/HerrEurobeat/steam-comment-service-bot/master/.github/img/mesh.png">  
  
* Request many profile comments directly from the steam chat  
* Easily host multiple steam accounts and control them from **one** console and chat with this bot cluster  
* Send comments to other steam profiles  
* Apply cooldowns & customize nearly any value  
* Advertise your group & automatically invite users to it  
  
If you would like to see a detailed tutorial in the form of a video, [click here!](https://www.youtube.com/watch?v=gmA-ccD05g4)  
This written tutorial will also contain a video tutorial badge link for each specific part!  
If you would like to see my 24/7 comment bot in action, [click here!](https://steamcommunity.com/id/3urobeatscommentbot)  
  
**Disclaimer!**  
>I, the developer, am not responsible and cannot be held liable for any action the operator/user of this bot uses it for.  
  
*Although this setup may seem long, don't worry, the setup can be done in <3 minutes.*  
This is a basic setup guide. Visit the [Wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki) for more detailed documentations!
  
## **Download:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=12)  
Click here: [Download](https://github.com/HerrEurobeat/steam-comment-service-bot/archive/master.zip)  
Extract the zip and open the `steam-comment-service-bot` folder.  
  
Have at least node.js version 12 installed: [Download](https://nodejs.org)  
To get your version number type `node --version` in your console or terminal.  
If you need a tutorial for this specific node part, [click here.](https://youtu.be/gmA-ccD05g4?t=35)  
  
## **Setup & Configuration:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=111)  
Open a power shell/terminal in the `steam-comment-service-bot` folder and type `npm install`.  
  
#### **Accounts**
Open `logininfo.json` with a text editor and fill out the user names and passwords of each bot account you want to use.  
You can add more accounts by extending the list ("bot4": ["username4", "password4"], etc...). Make sure to **NOT** forget a comma after each line, **ONLY** the last line **MUST NOT** have a comma! (ignoring this will cause errors!)  
  
#### **Config**
Open `config.json` with a text editor.  
You need to provide the link to your steam profile at "owner" and the steam64 id of your profile at "ownerid".
If you don't know how to find your steam64id, open [SteamDB](https://steamdb.info/calculator/), search your profile and copy the ID located down below at SteamID.  

A complete documentation of the `config.json` can be found in the [Wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki).  
  
#### **Quotes**
Open `quotes.txt` with a text editor. You can add as many quotes as you want, line by line. **Don't leave an empty line anywhere in this file!** The file already has default comments set up.  
The bot will choose a random quote for **every** comment. If you only provide one quote, the bot will only use that quote.  
  
The bot(s) is/are now setup! Don't modify any of the other files.  

## **Usage:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=385)  
Type `node start.js` in the power shell/terminal you opened earlier.  
Add the main bot (bot0 in logininfo.json) on steam and send him the message: `!help`  

To request a comment, simply type `!comment`!
If you have more than 1 account set up in `logininfo.json` you can specify how many comments you want.

## **Additional informations:** [![YouTube](https://img.shields.io/badge/YouTube-Tutorial%20section-red)](https://youtu.be/gmA-ccD05g4?t=611)  
Hey, if you like this project please consider donating a buck on my [PayPal!](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VAVVKE4L962H6&source=url)  
[![Donate](https://img.shields.io/badge/donate-%241-orange)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VAVVKE4L962H6&source=url)  
If you like the work I put into this project, please give this repository a star!  
![Star](https://img.shields.io/github/stars/HerrEurobeat/steam-comment-service-bot)

#### **Bugs, Issues & Betas**
If you encountered a **bug**, you **need help** or wish a feature to be added, please open an [**issue!**](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose)  
If you are interested in beta builds of this project, visit the [beta-testing branch.](https://github.com/HerrEurobeat/steam-comment-service-bot/tree/beta-testing)  
If you are interested in the active development progress, visit the [projects section.](https://github.com/HerrEurobeat/steam-comment-service-bot/projects)

#### **Errors & FAQ**
Please visit the [Wiki](https://github.com/HerrEurobeat/steam-comment-service-bot/wiki) for a detailed description of known steam errors and bot errors.

#### **Steam limitations**
Steam sadly has some strict restrictions for commenting.  
Read all of them here: [Steam Support](https://support.steampowered.com/kb_article.php?ref=3330-IAGK-7663)  
**Important**: If you use *limited accounts* (<$5 spend) the user will need to send all of these accounts a friend request before requesting a comment!  
Please be also advised that in order to comment on a profile the accounts need to have at least **email steam guard** activated. There are generators out there that can directly generate accounts with steam guard.

#### **License**
As the **license** already stated: If you want to use code from this repository in your project, feel free to do that as long as you **include credit** to this repository!  

#### **Credits**
Special thanks to [KNO7](https://steamcommunity.com/id/KN07Gaming/) for testing early beta versions and providing many ideas behind this project.  
I also want to thank [Stiefel](https://steamcommunity.com/id/Stiefel1234) for finding weird bugs I wouldn't have found alone.  
