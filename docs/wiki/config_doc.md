# Config Documentation
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This is the full documentation to customize your `config.json`.  
  
**Note:** You don't need to change any values except the owner and ownerid values. Everything else is configured to work out of the box but there might be better settings for your specific situation. Recommendation: Try the default values and customize them if you get errors/problems.  

&nbsp; 
  
| Key           | Usage            | Description  |
| ------------- | ---------------- | ------------ |
| \_help\_ | String | No functionality. Links directly to here to provide easily accessible explanations. |
| requestDelay  | Number in ms | Adds a delay between each comment to prevent a cooldown from steam. Default: 7500
| skipSteamGuard | true or false | When true, the bot will skip all accounts that require a steamGuard to be typed in when logging in. Default: false |
| commentcooldown | Number in min | Applies this cooldown in minutes to every user after they requested comments. Set to 0 to disable. Default: 5
| botaccountcooldown | Number in min | Applies this cooldown to every bot account used in a comment request to prevent getting a cooldown from steam. Set to 0 to disable. Default: 10 |
| maxRequests | Number | Defines how many comments a normal user can request from your bot. Will automatically use accounts multiple times if it is greater than the amount of accounts logged in. |
| maxOwnerRequests | Number | Defines how many comments owners can request (every user in the ownerid array). Will automatically use accounts multiple times if it is greater than the amount of accounts logged in. |
| randomizeAccounts | true or false | Defines if the order of accounts used to comment should be random. Default: false |
| unfriendtime | Days | Number of days the bot will wait before unfriending someone who hasn't requested a comment in that time period except the owner. Set to 0 to disable. |
| playinggames | `["custom game", game id, game id, ...]` | This custom text will be shown on your profile as the name of a game you are playing. The bot will play the set game ids. Don't provide a string to disable the custom game text. |
| childaccplayinggames | `["custom game", game id, game id, ...]` <br><br> or <br><br> `[{ "myacc1": ["Specific Game", 730], "myacc25": [] }, "General Game", 440]` | Same behaviour as playinggames but sets the status and games for all child accounts.<br>Use the second syntax to set specific games for specific child accounts.<br>Replace "myacc1" etc. with the username of the corresponding account.<br><br>This example will display "Specific Game" game & idle CS2 only for account "myacc1", idle nothing for account "myacc25" and display "General Game" & idle TF2 for all other accounts. |
| yourgroup | "url to group" | Advertise your group with the !group command. Leave it empty (like this: "") to disable the command. |
| botsgroupid | "url to group" | All bot accounts will join this group. Disable this feature by leaving the brackets empty (like this: ""). |
| acceptgroupinvites | true or false | Defines if the bots will accept group invites from other users. A group invite from the main bot will always be accepted. |
| owner | "url to profile" | Advertise your own profile with the !owner command. Leave it empty (like this: "") to disable the command. |
| ownerid | ["profile link or id1", "id2"] | Sets these users as owners. Needs to be set to use the bot. You can set profile links or ids like in the example to have multiple owners. |