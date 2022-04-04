import { Editor, MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";

const moment = require("moment");
import { GoogleTasksSettings, Task, TaskInput } from "./types";
import { getAllUncompletedTasksOrderdByDue } from "./ListAllTasks";
import {
	GoogleCompleteTaskById,
	GoogleUnCompleteTaskById,
} from "./GoogleCompleteTask";
import { CreateTaskModal } from "./CreateTaskModal";
import { CreateGoogleTask } from "./GoogleCreateTask";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "./GoogleTaskView";
import { TaskListModal } from "./TaskListModal";
import {
	GoogleTasksSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./GoogleTasksSettingTab";
const DEFAULT_SETTINGS: GoogleTasksSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleApiToken: "",
	askConfirmation: true,
	refreshInterval: 60,
};

export default class GoogleTasks extends Plugin {
	settings: GoogleTasksSettings;
	store: any;

	initView = async () => {
		if (
			this.app.workspace.getLeavesOfType(VIEW_TYPE_GOOGLE_TASK).length ===
			0
		) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_TYPE_GOOGLE_TASK,
			});
		}
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_GOOGLE_TASK).first()
		);
	};

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_GOOGLE_TASK,
			(leaf: WorkspaceLeaf) => new GoogleTaskView(leaf, this)
		);

		this.addRibbonIcon(
			"check-in-circle",
			"Google Tasks",
			(evt: MouseEvent) => {
				this.initView();
			}
		);

		this.registerDomEvent(document, "click", (event) => {
			const checkPointElement = event.target as HTMLInputElement;
			if (
				!checkPointElement.classList.contains("task-list-item-checkbox")
			)
				return;

			const idElement = checkPointElement.parentElement.querySelectorAll(
				".cm-comment.cm-list-1"
			)[1] as HTMLElement;
			const taskId = idElement.textContent;

			if (!settingsAreCompleteAndLoggedIn(this)) return;

			if (checkPointElement.checked) {
				GoogleCompleteTaskById(this, taskId);
			} else {
				GoogleUnCompleteTaskById(this, taskId);
			}
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "list-google-tasks",
			name: "List Google Tasks",

			callback: async () => {
				if (!settingsAreCompleteAndLoggedIn(this)) return;

				const arr: Task[] = await getAllUncompletedTasksOrderdByDue(
					this
				);
				new TaskListModal(this, arr).open();
			},
		});

		//Create a new task command
		this.addCommand({
			id: "create-google-task",
			name: "Create Google Tasks",

			callback: async () => {
				if (!settingsAreCompleteAndLoggedIn(this)) return;

				new CreateTaskModal(this, async (taskInput: TaskInput) => {
					CreateGoogleTask(this, taskInput);
				}).open();
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "insert-google-tasks",
			name: "Insert Google Tasks",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (!settingsAreCompleteAndLoggedIn(this)) return;

				const tasks: Task[] = await getAllUncompletedTasksOrderdByDue(
					this
				);

				tasks.forEach((task) => {
					let date = "";
					if (task.due) {
						date = moment(task.due).format("DD.MM.YYYY");
					} else {
						date = "          ";
					}

					editor.replaceRange(
						"- [ ] " +
							date +
							"  " +
							task.title +
							"  %%" +
							task.id +
							"%%\n",
						editor.getCursor()
					);
				});
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GoogleTasksSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_TASK);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
