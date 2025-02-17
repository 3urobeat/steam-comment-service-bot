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

&nbsp;
  
By default the proxies must be provided in the format `http://${username}:${password}@${ip}:${port}` with username & password being optional (depends on if your proxies require authentication of course).

If the proxies of your provider differ from the default structure, you can change the `proxyFormat` setting in `advancedconfig.json`.  
By default the setting is empty, meaning the bot will assume the proxies to be in the default format and will attempt to use them as is.

For example, webshare.io provides proxies in the download using the proxyFormat `${ip}:${port}:${username}:${password}`.

&nbsp;

The bot will automatically spread all your bot accounts over all available proxies.  
By default the bot will also use your own IP. If you'd like to disable this and only use proxies, set `useLocalIP` in the `advancedconfig.json` to `false`.

Please note that Steam might block some proxy providers.  
I'm paying just $1/month for 33 proxies. I'd be comfortable using these with up to 100 accounts.
