import ElectronGoogleOAuth2 from "@getstation/electron-google-oauth2";
import GoogleTasks from "./GoogleTasksPlugin";
import {
	settingsAreComplete,
	settingsAreCompleteAndLoggedIn,
} from "./GoogleTasksSettingTab";
import { getAT, getET, getRT, setAT, setET, setRT } from "./LocalStorage";

export async function getGoogleAuthToken(plugin: GoogleTasks): Promise<string> {
	if (!settingsAreCompleteAndLoggedIn(plugin)) return;

	if (getET(plugin) == 0 || getET(plugin) < +new Date()) {
		if (getRT() != "") {
			const refreshBody = {
				client_id: plugin.settings.googleClientId,
				client_secret: plugin.settings.googleClientSecret,
				grant_type: "refresh_token",
				refresh_token: getRT(),
			};
			const response = await fetch(
				"https://oauth2.googleapis.com/token",
				{
					method: "POST",
					body: JSON.stringify(refreshBody),
				}
			);

			const tokenData = await response.json();

			setAT(tokenData.access_token);
			setET(+new Date() + tokenData.expires_in);
		}
	}

	return getAT();
}

export async function LoginGoogle(plugin: GoogleTasks) {
	if (!settingsAreComplete(plugin)) return;

	const myApiOauth = new ElectronGoogleOAuth2(
		plugin.settings.googleClientId,
		plugin.settings.googleClientSecret,
		["https://www.googleapis.com/auth/tasks"],
		{ successRedirectURL: "obsidian://obsidian-google-tasks/" }
	);

	await myApiOauth.openAuthWindowAndGetTokens().then((token) => {
		setAT(token.access_token);
		setRT(token.refresh_token);
		setET(token.expiry_date);
	});
}
