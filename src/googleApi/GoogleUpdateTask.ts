import type GoogleTasksPlugin from "src/GoogleTasksPlugin";

import { createNotice } from "src/helper/NoticeHelper";
import type { Task } from "src/helper/types";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "src/view/GoogleTaskView";

import { getGoogleAuthToken } from "./GoogleAuth";

export async function UpdateGoogleTask(
	plugin: GoogleTasksPlugin,
	task: Task
): Promise<boolean> {

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");


	try {
		const response = await fetch(
			`${task.selfLink}`,
			{
				method: "PATCH",
				headers: requestHeaders,
				body: JSON.stringify({
                    "title":task.title,
                    "notes": task.notes ?? "",
                    "due": task.due,
                    "updated": new Date().toDateString()
                }),
			}
		);

        if (response.status == 200) {
            createNotice(plugin, "Task updated");
            await response.json();
    
            plugin.app.workspace
                .getLeavesOfType(VIEW_TYPE_GOOGLE_TASK)
                .forEach((leaf) => {
                    if (leaf.view instanceof GoogleTaskView) {
                        leaf.view.onOpen();
                    }
                });
        }
        
	} catch (error) {
        console.log(error)
		createNotice(plugin, "Could not update task");
		return false;
	}



	return true;
}
