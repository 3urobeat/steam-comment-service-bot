# Adding proxies
[⬅️ Go back to wiki home](./#readme)

&nbsp;

## Why should I use proxies?
Proxies are without a question the most effective and best way to improve the amount of accounts you can use to comment simultaneously.  

If you are using 10+ accounts, I strongly encourage you to think about using proxies.  
It drastically reduces the amount of requests on one IP by equally spreading all accounts onto different IPs.  
This allows you to comment more and faster by reducing the chance of an IP ban.  

&nbsp;

## Adding proxies
Adding proxies is quite simple:  
- Create a `proxies.txt` file in the bot folder  
- Open the file with a text editor  
- Add as many HTTP proxies as you wish line per line  
- Save the file and start the bot  
  
Your proxies must be provided in this format: `http://user:pass@1.2.3.4:8081`  

If you are using webshare.io then check out my quick and dirty [conversion script](https://github.com/3urobeat/webshare-proxies-file-converter).  
It reformats the export to the format which this bot uses.

The bot will automatically spread all your bot accounts over all available proxies.  
By default the bot will also use your own IP. If you'd like to disable this and only use proxies, set `useLocalIP` in the `advancedconfig.json` to `false`.

Please note that Steam might block some proxy providers.  
I'm paying just $1/month for 33 proxies. I'd be comfortable using these up to 100 accounts.
