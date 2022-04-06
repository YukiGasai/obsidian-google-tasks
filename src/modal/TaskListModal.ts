import { FuzzySuggestModal } from "obsidian";
import { GoogleCompleteTask } from "../googleApi/GoogleCompleteTask";
import GoogleTasks from "../GoogleTasksPlugin";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "../view/GoogleTaskView";
import { Task } from "../helper/types";

const moment = require("moment");

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
			dateString = moment(item.due).format("DD.MM.YYYY");
		}
		return `${dateString}` + "\t" + item.title;
	}

	onChooseItem(item: Task, _: MouseEvent | KeyboardEvent): void {
		GoogleCompleteTask(this.plugin, item).then((gotUpdated) => {
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
		});
	}
}
