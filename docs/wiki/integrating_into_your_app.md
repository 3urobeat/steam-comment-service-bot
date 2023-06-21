# Integrating into your own application
If you would like to integrate the comment command into your own application or you just don't want to deal with the Steam Chat then that is no problem! This can easily be done by pinging an URL.  

Note: The current webserver will be replaced with a better one in version 2.14, featuring a full fledged frontend.

First make sure that you started the bot at least once.  
Go into your `plugins` and then `steam-comment-bot-webserver` folder, open `config.json` with a text editor, set `enabled` to `true` and save the file.
Start the bot again. You should see this message when the bot is ready:  
```
[INFO] Webserver is enabled: Server is listening on port 3034.
       Visit it in your browser: http://localhost:3034
```  

If you now reopen the `config.json` you should see a new value at `requestKey`. Copy it as we will need it in a minute.  
Do not share this key! It is used to authenticate yourself to the webserver and allow comment requests to be made in the name of the first owner!  

Visit the URL in your webbrowser and you will see a page that instructs you how to use it.  
If your bot is running on a different machine you will need to provide the IP of that machine instead of localhost but I will assume that you know basic networking here. To be able to reach the URL from outside your private network you will need to allow port 3034 in your router's settings and provide your public IP instead of localhost but this should also be basic networking knowledge.  
I however do not recommend exposing this port without any further security measures as I can't guarantee for any security here whatsoever!  

Requesting comments is very easy now. Just ping the `/comment` page with the required query parameters shown on the page you just opened and the webserver will respond with a HTTP status code and a message.  
Webserver comment requests will always be credited to the first owner set in the config.  

Example:  
`http://localhost:3034/comment?n=5&id=76561198260031749&key=pc90qtmzfk`  

This will request 5 comments for the steam profile `76561198260031749`.  
You can of course also provide group or sharedfile IDs here.