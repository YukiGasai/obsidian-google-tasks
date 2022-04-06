import {
	ButtonComponent,
	DropdownComponent,
	ItemView,
	Setting,
	WorkspaceLeaf,
} from "obsidian";
import TreeMap from "ts-treemap";
import { ConfirmationModal } from "../modal/ConfirmationModal";
import { CreateTaskModal } from "../modal/CreateTaskModal";
import {
	GoogleCompleteTask,
	GoogleUnCompleteTask,
} from "../googleApi/GoogleCompleteTask";

import { DeleteGoogleTask } from "../googleApi/GoogleDeleteTask";
import GoogleTasks from "../GoogleTasksPlugin";
import { settingsAreCompleteAndLoggedIn } from "./GoogleTasksSettingTab";
import {
	getAllCompletedTasksGroupedByDue,
	getAllTaskLists,
	getAllTasks,
	getAllUncompletedTasksGroupedByDue,
} from "../googleApi/ListAllTasks";
import { Task, TaskList } from "../helper/types";
import { UpdateTaskModal } from "../modal/UpdateTaskModal";

const moment = require("moment");

export const VIEW_TYPE_GOOGLE_TASK = "googleTaskView";

export class GoogleTaskView extends ItemView {
	plugin: GoogleTasks;

	todoTasksGroups: TreeMap<string, Task[]> = new TreeMap();
	doneTasksGroups: TreeMap<string, Task[]> = new TreeMap();

	taskLists: TaskList[];

	showDone: boolean = false;
	showTodo: boolean = true;

	currentListId: string = "000";
	currentListIndex: Number = 0;

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
		} else {
			taskGroup = TreeMap.fromMap(taskGroup);
		}

		taskGroup.forEach((tasks: Task[], dueDate: string) => {
			let dateString = "No due date";

			if (this.currentListId != "000") {
				tasks = tasks.filter((task) => {
					return getListId(task) == this.currentListId;
				});

				if (tasks.length == 0) {
					return;
				}
			}

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

				let timer = 0;
				let startTime = 0;
				let endTime = 0;
				let longpress = false;

				taskContainer.addEventListener("mousedown", () => {
					startTime = new Date().getTime();
				});

				taskContainer.addEventListener("mouseup", () => {
					endTime = new Date().getTime();
					longpress = endTime - startTime < 500 ? false : true;
				});

				taskContainer.addEventListener("click", () => {
					if (longpress) {
						longpress = false;
						new UpdateTaskModal(this.plugin, task).open();
					}
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
						const gotDeleted = await GoogleCompleteTask(
							this.plugin,
							task
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
						const gotRestored = await GoogleUnCompleteTask(
							this.plugin,
							task
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

		const titleContainer = mainContainer.createDiv({
			cls: "googleTaskTitleContainer",
		});

		new Setting(titleContainer).addButton((button) => {
			button.setIcon("plus");
			button.setClass("googleTaskAddButton");
			button.onClick((event) => {
				new CreateTaskModal(this.plugin).open();
			});
		});

		titleContainer
			.createEl("h4", { text: "Google Tasks" })
			.addEventListener("click", () => {
				this.updateFromServer();
			});

		const listDropDown = new Setting(titleContainer);

		listDropDown.addDropdown((dropDown) => {
			let optionList: DropdownComponent[] = [
				dropDown.addOption("000", "Combined"),
			];

			this.taskLists.forEach((taskList) => {
				optionList.push(
					dropDown.addOption(taskList.id, taskList.title)
				);
			});
			dropDown.onChange((selectedId: string) => {
				this.currentListId = selectedId;

				this.loadTaskView();
			});

			dropDown.setValue(this.currentListId);
		});

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
		const gotDeleted: boolean = await DeleteGoogleTask(
			this.plugin,
			task.selfLink
		);

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

	public removeTodo(task: Task) {
		const due = task.due ?? "No due date";

		const ts = this.todoTasksGroups.get(due).find((t) => t.id == task.id);

		this.todoTasksGroups.get(due).remove(ts);
		if (this.todoTasksGroups.get(due).length == 0) {
			this.todoTasksGroups.delete(due);
		}
	}

	public addDone(task: Task) {
		const due = task.due ?? "No due date";
		if (this.doneTasksGroups.has(due)) {
			this.doneTasksGroups.get(due).push(task);
		} else {
			this.doneTasksGroups.set(due, [task]);
		}
	}

	async updateFromServer() {
		if (settingsAreCompleteAndLoggedIn(this.plugin)) {
			this.taskLists = await getAllTaskLists(this.plugin);

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

export function getListId(task: Task): string {
	let selfLink = task.selfLink;

	const startIndex = "https://www.googleapis.com/tasks/v1/lists/".length;

	const endIndex = selfLink.indexOf("/", startIndex);

	return selfLink.substring(startIndex, endIndex);
}
