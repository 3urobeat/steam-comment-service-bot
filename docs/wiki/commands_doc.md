# Commands documentation  
This is the full documentation of all commands. Most commands have aliases but some might be missing in this list.
[Try them out!](https://steamcommunity.com/id/3urobeatscommentbot/)  

| Command       | Usage/Arguments  | Description  |
| ------------- | ---------------- | ------------ |
| !help         | No arguments     | Returns a list of commands available to you and a link to this page. |
| !comment      | User: `amount`<br /><br />Owner: `amount ID [custom quotes]` | Request comments from all available bot accounts. Max amount can be defined in `config.json`.<br /><br />Owner specific: Provide an ID to send comments to a specific profile, group or sharedfile. You must always provide `amount` when providing `ID`.<br />A botowner can also provide a custom quote selection in the form of an array [quote1, quote2, ...]. You need to provide all previous arguments.<br /><br />When no `ID` has been provided the bot will always use the profile of the requesting user. (You) |
| !upvote       | `amount ID`      | Upvotes a sharedfile with all bot accounts that haven't yet voted on that item. Requires unlimited accounts! |
| !downvote     | `amount ID`      | Downvotes a sharedfile with all bot accounts that haven't yet voted on that item. Requires unlimited accounts! (Owner only.) |
| !favorite     | `amount ID`      | Favorizes a sharedfile with all bot accounts that haven't yet favorized that item. |
| !unfavorite   | `amount ID`      | Unfavorizes a sharedfile with all bot accounts that have favorized that item. (Owners only.) |
| !ping         | No arguments     | Returns a `'Pong!'` and ping to Steam's servers. Can be used to check if the bot is responsive | 
| !info         | No arguments     | Returns useful information and statistics about the bot and you. |
| !owner        | No arguments     | Returns a link to the owner's profile set in the config.json. |
| !group        | No arguments     | Sends an invite or responds with the group link set as yourgroup in the config. |
| !abort        | `profileid`      | Abort your own comment process. Owners can also provide a profile id to abort a comment process for that profile. |
| !resetcooldown | `profileid` or `global` | Clear your, the profileid's or the comment cooldown of all bot accounts (global). Alias: !rc (Owner only.) |
| !settings     | `config key` `new value` | Change a value in the config. (Owner only.) |
| !failed       | `profileid`      | See the exact errors of your last comment request. Owners can also provide a profile id to show errors for that profile. | 
| !sessions     | No arguments     | Displays all active comment processes. (Owner only.) |
| !mysessions   | No arguments     | Displays all active comment processes for your profile. |
| !about        | No arguments     | Returns the link to this repository, my steam profile and a donation link.<br />The message also contains a disclaimer as well as a link to the owner's profile set in the config.json. |
| !addfriend    | `profileid`      | Adds the profileid with all bot accounts. **This only works with unlimited accounts!** (Owner only.) |
| !unfriend     | `profileid`      | Unfriends the associated user from all logged in accounts if he is still on their friendlist. (Owner only.) Providing no argument will let all bots unfriend you. (Available to normal users) | 
| !unfriendall  | `"abort"`        | Unfriends everyone with all bot accounts. (Owner only.) |
| !leavegroup   | `groupid64` or `group url` | Leave this group with all bot accounts. (Owner only.) | 
| !leaveallgroups | `"abort"`      | Leaves all groups with all bot accounts. (Owner only.) |
| !block        | `profileid`      | Blocks the user on Steam. (Owner only.) |
| !unblock      | `profileid`      | Unblocks the user on Steam. Note: The user still seems to be ignored for a few days by Steam. (Owner only.) |
| !reload       | No arguments     | Reloads all commands and plugins without needing to restart. Please only use it for testing/development. Alias: !rl (Owner only.) |
| !restart      | No arguments     | Restarts the bot and checks for available updates. Alias: !rs (Owner only.) |
| !stop         | No arguments     | Stops the bot. (Owner only.) |
| !update       | `true` | Checks for an available update and installs it if automatic updates are enabled and no comment sessions are active. 'true' forces an update. Blocks new comment requests if it currently waits for one to be completed. |
| !log          | No arguments     | Shows the last 15 lines of the log. (Owner only.) |
| !eval         | `javascript code` | Disabled by default, needs to be toggled on with `enableevalcmd` in config.json.<h4>**Warning!** This will run any javascript code that was provided. It is strongly advised to leave this feature off unless you know exactly what this means! If you have multiple owners configured they also can run code on **your** machine!</h4> (Owner only.) |
  
<br /><br />
To get more information about responses in form of an error that one of these commands could return, visit the `Errors & FAQ` page in this wiki.  

Note about voting & favorizing commands:  
The bot only knows about accounts which have already voted/favorized an item for requests that have been made through the bot.  
This is because all requests are stored in a database and we cannot ask Steam for every account on every request as this would spam the heck out of them.