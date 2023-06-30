# Adding proxies
[⬅️ Go back to wiki home](./)

If you are using 10+ accounts I encourage you to use proxies.  
It drastically reduces the amount of requests on one IP by equally spreading all accounts onto different IPs, allowing you to comment more and faster, reducing the chance of an IP ban.  
  
Adding proxies is quite simple:  
- Create a `proxies.txt` file in the bot folder  
- Open the file with a text editor  
- Add as many HTTP proxies as you wish line per line  
- Save the file and start the bot  
  
Your proxies must be provided in this format: `http://user:pass@1.2.3.4:8081`  

If you are using webshare.io and are too lazy to convert the proxy file download yourself like me, then check out my quick and dirty [conversion script](https://github.com/3urobeat/webshare-proxies-file-converter).  

The bot will automatically spread all your bot accounts over all available proxies.  
By default the bot will also use your own IP. If you'd like to disable this and only use proxies, set `useLocalIP` in the `advancedconfig.json` to `false`.

Please note that Steam might block some proxy providers.  
I personally have no experience where to buy working proxies so I sadly can't make any recommendations.  