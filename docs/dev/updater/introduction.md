# Updater
[⬅️ Go back to dev home](../#readme) <a href="/src/updater/updater.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

The Updater is able to fully update the application on a user's machine, without any manual interaction.  
It does so by periodically checking the GitHub repository for a new version, pulling the codebase as a zip, creating a backup, replacing the files and restarting the bot.  

To recover from a failed update, the bot creates a backup of the current codebase before updating.  
This backup will then be recovered, the bot will restart and skip any updates for some time.  

Updater's `run()` function calls [helper functions](#helpers) in the correct order which do the actual downloading, installing and backup handling.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.
