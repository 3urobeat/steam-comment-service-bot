# Integrating into your own application
[⬅️ Go back to wiki home](./)

&nbsp;

This project provides you two ways to integrate it into your own application.  
You can either write a **native plugin** or use the official **REST API** to communicate with another application.  

&nbsp;

**Native plugin:**  
A native plugin allows you to call functions provided by the bot, as well as reading & writing data directly.  
This is the best way to add features to the bot directly. Check out the [creating plugins page](./creating_plugins.md) for a detailed walkthrough.  

&nbsp;

**REST API:**  
The REST API is an official web server plugin developed by [DerDeathraven](https://github.com/DerDeathraven). It is shipped with this project by default.  
It uses this RPC style pattern `https://localhost:4000/rpc/${Class}.${Method}?${params}` to easily call various methods.

This is the best way to get data from the bot and run commands from another, completely detached application.  
For an example, check out the official [Web UI project](https://github.com/DerDeathraven/steam-comment-service-bot-frontend) which is also made by [DerDeathraven](https://github.com/DerDeathraven)!

The full API documentation and a TS SDK file can be found on the [plugin project page](https://github.com/DerDeathraven/steam-comment-bot-rest-api).
