# Errors, FAQ & Common problems
This is a documentation of all bot errors and all steam errors I know and is therefore always under construction. 🚧  
You can search for your error on this page by pressing `CTRL+F` in your browser.  
If you can't find your error and need help, please open a new [issue.](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose)  
<br />
Please remember that the steam errors list is incomplete and the descriptions are only assumptions as there is no proper documentation from steam and sometimes errors seem to thrown randomly. The list only contains errors I have encountered and think to know what they mean.  
<br />
Bot errors are errors that are being directly returned from my bot, not from steam. I created this documentation so that my bot doesn't suffer the same fate as the steam errors.

- [Errors, FAQ \& Common problems](#errors-faq--common-problems)
  - [Bot Errors:](#bot-errors)
  - [Steam Errors:](#steam-errors)
  - [FAQ/Common problems](#faqcommon-problems)

## Bot Errors:  
| Error message | Description |
| ---- | ---- |

Coming soon...
  
## Steam Errors:
Please don't take all error descriptions for granted. Steam sometimes seems to throw random errors that might not actually have an impact or have completely different reasons.  
<br /><br />
| HTTP Errors |
| ----- |
`Error: HTTP Error 403`: Steam denied your request. Why? I don't know for sure.  
`Error: HTTP Error 429`: Your IP has made too many requests to Steam and got a cooldown. Wait a few minutes and try again. You can increase the commentdelay or reduce the amount of accounts using one IP (for example with proxies) to combat this.  
`Error: HTTP Error 500`: The steam servers seem to have a problem/are down. Check [steam server status.](https://steamstat.us)  
`Error: HTTP Error 502`: The steam servers seem to have a problem/are down. Check [steam server status.](https://steamstat.us)  
`Error: HTTP Error 504`: The steam servers are slow atm/are down. Check [steam server status.](https://steamstat.us)  
  
You can find all HTTP status codes here: [Wikipedia](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
<br /><br />
| Other Errors | Description |
| ----- | ----- |
`Error: Unknown error` | As the error already states - the reason is unknown. Just try again.  
`Error: There was a problem posting your comment. Please try again` | Reason unknown - wait a moment and try again.  
`Error: You've been posting too frequently, and can't make another post right now` | The account has made too many comments in a short time frame. Wait a few minutes and try again. I think Steam also limits the amount of comments a profile can recieve in a short time frame.  
`Error: The settings on this account do not allow you to add comments` | The profile's comment section you are trying to comment on is private, your bot account doesn't meet steams regulations or you have a cooldown. I don't know for sure but I have the feeling that a comment section also has a limit of comments it can recieve in a given timeframe. Try again later. Read more about steam limitations: [Click](https://github.com/HerrEurobeat/steam-comment-service-bot#steam-limitations)  
`Error: socket hang up` | The steam servers seem to have a problem/are down. Check [steam server status.](https://steamstat.us)  
`Error: Failed loading profile data, please try again later` | The bot couldn't get profile data to prevent other possible errors and give a more precise error. Do not worry, the comment process can still work fine but other preventable errors could occur.
`Error: Already logged on, cannot log on again` | The account is already logged in somewhere. Make sure the bot is not running already and that you aren't logged into them in your browser. Also make sure the bot is not in a compressed folder (.zip) anymore.
`Error: To post this comment, your account must have Steam Guard enabled` | You must have at least an email steam guard configured for that account in order to comment on any steam profile. Read more about steam limitations: [Click](https://github.com/HerrEurobeat/steam-comment-service-bot#steam-limitations)  

<br /><br />
| Login Errors | Description |
| ----- | ----- |
`Error: AccessDenied` | This can happen if your session got invalidated for some reason. This can often be solved by deleting the `tokens.db` file, located at `src/data/` inside the bot folder, or by only removing the one line of the affected account inside the `tokens.db` file.  

## FAQ/Common problems  

**Q: I got a problem/bug that isn't listed here.**  
A: Please open a new [issue](https://github.com/HerrEurobeat/steam-comment-service-bot/issues/new/choose) and describe your problem there!  

**Q: Can my bot accounts get banned by using this?**  
A: As long as you **don't spam** comments or post comments with malicious content you won't get banned. Inappropiate behaviour can result in a Community Ban.  