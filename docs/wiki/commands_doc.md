# Commands documentation
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This is the full documentation of all commands. Most commands have aliases but some might be missing in this list.
[Try them out!](https://steamcommunity.com/id/3urobeatscommentbot/)  

&nbsp;

| Command       | Usage/Arguments  | Description  |
| ------------- | ---------------- | ------------ |
| !help         | No arguments     | Returns a list of commands available to you and a link to this page. |
| !comment      | User: `amount`<br><br>Owner: `amount ID [custom quotes]` | Request comments from all available bot accounts. Max amount can be defined in `config.json`, please see its [documentation page](./config_doc.md) for more information.<br><br>Owner specific: Provide an ID/url to send comments to a specific profile, group, sharedfile (screenshot, artwork, guide), discussion or review (you must provide a full url for discussions & reviews). You must always provide `amount` when providing `ID`.<br>A botowner can also provide a custom quote selection in the form of an array [quote1, quote2, ...]. You need to provide all previous arguments.<br><br>When no `ID` has been provided the bot will always use the profile of the requesting user. (You) |
| !upvote       | `amount ID`      | Upvotes a sharedfile or review with all bot accounts that haven't yet voted on that item. Requires unlimited accounts! |
| !downvote     | `amount ID`      | Downvotes a sharedfile or review with all bot accounts that haven't yet voted on that item. Requires unlimited accounts! (Owner only.) |
| !funnyvote    | `amount link`    | Votes with funny on a review using all bot accounts that haven't yet voted on that item. Requires unlimited accounts! |
| !favorite     | `amount ID`      | Favorizes a sharedfile with all bot accounts that haven't yet favorized that item. Alias: !fav |
| !unfavorite   | `amount ID`      | Unfavorizes a sharedfile with all bot accounts that have favorized that item. Alias: !unfav (Owner only.) |
| !follow       | `amount ID`      | Follows a user's workshop or a curator (you must provide a full url for curators) with all bot accounts that haven't yet done so.<br>Providing an ID/url is owner only, normal users can only request follows for themselves.<br>When no `ID` has been provided the bot will always use the profile of the requesting user. (You) |
| !unfollow     | `amount ID`      | Unfollows a user's workshop or a curator (you must provide a full url for curators) with all bot accounts that have done so.<br>Providing an ID/url is owner only, normal users can only request unfollows for themselves.<br>When no `ID` has been provided the bot will always use the profile of the requesting user. (You) |
| !ping         | No arguments     | Returns ping in ms to Steam's servers. Can be used to check if the bot is responsive | 
| !info         | No arguments     | Returns useful information and statistics about the bot and you. |
| !owner        | No arguments     | Returns a link to the owner's profile set in the config.json. |
| !group        | No arguments     | Sends an invite or responds with the group link set as yourgroup in the config. |
| !abort        | `ID`             | Abort your own comment process or one on another ID you have started. Owners can also abort requests started by other users. |
| !resetcooldown | `profileid` or `global` | Clear your, the profileid's or the comment cooldown of all bot accounts (global). Alias: !rc (Owner only.) |
| !settings     | `config key` `new value` | Change a value in the config. (Owner only.) |
| !lang         | `language`       | Set a language which the bot will use to respond to you. This setting is per-user. Provide no argument to get a list of all supported languages. |
| !failed       | `ID`             | See the exact errors of the last comment request on your profile or provide an ID to see the errors of the last request you started. Owners can also view errors for requests started by other users. | 
| !sessions     | No arguments     | Displays all active requests. Alias: !requests (Owner only.) |
| !mysessions   | No arguments     | Displays all active requests that you have started. Alias: !myrequests |
| !about        | No arguments     | Displays information about this project. The message also contains a disclaimer as well as a link to the owner's profile set in the config.json. |
| !addfriend    | `profileid`      | Adds the profileid with all bot accounts. Requires unlimited accounts! (Owner only.) |
| !unfriend     | `profileid`      | Unfriends a user from all logged in accounts. (Owner only.) Providing no argument will let all bots unfriend you. (Available to normal users) | 
| !unfriendall  | `"abort"`        | Unfriends everyone with all bot accounts. (Owner only.) |
| !joingroup    | `groupid64` or `group url` | Joins a Steam Group with all bot accounts. (Owner only.) |
| !leavegroup   | `groupid64` or `group url` | Leaves a group with all bot accounts. (Owner only.) | 
| !leaveallgroups | `"abort"`      | Leaves all groups with all bot accounts. (Owner only.) |
| !block        | `profileid`      | Blocks a user with all bot accounts on Steam. (Owner only.) |
| !unblock      | `profileid`      | Unblocks a user with all bot accounts on Steam. Note: The user can still get ignored by Steam for a while. (Owner only.) |
| !jobs         | No arguments     | Lists all currently registered jobs. (Owner only.) |
| !plugins      | No arguments     | Lists all currently active and installed but inactive plugins, including their version, botVersion and description. (Owner only.) |
| !reload       | No arguments     | Reloads all commands and plugins without needing to restart. Please only use it for testing/development. Alias: !rl (Owner only.) |
| !restart      | No arguments     | Restarts the bot and checks for available updates. Alias: !rs (Owner only.) |
| !stop         | No arguments     | Stops the bot. (Owner only.) |
| !update       | `true` | Checks for an available update and installs it if automatic updates are enabled and no requests are active. 'true' forces an update. Blocks new requests if it currently waits for one to be completed. (Owner only.) |
| !log          | No arguments     | Shows the last 15 lines of the log. (Owner only.) |
| !eval         | `javascript code` | Disabled by default, needs to be toggled on with `enableevalcmd` in config.json.<h4>**Warning!** This will run any javascript code that was provided. It is strongly advised to leave this feature off unless you know exactly what this means! If you have multiple owners configured they can also run code on **your** machine!</h4> (Owner only.) |
| !manage       | `mode argument`  | Interact with the manage module to administrate the active set of bot accounts (add, remove, filter). Run the command without `mode` or `argument` to display help. (Owner only.) |
  
&nbsp;

To get more information about responses in form of an error that one of these commands could return, visit the `Errors & FAQ` page in this wiki.  

**Note about voting, favorizing & follow commands:**  
The bot only knows about accounts which have already voted/favorized/followed an item for requests that have been made through the bot.  
This is because all requests are stored in a database and we cannot ask Steam for every account on every request as this would spam the heck out of them.
