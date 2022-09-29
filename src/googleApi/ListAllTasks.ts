/* eslint-disable @typescript-eslint/no-var-requires */
const request = require('request');
const util = require('util')

const requestPromise = util.promisify(request);

import TreeMap from "ts-treemap";
import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleTasks from "../GoogleTasksPlugin";
import {
	Task,
	TaskList,
	TaskListResponse,
	TaskResponse,
} from "../helper/types";

export async function getOneTaskById(
	plugin: GoogleTasks,
	taskId: string
): Promise<Task> {
	const taskLists = await getAllTaskLists(plugin);

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	for (let i = 0; i < taskLists.length; i++) {
		try {
			const response = await fetch(
				`https://tasks.googleapis.com/tasks/v1/lists/${taskLists[i].id}/tasks/${taskId}?key=${plugin.settings.googleApiToken}`,
				{
					method: "GET",
					headers: requestHeaders,
				}
			);
			if (response.status == 200) {
				const task: Task = await response.json();
				if(task.due){
					task.due = window.moment(task.due).add(12, "hour").toISOString();
				}
				return task;
			}
		} catch (error) {
			console.error(error);
		}
	}
}

/**
 * Get all tasklists from account
 */
export async function getAllTaskLists(
	plugin: GoogleTasks
): Promise<TaskList[]> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	try {
		const response = await fetch(
			`https://tasks.googleapis.com/tasks/v1/users/@me/lists?key=${plugin.settings.googleApiToken}`,
			{
				method: "GET",
				headers: requestHeaders,
				redirect: "follow",
			}
		);

		const allTaskListsData: TaskListResponse = await response.json();

		return allTaskListsData.items;
	} catch (error) {
		console.error(error);
		return [];
	}
}

/**
 * Return all tasks from a tasklist
 */
export async function getAllTasksFromList(
	plugin: GoogleTasks,
	taskListId: string
): Promise<Task[]> {

	try {
		let resultTaskList: Task[] = [];
		let allTasksData: TaskResponse = undefined;

		do {
			let url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?`;
			url += "maxResults=100";
			url += "&showCompleted=true";
			url += "&showDeleted=false";
			if(plugin.showHidden){		
				url += "&showHidden=true";
			}
			url += `&key=${plugin.settings.googleApiToken}`;

			if (allTasksData != undefined) {
				url += `&pageToken=${allTasksData.nextPageToken}`;
			}

			const response = await requestPromise({
				'method': 'GET',
				'url': url,
				'headers': {
					'Authorization': `Bearer ${(await getGoogleAuthToken(plugin))}`
				}
			});

			allTasksData = JSON.parse(response.body);
	
			if (allTasksData.items && allTasksData.items.length) {
				resultTaskList = [...resultTaskList, ...allTasksData.items];
			}
			
		} while (allTasksData.nextPageToken);

		resultTaskList.forEach((task:Task) => {
			if(task.due){
				task.due = window.moment(task.due).add(12, "hour").toISOString();
			}
			task.children = resultTaskList.filter((foundTask:Task)=>foundTask.parent == task.id)
			if(task.children.length){
				task.children.sort((a:Task, b:Task)=> parseInt(a.position) - parseInt(b.position))
			}
		});

		resultTaskList = resultTaskList.filter(tasks => !tasks.parent);


		return resultTaskList;
	} catch (error) {
		console.error(error);
		return [];
	}
}

/**
 * Get all tasklists from account
 */
export async function getAllTasks(plugin: GoogleTasks): Promise<Task[]> {
	let resultTasks: Task[] = [];

	const taskLists = await getAllTaskLists(plugin);

	for (let i = 0; i < taskLists.length; i++) {
		const tasks: Task[] = await getAllTasksFromList(
			plugin,
			taskLists[i].id
		);

		tasks.forEach((task) => {
			task.taskListName = taskLists[i].title;
		});

		resultTasks = [...resultTasks, ...tasks];
	}
	
	return resultTasks;
}

/**
 * Get all not completed and oerdert by due date
 */
export async function getAllUncompletedTasksOrderdByDue(
	plugin: GoogleTasks
): Promise<Task[]> {
	let tasks: Task[] = await getAllTasks(plugin);

	tasks = tasks.filter((task) => !task.completed);

	const unTimedTasks = tasks.filter((task) => !task.due);
	tasks = tasks.filter((task) => task.due);

	tasks = tasks.sort((taskA, taskB) => {
		return new Date(taskA.due).valueOf() - new Date(taskB.due).valueOf();
	});

	return [...tasks, ...unTimedTasks];
}

export const groupBy = function groupByArray(
	taskList: Task[]
): TreeMap<string, Task[]> {
	const resultMap = new TreeMap<string, Task[]>();

	taskList.forEach((task) => {
		if (resultMap.has(task.due)) {
			resultMap.get(task.due).push(task);
		} else {
			resultMap.set(task.due, [task]);
		}
	});

	return resultMap;
};

/**
 * Get all nots completed and grouped by due date
 */

export async function getAllUncompletedTasksGroupedByDue(
	plugin: GoogleTasks,
): Promise<TreeMap<string, Task[]>> {
	let tasks = await getAllTasks(plugin);

	tasks = tasks.filter((task) => !task.completed);

	const unTimedTasks = tasks.filter((task) => !task.due);
	tasks = tasks.filter((task) => task.due);

	tasks = tasks.sort((taskA, taskB) => {
		return new Date(taskA.due).valueOf() - new Date(taskB.due).valueOf();
	});

	const resultMap = groupBy(tasks);

	resultMap.set("No due date", unTimedTasks);
	return resultMap;
}

/**
 * Get all nots completed and grouped by due date
 */
export async function getAllCompletedTasksGroupedByDue(
	plugin: GoogleTasks,
): Promise<TreeMap<string, Task[]>> {
	let tasks = await getAllTasks(plugin);

	tasks = tasks.filter((task) => task.completed);

	const unTimedTasks = tasks.filter((task) => !task.due);
	tasks = tasks.filter((task) => task.due);

	tasks = tasks.sort((taskA, taskB) => {
		return new Date(taskA.due).valueOf() - new Date(taskB.due).valueOf();
	});

	const resultMap = groupBy(tasks);

	resultMap.set("No due date", unTimedTasks);
	return resultMap;
}
