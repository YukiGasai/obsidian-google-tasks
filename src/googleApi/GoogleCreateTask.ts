import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleTasks from "../GoogleTasksPlugin";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "../view/GoogleTaskView";
import { Task, TaskInput } from "../helper/types";
import { createNotice } from "src/helper/NoticeHelper";

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
			createNotice(plugin, "New task created");

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

export async function CreateGoogleTaskFromOldTask(
	plugin: GoogleTasks,
	newTask: Task
) {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	const listId = newTask.parent;
	delete newTask.parent;

	if (newTask.due) {
		newTask.due = new Date(newTask.due).toISOString();
	}

	try {
		const response = await fetch(
			`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?key=${plugin.settings.googleApiToken}`,
			{
				method: "POST",
				headers: requestHeaders,
				body: JSON.stringify(newTask),
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
		console.error(error);
	}
}
