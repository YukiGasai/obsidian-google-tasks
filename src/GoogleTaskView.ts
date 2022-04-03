import { ItemView, WorkspaceLeaf } from "obsidian";
import TreeMap from "ts-treemap";
import {
	GoogleCompleteTaskById,
	GoogleUnCompleteTaskById,
} from "./GoogleCompleteTask";
import GoogleTasks from "./GoogleTasksPlugin";
import {
	getAllCompletedTasksGroupedByDue,
	getAllUncompletedTasksGroupedByDue,
} from "./ListAllTasks";
import { Task } from "./types";

const moment = require("moment");

export const VIEW_TYPE_GOOGLE_TASK = "googleTaskView";

export class GoogleTaskView extends ItemView {
	plugin: GoogleTasks;

	todoTasksGroups: TreeMap<string, Task[]> = new TreeMap();
	doneTasksGroups: TreeMap<string, Task[]> = new TreeMap();

	showDone: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: GoogleTasks) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_GOOGLE_TASK;
	}

	getDisplayText() {
		return "Google Tasks";
	}

	async displayTaskGroupList(
		_taskGroup: TreeMap<string, Task[]>,
		mainContainer: HTMLDivElement,
		isUnDoneList: boolean
	) {
		const taskGroup = TreeMap.fromMap(
			_taskGroup,
			(b, a) => new Date(a).valueOf() - new Date(b).valueOf()
		);

		taskGroup.forEach((tasks: Task[], dueDate: string) => {
			let dateString = "No due date";

			if (moment(dueDate).isValid()) {
				dateString = moment(dueDate).calendar(null, {
					lastDay: "[Yesterday]",
					sameDay: "[Today]",
					nextDay: "[Tomorrow]",
					lastWeek: "[last] dddd",
					nextWeek: "dddd",
					sameElse: "L",
				});
			}

			mainContainer.createEl("h6", {
				text: dateString,
			});

			tasks.forEach((task) => {
				const due = task.due ?? "No due date";

				const taskContainer = mainContainer.createDiv();
				taskContainer.addClass("googleTaskContainer");

				const checkBox = taskContainer.createEl("input", {
					type: "checkbox",
				});
				if (!isUnDoneList) {
					checkBox.checked = true;
				}
				checkBox.addEventListener("click", async (event) => {
					if (isUnDoneList) {
						const gotDeleted = await GoogleCompleteTaskById(
							this.plugin,
							task.id
						);
						if (!gotDeleted) return;

						//ADD to done list
						if (this.doneTasksGroups.has(due)) {
							this.doneTasksGroups.get(due).push(task);
						} else {
							this.doneTasksGroups.set(due, [task]);
						}

						//Remove from todo list
						this.todoTasksGroups.get(due).remove(task);
						if (this.todoTasksGroups.get(due).length == 0) {
							this.todoTasksGroups.delete(due);
						}

						this.loadTaskView();
					} else {
						const gotRestored = await GoogleUnCompleteTaskById(
							this.plugin,
							task.id
						);
						if (!gotRestored) return;

						//ADD to done list
						if (this.todoTasksGroups.has(due)) {
							this.todoTasksGroups.get(due).push(task);
						} else {
							this.todoTasksGroups.set(due, [task]);
						}

						//Remove from todo list
						this.doneTasksGroups.get(due).remove(task);
						if (this.doneTasksGroups.get(due).length == 0) {
							this.doneTasksGroups.delete(due);
						}

						this.loadTaskView();
					}
				});

				const taskTextContainer = taskContainer.createDiv();
				taskTextContainer.addClass("googleTaskTextContainer");
				taskTextContainer
					.createEl("span", { text: task.title })
					.addClass("googleTaskTitle");
				taskTextContainer
					.createEl("span", { text: task.notes })
					.addClass("googleTaskDetails");
			});
		});
	}

	async loadTaskView() {
		const container = this.containerEl.children[1];

		container.empty();

		const mainContainer = container.createDiv();
		mainContainer.addClass("googleTaskMainContainer");
		mainContainer.createEl("h4", { text: "Google Tasks" });
		mainContainer.createEl("hr");

		mainContainer.createEl("h5", {
			text: "Todo",
		});
		mainContainer.createEl("hr");

		const todoContainer = mainContainer.createDiv();
		todoContainer.addClass("googleTaskTodoContainer");
		this.displayTaskGroupList(this.todoTasksGroups, todoContainer, true);

		mainContainer
			.createEl("h5", {
				text: "Done",
			})
			.addEventListener("click", async () => {
				this.showDone = !this.showDone;

				if (this.showDone) {
					doneContainer.removeClass("googleTaskForceShow");
				} else {
					doneContainer.addClass("googleTaskForceShow");
				}
			});
		mainContainer.createEl("hr");

		const doneContainer = mainContainer.createDiv();
		doneContainer.addClass("googleTaskDoneContainer");
		if (this.showDone) {
			doneContainer.removeClass("googleTaskForceShow");
		} else {
			doneContainer.addClass("googleTaskForceShow");
		}
		this.displayTaskGroupList(this.doneTasksGroups, doneContainer, false);
	}

	async onOpen() {
		this.todoTasksGroups = await getAllUncompletedTasksGroupedByDue(
			this.plugin
		);

		this.doneTasksGroups = await getAllCompletedTasksGroupedByDue(
			this.plugin
		);
		this.loadTaskView();
	}

	async onClose() {}
}
