# How to customize chat messages sent by the bot
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This page will instruct you on how to modify the messages the bot will send to a user.  
This includes nearly all messages and isn't difficult!  

Please open the file `customlang.json` which is located in the bot's folder.  

This file allows you to change all supported language keys for every supported language.
Every message that you are able to change is included [here](https://raw.githubusercontent.com/3urobeat/steam-comment-service-bot/master/src/data/lang/english.json) and every supported language [here](https://github.com/3urobeat/steam-comment-service-bot/tree/master/src/data/lang).  

&nbsp;

Take a look at the example below to see how you can modify the `useradded` message for english and the `pingcmdmessage` message for russian: 
```json
{
    "english": {
        "note": "Please read here on how to use this file: https://github.com/3urobeat/steam-comment-service-bot/blob/master/docs/wiki/customlang_doc.md",
        "useradded": "You will recieve this message if you add me and it was modified using the customlang file!"
    },
    "russian": {
        "pingcmdmessage": "Imagine this is russian and your ping took ${pingtime}ms."
    }
}
```
The `note` key is being ignored by the bot, it is only there to conveniently link you to this article.

Please make sure that you follow the JSON syntax closely, the file will otherwise fail to load.  
Common mistakes are missing colons at line ends (except the last one) or missing brackets.

&nbsp;

Some questions and notes:  
- Some messages include variables. These are recognizeable by the syntax `${someVariableName}`. You must include them using the same syntax in your message so the bot can correctly replace them before sending.
- You cannot add new languages here. If you want to add a translation, please [read the howto article here](./contributing.md#translating).
- Don't hardcode command prefixes and instead use the keyword `${cmdprefix}`. It will be replaced by messages that support it by default.