const helpers = require("../../node_modules/steamcommunity/components/helpers.js");
const request = require('request');
const xml2js  = require('xml2js');


/**
 * Resolves a Steam profile URL to get steamID64 and vanityURL
 * @param {String} url - Full steamcommunity profile URL or only the vanity part.
 * @param {Object} callback - First argument is null/Error, second is object containing vanityURL (String) and steamID (String)
 */
helpers.resolveVanityURL = function(url, callback) {
	// Precede url param if only the vanity was provided
	if (!url.includes("steamcommunity.com")) {
		url = "https://steamcommunity.com/id/" + url;
	}

	// Make request to get XML data
	request(url + "/?xml=1", function(err, response, body) {
		if (err) {
			callback(err);
			return;
		}

		// Parse XML data returned from Steam into an object
		new xml2js.Parser().parseString(body, (err, parsed) => {
			if (err) {
				callback(new Error("Couldn't parse XML response"));
				return;
			}

			if (parsed.response && parsed.response.error) {
				callback(new Error("Couldn't find Steam ID"));
				return;
			}

			let steamID64 = parsed.profile.steamID64[0];
			
			let vanityURL;

			if (parsed.profile.customURL) { // Always get customURL from XML if profile is public to support "/profiles/steamID64" urls
				vanityURL = parsed.profile.customURL[0]
			} else if (url.includes("steamcommunity.com/id/")) { // Get vanity from url param instead if profile is private as Steam does not include a customURL key for them
				vanityURL = url.replace("https://steamcommunity.com/id/", "");
			} else { // If a "/profiles/steamID64" link to a private profile was provided we cannot get the vanity
				vanityURL = "";
			}

			callback(null, {"vanityURL": vanityURL, "steamID": steamID64});
		});
	});
};