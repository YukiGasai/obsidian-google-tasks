import {
	ButtonComponent,
	ItemView,
	Modal,
	Setting,
	WorkspaceLeaf,
} from "obsidian";
import TreeMap from "ts-treemap";
import { ConfirmationModal } from "./ConfirmationModal";
import {
	GoogleCompleteTaskById,
	GoogleUnCompleteTaskById,
} from "./GoogleCompleteTask";
import { DeleteGoogleTask } from "./GoogleDeleteTask";
import GoogleTasks from "./GoogleTasksPlugin";
import { settingsAreCompleteAndLoggedIn } from "./GoogleTasksSettingTab";
import {
	getAllCompletedTasksGroupedByDue,
	getAllTasks,
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
	showTodo: boolean = true;

	intervalId: number;

	constructor(leaf: WorkspaceLeaf, plugin: GoogleTasks) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_GOOGLE_TASK;
	}

	getIcon(): string {
		return "check-in-circle";
	}

	getDisplayText() {
		return "Google Tasks";
	}

	async displayTaskGroupList(
		taskGroup: TreeMap<string, Task[]>,
		mainContainer: HTMLDivElement,
		isUnDoneList: boolean
	) {
		if (!isUnDoneList) {
			taskGroup = TreeMap.fromMap(
				taskGroup,
				(a, b) => new Date(b).getTime() - new Date(a).getTime()
			);
		}

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

				const taskContainer = mainContainer.createDiv({
					cls: "googleTaskContainer",
				});

				if (!isUnDoneList) {
					const trashElement = new ButtonComponent(taskContainer);
					trashElement.setClass("googleTaskTrash");
					trashElement.setIcon("cross");
					trashElement.onClick(() => {
						if (this.plugin.settings.askConfirmation) {
							new ConfirmationModal(this.plugin, async () =>
								this.deleteTask(task)
							).open();
						} else {
							this.deleteTask(task);
						}
					});
				}

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

						//ADD to todo list
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

				const taskTextContainer = taskContainer.createDiv({
					cls: "googleTaskTextContainer",
				});

				taskTextContainer.createEl("span", {
					cls: "googleTaskTitle",
					text: task.title,
				});

				if (due != "No due date" && isUnDoneList) {
					if (moment(due).isBefore()) {
						taskTextContainer.addClass("googleTaskOverDue");
					}
				}

				taskTextContainer.createEl("span", {
					cls: "googleTaskDetails",
					text: task.notes,
				});
			});
		});
	}

	public async loadTaskView() {
		const container = this.containerEl.children[1];

		container.empty();

		const mainContainer = container.createDiv({
			cls: "googleTaskMainContainer",
		});

		mainContainer.createEl("h4", { text: "Google Tasks" });
		mainContainer.createEl("hr");

		mainContainer
			.createEl("h5", {
				text: "Todo",
			})
			.addEventListener("click", async () => {
				this.showTodo = !this.showTodo;

				if (this.showTodo) {
					todoContainer.addClass("googleTaskForceShow");
				} else {
					todoContainer.removeClass("googleTaskForceShow");
				}
			});
		mainContainer.createEl("hr");

		const todoContainer = mainContainer.createDiv({
			cls: "googleTaskTodoContainer",
		});

		this.displayTaskGroupList(this.todoTasksGroups, todoContainer, true);

		mainContainer
			.createEl("h5", {
				text: "Done",
			})
			.addEventListener("click", async () => {
				this.showDone = !this.showDone;

				if (this.showDone) {
					doneContainer.addClass("googleTaskForceShow");
				} else {
					doneContainer.removeClass("googleTaskForceShow");
				}
			});
		mainContainer.createEl("hr");

		const doneContainer = mainContainer.createDiv({
			cls: "googleTaskDoneContainer",
		});

		if (this.showDone) {
			doneContainer.addClass("googleTaskForceShow");
		} else {
			doneContainer.removeClass("googleTaskForceShow");
		}

		if (this.showTodo) {
			todoContainer.addClass("googleTaskForceShow");
		} else {
			todoContainer.removeClass("googleTaskForceShow");
		}
		this.displayTaskGroupList(this.doneTasksGroups, doneContainer, false);
	}

	async deleteTask(task: Task) {
		const due = task.due ?? "No due date";
		const gotDeleted: boolean = await DeleteGoogleTask(this.plugin, task);

		if (gotDeleted) {
			this.doneTasksGroups.get(due).remove(task);
			if (this.doneTasksGroups.get(due).length == 0) {
				this.doneTasksGroups.delete(due);
			}

			this.loadTaskView();
		}
	}

	public setRefreshInterval() {
		if (this.intervalId) {
			window.clearInterval(this.intervalId);
		}
		this.registerInterval(
			(this.intervalId = window.setInterval(
				() => this.updateFromServer(),
				this.plugin.settings.refreshInterval * 1000
			))
		);
	}

	async onOpen() {
		this.updateFromServer();
		this.setRefreshInterval();
	}

	public addTodo(task: Task) {
		const due = task.due ?? "No due date";
		if (this.todoTasksGroups.has(due)) {
			this.todoTasksGroups.get(due).push(task);
		} else {
			this.todoTasksGroups.set(due, [task]);
		}
	}

	async updateFromServer() {
		console.log(new Date().getTime());
		if (settingsAreCompleteAndLoggedIn(this.plugin)) {
			const unFilteredList = await getAllTasks(this.plugin);

			this.todoTasksGroups = await getAllUncompletedTasksGroupedByDue(
				this.plugin,
				unFilteredList
			);

			this.doneTasksGroups = await getAllCompletedTasksGroupedByDue(
				this.plugin,
				unFilteredList
			);

			this.loadTaskView();
		} else {
			const container = this.containerEl.children[1];

			container.empty();

			container.createEl("h4", { text: "Google Tasks" });
			container.createEl("hr");

			container.createEl("h5", {
				text: "Missing settings",
			});
		}
	}

	async onClose() {}
}
