This folder holds patches I have made to libraries this project uses.  
These changes are being applied at runtime when the library is loaded.  

&nbsp;

## SteamCommunity by DoctorMcKay
My fork containing all changes: https://github.com/3urobeat/node-steamcommunity  
The original library which is installed: https://github.com/DoctorMcKay/node-steamcommunity  

&nbsp;

These are the patches being applied:  
- Re-enable primaryGroup profile setting: [#287](https://github.com/DoctorMcKay/node-steamcommunity/pull/287) & [#307](https://github.com/DoctorMcKay/node-steamcommunity/pull/307)  
- Add sharedfiles voteUp & voteDown support
- Fix resolving vanity for private profiles returning error: [#315](https://github.com/DoctorMcKay/node-steamcommunity/pull/315)
- Fix sharedfile data scraping failing as a non-english page was returned by Steam: [#316](https://github.com/DoctorMcKay/node-steamcommunity/pull/316)
- Fix scraping sharedfile type failing when incomplete breadcrumb was returned: [#316](https://github.com/DoctorMcKay/node-steamcommunity/pull/316)
- Add discussions support: [#319](https://github.com/DoctorMcKay/node-steamcommunity/pull/319)
- Add user/workshop follow & unfollow support: [#320](https://github.com/DoctorMcKay/node-steamcommunity/pull/320)

These patches have been applied in the past:  
- Add full sharedfiles support: [#306](https://github.com/DoctorMcKay/node-steamcommunity/pull/306)
- Fix resolving vanity returning error: [#314](https://github.com/DoctorMcKay/node-steamcommunity/pull/314)

&nbsp;

## SteamUser by DoctorMcKay
My fork containing all changes: https://github.com/3urobeat/node-steam-user  
The original library which is installed: https://github.com/DoctorMcKay/node-steam-user  

&nbsp;

These are the patches being applied:  

These patches have been applied in the past:  
- Add clearPicsCache function to reduce memory usage and store job types: [#444](https://github.com/DoctorMcKay/node-steam-user/pull/444)