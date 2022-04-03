const moment = require("moment");

import { Notice } from "obsidian";
import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleTasks from "./GoogleTasksPlugin";
import { TaskInput } from "./types";

export async function CreateGoogleTask(
	plugin: GoogleTasks,
	taskInput: TaskInput
) {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	const createBody = {
		title: taskInput.title,
		notes: taskInput.details,
		due: taskInput.due,
	};

	if (taskInput.due) {
		createBody.due = new Date(taskInput.due).toISOString();
	}
	try {
		const response = await fetch(
			`https://tasks.googleapis.com/tasks/v1/lists/${taskInput.taskListId}/tasks?key=${plugin.settings.googleApiToken}`,
			{
				method: "POST",
				headers: requestHeaders,
				body: JSON.stringify(createBody),
			}
		);
		if (response.status == 200) {
			new Notice("New task created");
		}
	} catch (error) {
		console.error("Couldn't read tasklist from Server");
	}
}
