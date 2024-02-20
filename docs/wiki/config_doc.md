# Config Documentation
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This is the full documentation to customize your `config.json`.  
  
**Note:** You don't need to change any values except the owner and ownerid values. Everything else is configured to work out of the box but there might be better settings for your specific situation. Recommendation: Try the default values and customize them if you get errors/problems.  

&nbsp; 
  
| Key           | Usage            | Description  |
| ------------- | ---------------- | ------------ |
| \_help\_ | String | No functionality. Links directly to here to provide easily accessible explanations. |
| defaultLanguage | String | Default language to use for new users adding your bot account. [List of supported languages](/src/data/lang/) - Default: "english" |
| requestDelay  | Number in ms | Time the bot waits between each comment/vote/follow to prevent a cooldown from Steam. Default: 15000 (15 seconds) |
| skipSteamGuard | true or false | When true, the bot will skip all accounts that require a Steam Guard Code to be typed in when logging in. Default: false |
| requestCooldown | Number in min | Applies this cooldown in minutes to every user after they started a request. Set to 0 to disable. Default: 5 |
| botaccountcooldown | Number in min | Applies this cooldown to every bot account used in a request to prevent getting a cooldown from Steam. Set to 0 to disable. Default: 10 |
| maxRequests | Number | Defines how many comments a normal user can request from your bot. Will automatically use accounts multiple times for commenting if it is greater than the amount of accounts available. |
| maxOwnerRequests | Number | Defines how many comments owners can request (every user in the ownerid list below). Will automatically use accounts multiple times if it is greater than the amount of accounts logged in. |
| randomizeAccounts | true or false | Defines if the order of accounts used to comment/like/fav should be randomized. Default: false |
| unfriendtime | Days | Amount of days after which the bot will unfriend an inactive user (activity is measured using when they last started a request). Does not unfriend owners. Set to 0 to disable. |
| playinggames | `["custom game", game id, game id, ...]` | This custom text will be shown on your profile as the name of a game you are playing. The bot will play the set game ids. Don't provide a string to disable the custom game text. |
| childaccplayinggames | `["custom game", game id, game id, ...]` <br><br> or <br><br> `[{ "myacc1": ["Specific Game", 730], "myacc25": [] }, "General Game", 440]` | Same behaviour as playinggames but sets the status and games for all child accounts.<br>Use the second syntax to set specific games for specific child accounts.<br>Replace "myacc1" etc. with the username of the corresponding account.<br><br>This example will display "Specific Game" game & idle CS2 only for account "myacc1", idle nothing for account "myacc25" and display "General Game" & idle TF2 for all other accounts. |
| yourgroup | "url to group" | Advertise your group with the !group command. Leave it empty (like this: "") to disable the command. |
| botsgroupid | "url to group" | All bot accounts will join this group. Disable this feature by leaving the brackets empty (like this: ""). |
| acceptgroupinvites | true or false | Defines if the bots will accept group invites from other users. A group invite from the main bot will always be accepted. |
| owner | "url to profile" | Advertise your own profile with the !owner command. Leave it empty (like this: "") to disable the command. |
| ownerid | ["profile link or id1", "id2"] | Sets these users as owners. Needs to be set to use the bot. You can set profile links or ids like in the example to have multiple owners. |
