const Cheerio = require('cheerio');
const SteamID = require('steamid');

const SteamCommunity = require('steamcommunity');

SteamCommunity.PrivacyState = {
	"Private": 1,
	"FriendsOnly": 2,
	"Public": 3
};

/**
 * Don't look at me, I'm just a placeholder
 * @param {*} settings 
 * @param {*} callback 
 */
SteamCommunity.prototype.editProfile = function(settings, callback) {
	var self = this;
	this._myProfile('edit/info', null, function(err, response, body) {
		if (err || response.statusCode != 200) {
			if (callback) {
				callback(err || new Error('HTTP error ' + response.statusCode));
			}

			return;
		}

		var $ = Cheerio.load(body);
		var existingSettings = $('#profile_edit_config').data('profile-edit');
		if (!existingSettings || !existingSettings.strPersonaName) {
			if (callback) {
				callback(new Error('Malformed response'));
			}

			return;
		}

		var values = {
			sessionID: self.getSessionID(),
			type: 'profileSave',
			weblink_1_title: '',
			weblink_1_url: '',
			weblink_2_title: '',
			weblink_2_url: '',
			weblink_3_title: '',
			weblink_3_url: '',
			personaName: existingSettings.strPersonaName,
			real_name: existingSettings.strRealName,
			summary: existingSettings.strSummary,
			country: existingSettings.LocationData.locCountryCode,
			state: existingSettings.LocationData.locStateCode,
			city: existingSettings.LocationData.locCityCode,
			customURL: existingSettings.strCustomURL,
			json: 1
		};

		for (var i in settings) {
			if(!settings.hasOwnProperty(i)) {
				continue;
			}

			switch(i) {
				case 'name':
					values.personaName = settings[i];
					break;

				case 'realName':
					values.real_name = settings[i];
					break;

				case 'summary':
					values.summary = settings[i];
					break;

				case 'country':
					values.country = settings[i];
					break;

				case 'state':
					values.state = settings[i];
					break;

				case 'city':
					values.city = settings[i];
					break;

				case 'customURL':
					values.customURL = settings[i];
					break;

				case 'primaryGroup':
					if(typeof settings[i] === 'object' && settings[i].getSteamID64) {
						values.primary_group_steamid = settings[i].getSteamID64();
					} else {
						values.primary_group_steamid = new SteamID(settings[i]).getSteamID64();
					}

					break;

				// These don't work right now
				/*
				case 'background':
					// The assetid of our desired profile background
					values.profile_background = settings[i];
					break;

				case 'featuredBadge':
					// Currently, game badges aren't supported
					values.favorite_badge_badgeid = settings[i];
					break;
				*/
				// TODO: profile showcases
			}
		}

		self._myProfile('edit', values, function(err, response, body) {
			if (settings.customURL) {
				delete self._profileURL;
			}

			if (!callback) {
				return;
			}

			if (err || response.statusCode != 200) {
				callback(err || new Error('HTTP error ' + response.statusCode));
				return;
			}

			try {
				var json = JSON.parse(body);
				if (!json.success || json.success != 1) {
					callback(new Error(json.errmsg || 'Request was not successful'));
					return;
				}

				callback(null);
			} catch (ex) {
				callback(ex);
			}
		});
	});
};