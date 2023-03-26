import { FuzzySuggestModal, moment } from "obsidian";
import { GoogleCompleteTask } from "../googleApi/GoogleCompleteTask";
import type GoogleTasks from "../GoogleTasksPlugin";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "../view/GoogleTaskView";
import type { Task } from "../helper/types";

export class TaskListModal extends FuzzySuggestModal<Task> {
	plugin: GoogleTasks;
	taskList: Task[];

	constructor(plugin: GoogleTasks, taskList: Task[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.taskList = taskList;
		this.setPlaceholder("Select a task to complete it");
	}

	getItems(): Task[] {
		return this.taskList;
	}

	getItemText(item: Task): string {
		let dateString = "\t\t";
		if (item.due) {
			dateString = moment.utc(item.due).local().format("YYYY-MM-DD");
	
		}
		return `${dateString}` + "\t" + item.title;
	}

	async onChooseItem(item: Task, _: MouseEvent | KeyboardEvent) {
		const gotUpdated = await GoogleCompleteTask(this.plugin, item);
		if (!gotUpdated) return;

		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_GOOGLE_TASK)
			.forEach((leaf) => {
				if (leaf.view instanceof GoogleTaskView) {
					leaf.view.removeTodo(item);
					leaf.view.addDone(item);
					leaf.view.loadTaskView();
				}
			});
	}
}
