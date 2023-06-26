const SteamUser = require("steam-user");

const EMsg = SteamUser.EMsg;


/**
 * Clears the current picsCache content.
 * Make sure to disable 'changelistUpdateInterval' if the cache should not get repopulated.
 */
SteamUser.prototype.clearPicsCache = function() {
    if (!this.options.enablePicsCache) {
        throw new Error("PICS cache is not enabled.");
    }

    // Reset cache back to default
    this.picsCache = {
        changenumber: 0,
        apps: {},
        packages: {}
    };

    // Filter jobs object for left over references to the old picsCache content so it will be garbage collected instantly
    Object.keys(this._jobs).forEach((e) => {
        let k = this._jobs[e];

        if (k.type && [ EMsg.ClientPICSChangesSinceRequest, EMsg.ClientPICSProductInfoRequest, EMsg.ClientPICSAccessTokenRequest ].includes(k.type)) {
            delete this._jobs[e];
            clearTimeout(this._jobCleanupTimers[e]);
            delete this._jobCleanupTimers[e];
        }
    });
};