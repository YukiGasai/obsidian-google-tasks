import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleTasksPlugin from "../GoogleTasksPlugin";
import { getOneTaskById } from "./ListAllTasks";
import { Task } from "../helper/types";
import { createNotice } from "src/helper/NoticeHelper";

//=======================================
//Complete the tasks
//=======================================

export async function GoogleCompleteTask(
	plugin: GoogleTasksPlugin,
	task: Task
): Promise<boolean> {

	task.children.forEach(subTask => GoogleCompleteTask(plugin,subTask))

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	task.status = "completed";
	task.completed = new Date().toISOString();
	delete task.taskListName;

	try {
		const response = await fetch(
			`${task.selfLink}?key=${plugin.settings.googleApiToken}`,
			{
				method: "PUT",
				headers: requestHeaders,
				body: JSON.stringify(task),
			}
		);
		await response.json();
	} catch (error) {
		createNotice(plugin, "Could not complete task");
		return false;
	}
	return true;
}

export async function GoogleCompleteTaskById(
	plugin: GoogleTasksPlugin,
	taskId: string
): Promise<boolean> {
	const task = await getOneTaskById(plugin, taskId);
	return await GoogleCompleteTask(plugin, task);
}

//=======================================
//Uncomplete the tasks
//=======================================

export async function GoogleUnCompleteTask(
	plugin: GoogleTasksPlugin,
	task: Task
): Promise<boolean> {

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	task.status = "needsAction";
	delete task.completed;
	delete task.taskListName;

	try {
		const response = await fetch(
			`${task.selfLink}?key=${plugin.settings.googleApiToken}`,
			{
				method: "PUT",
				headers: requestHeaders,
				body: JSON.stringify(task),
			}
		);
		await response.json();
	} catch (error) {
		createNotice(plugin, "Could not complete task");
		return false;
	}

	task.children.forEach(subTask => GoogleUnCompleteTask(plugin,subTask))

	return true;
}

export async function GoogleUnCompleteTaskById(
	plugin: GoogleTasksPlugin,
	taskId: string
): Promise<boolean> {
	const task = await getOneTaskById(plugin, taskId);
	return await GoogleUnCompleteTask(plugin, task);
}
