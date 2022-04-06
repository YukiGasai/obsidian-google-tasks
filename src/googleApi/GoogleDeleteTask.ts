import { Notice } from "obsidian";
import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleTasks from "../GoogleTasksPlugin";

export async function DeleteGoogleTask(
	plugin: GoogleTasks,
	selfLink: string,
	showNotice: boolean = true
): Promise<boolean> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	try {
		const response = await fetch(
			`${selfLink}?key=${plugin.settings.googleApiToken}`,
			{
				method: "DELETE",
				headers: requestHeaders,
			}
		);
		if (response.status == 204) {
			if (showNotice) new Notice("Task deleted");
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}
