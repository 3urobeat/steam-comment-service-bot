# How to customize chat messages sent by the bot
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This page will instruct you on how to modify the messages the bot will send to a user.  
This includes nearly all messages and isn't difficult!  

Please open the file `customlang.json` which is located in the bot's folder.  
If this file doesn't exist for you (which will be the case if you updated to `2.10`) then please create it and copy&paste [this](https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/beta-testing/customlang.json) into it.  

Every message that you are able to change is included [here](https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/src/data/lang/defaultlang.json).  

To change a message add a comma to the end of the previous line and add the key of the message you want to change to your `customlang.json` **with the same syntax** you saw in the list with all messages.  
After you have done that add a colon behind your key and write your message in the brackets.  

Example of how your `customlang.json` could look like after changing the `useradded` message:
```
{
    "note": "Please read here on how to use this file: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/customlang_doc.md",
    "useradded": "You will recieve this message if you add me and it was modified using the customlang file!",
}
```  

Notes:  
- Some messages may have words in them that will be replaced by the bot when sending the message. You should be able to spot them easily like for example `steamID64` in the `failedcmdmsg` message. You should include them in your custom message as well.
- Don't hardcode command prefixes and instead use the keyword `cmdprefix`. It will be replaced by messages that support it by default.