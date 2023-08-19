# Data Documentation
[⬅️ Go back to wiki home](./#readme)

&nbsp;

This is the full documentation of the `data.json` file. This file must **not** be edited!  
It stores various persistent data about what version the bot is running, which file to start, etc.  

&nbsp;

| Key           | Description  |
| ------------- | ------------ |
| version       | Defines the installed version. This number will be used by the updater to determine if an update is available. |
| versionstr    | Defines the installed version in a more readable format. |
| branch        | Defines in which branch of this GitHub repository the bot will check for updates. |
| filetostart   | Lets the starter know which file it has to start/restart. |
| filetostarturl | Lets start.js know where to get the file if it is missing (was important for the update from 2.5.x to 2.6). |
| botobjectfile | Lets the starter know where to find all bot instances to log them out for a restart etc. | 
| mestr         | A string with my name to reference it in certain places. |
| aboutstr      | The !about message. This is stored here to prevent manipulation and false credit with certain mechanics in the code itself. |
| firststart    | Defines if the whatsnew and please give my repo a star message is being shown. |
| compatibilityfeaturedone | Defines if the compatibility feature ran already. |
| whatsnew      | Shows new features of the last update. |
| timesloggedin | A number that counts how often the bot has been started. Used to calculate the estimated login time. |
| totallogintime | Number of seconds where the average login time of one account gets added to. Used to calculate the estimated login time. |