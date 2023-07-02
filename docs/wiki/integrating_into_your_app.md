# Integrating into your own application

[⬅️ Go back to wiki home](./)

The bot comes with a web server plugin developed by [DerDeathraven](https://github.com/DerDeathraven)

Using a RPC style REST API you can easily call various methods.

all methods follow the same pattern:
`https://localhost:4000/rpc/${Class}.${Method}?${params}`

The full API documentation and a TS SDK file can be found on the [plugin page](https://github.com/DerDeathraven/steam-comment-bot-rest-api)
