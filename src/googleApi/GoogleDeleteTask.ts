import { getGoogleAuthToken } from "./GoogleAuth";
import type GoogleTasks from "../GoogleTasksPlugin";
import { createNotice } from "src/helper/NoticeHelper";

export async function DeleteGoogleTask(
	plugin: GoogleTasks,
	selfLink: string,
	showNotice = true
): Promise<boolean> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	try {
		const response = await fetch(selfLink,
			{
				method: "DELETE",
				headers: requestHeaders,
			}
		);
		if (response.status == 204) {
			if (showNotice) {
				createNotice(plugin, "Task updated");
			}
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}
