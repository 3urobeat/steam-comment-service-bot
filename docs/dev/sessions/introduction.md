# SessionHandler
[⬅️ Go back to dev home](../#readme) <a href="/src/sessions/sessionHandler.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

Every [Bot](../bot/index.md) object creates its own sessionHandler object.  
The sessionHandler handles getting a refreshToken to login a bot account into Steam.  
To do so, it either uses an existing refreshToken from the [tokens.db](../dataManager/index.md#tokensdb) database or uses the user provided login credentials to create a new session by retrieving a Steam Guard Code.

The sessionHandler module also periodically checks for tokens which expire soon and provides various functions for interacting with the [tokens.db](../dataManager/index.md#tokensdb) database.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.
