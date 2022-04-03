import { Notice } from "obsidian";
import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleTasks from "./GoogleTasksPlugin";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "./GoogleTaskView";
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

			const task = await response.json();

			plugin.app.workspace
				.getLeavesOfType(VIEW_TYPE_GOOGLE_TASK)
				.forEach((leaf) => {
					if (leaf.view instanceof GoogleTaskView) {
						leaf.view.addTodo(task);
						leaf.view.loadTaskView();
					}
				});
		}
	} catch (error) {
		console.error(error);
	}
}
