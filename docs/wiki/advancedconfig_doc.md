# Advanced Config Documentation
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This is the full documentation to customize your `advancedconfig.json`.  
  
**Note:** These settings are meant for advanced users. Everything important is located in the `config.json` file and you probably don't need to change anything here.  
  
&nbsp;

| Key           | Usage            | Description  |
| ------------- | ---------------- | ------------ |
| \_disclaimer\_ | String | No functionality. Just a comment pointing to the normal config. |
| \_help\_ | String | No functionality. Links directly to here to provide easily accessible explanations. |
| disableAutoUpdate | true or false | Disables auto updates. **Setting to true is not recommended!** Default: false | 
| disablePluginsAutoUpdate | true or false | Disables the automatic updating of all installed plugins upon start. Default: false |
| &nbsp; | | |
| loginDelay  | Number in ms | Time the bot will wait between logging in each account to prevent an IP ban. Default: 2500 (2.5 seconds) |
| loginTimeout | Number in ms | Time after which an active login attempt will be considered as timed out and failed. It will be retried or skipped when maxLogOnRetries is exceeded. Set to 0 to disable. Default: 60000 (60 seconds) |
| loginRetryTimeout | Number in ms | Time the bot will wait after loosing connection to Steam before attempting to log in again. Default: 30000 (30 seconds) |
| relogTimeout | Number in ms | Time the bot will wait after failing all reconnect attempts before trying again. Default: 900000 (15 minutes) |
| maxLogOnRetries | Number | Amount of times the bot will retry logging in to an account if the first try fails. Default: 1 |
| useLocalIP | true or false | If the bot should use your real IP as well when using proxies. Default: true |
| proxyFormat | String | Used to specify the format of proxies provided in proxies.txt should they differ from the default "http://${username}:${password}@${ip}:${port}" (username & password are optional). If an empty String is provided, the provided proxies are assumed to be in the default format and will be used as is. Default: "" |
| enableRelogOnLogOnSessionReplaced | true or false | If the bot should relog accounts when they loose connection with the error message 'LogOnSessionReplaced'. This error is usually caused when someone logs into an account from somewhere else. Default: true |
| skipFamilyViewUnlock | true or false | If the bot should skip checking every account for enabled family view and asking for an unlock code. **Setting to true may make accounts with enabled family view unusable!** Default: false |
| &nbsp; | | |
| acceptFriendRequests | true or false | If the bot should accept friend requests. Default: true |
| forceFriendlistSpaceTime | Number in days | Amount of days a user hasn't requested something to get unfriended if only one friend slot is left. Set to 0 to disable. Default: 4 |
| setPrimaryGroup | true or false | If the bot should set `yourgroup` in `config.json` as the primary group of each bot. Default: false |
| onlineStatus | String | Online status of the main bot account. You can see all valid values [here](https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EPersonaState.js). Default: "Online" |
| childAccOnlineStatus | String | Online status of all child bot accounts. You can see all valid values [here](https://github.com/DoctorMcKay/node-steam-user/blob/master/enums/EPersonaState.js). Default: "Online" |
| blockPluginLoadOnMismatchedBotVersion | true or false | If true, plugins not specifically made for this bot version will be blocked from being loaded. Default: false |
| &nbsp; | | |
| commandCooldown | Number in ms | Timeframe in which a user is allowed to use 5 commands before it is considered as spamming and the user gets blocked for 90 seconds. Default: 12000 (12 seconds) |
| restrictAdditionalCommandsToOwners | Array with cmd names as strings | Restricts more commands and their aliases to owners only. Default: [] |
| retryFailedComments | true or false | If the bot should retry comments that failed in a comment request. Default: false |
| retryFailedCommentsDelay | Number in ms | Time the bot will wait before retrying the failed comments. Default: 300000 (5 minutes) |
| retryFailedCommentsAttempts | Number | How often the bot should retry a failed comment. Default: 1 |
| requestsIpCooldownPenalty | Number | Time in ms to add to cooldown of bot accounts participating in a request which experienced an IP Cooldown error (e.g. HTTP 429). **Disabling is not recommended as it might prolong the cooldown.** Default: 300000 (5 minutes) |
| lastQuotesSize | Number | Amount (minus 1) of different quotes that need to be selected in between before a quote can be used again. Default: 5 |
| &nbsp; | | |
| enableevalcmd | true or false | The eval command allows the botowner to run javascript code from the steam chat. **Warning: This can harm your machine! Leave it to false if you don't know what you are doing!** Default: false |
| disableSendingRequests | true or false | Disables sending comments/likes/favs/follows to Steam. This allows the testing of accepting and handling user requests, without sending them to Steam. Default: false |
| printDebug | true or false | Enables and logs debug messages of the bot. Default: false |
| steamUserDebug | true or false | Enables and logs debug messages of the steam-user lib. Default: false |
| steamUserDebugVerbose | true or false | Enables and logs debug-verbose messages of the steam-user lib. Default: false |
| steamSessionDebug | true or false | Enabled and logs debug messages of the steam-session lib. Default: false |
| logAnimationSpeed | Number in ms | Time the logging lib will wait between each frame of an animation. Default: 250 |

&nbsp;

The undocumented `dummy` keys are there to group certain settings together to improve visibility.  
They serve no other purpose and can be ignored.
