import { FuzzySuggestModal } from "obsidian";
import { GoogleCompleteTask } from "./GoogleCompleteTask";
import GoogleTasks from "./GoogleTasksPlugin";
import { Task } from "./types";

export class TaskList extends FuzzySuggestModal<Task> {
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
		return (
			new Date(item.due).valueOf() + "\t" + item.title + "\t" + item.notes
		);
	}

	onChooseItem(item: Task, _: MouseEvent | KeyboardEvent): void {
		GoogleCompleteTask(this.plugin, item);
	}
}
