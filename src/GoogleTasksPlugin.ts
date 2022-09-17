import { getRT } from './helper/LocalStorage';
import { Editor, MarkdownView, Plugin, WorkspaceLeaf, moment, Notice } from "obsidian";
import { GoogleTasksSettings } from "./helper/types";
import { getAllUncompletedTasksOrderdByDue } from "./googleApi/ListAllTasks";
import {
	GoogleCompleteTaskById,
	GoogleUnCompleteTaskById,
} from "./googleApi/GoogleCompleteTask";
import { CreateTaskModal } from "./modal/CreateTaskModal";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "./view/GoogleTaskView";
import { TaskListModal } from "./modal/TaskListModal";
import {
	GoogleTasksSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleTasksSettingTab";

const DEFAULT_SETTINGS: GoogleTasksSettings = {
	googleRefreshToken: "",
	googleClientId: "",
	googleClientSecret: "",
	googleApiToken: "",
	askConfirmation: true,
	refreshInterval: 60,
	showNotice: true,
};

export default class GoogleTasks extends Plugin {
	settings: GoogleTasksSettings;
	plugin: Plugin;
	showHidden = false;

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
		this.plugin = this;

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
			if (!(event.target instanceof HTMLInputElement)) {
				return;
			}

			const checkPointElement = event.target as HTMLInputElement;
			if (
				!checkPointElement.classList.contains("task-list-item-checkbox")
			)
				return;

			const idElement = checkPointElement.parentElement.querySelectorAll(
				".cm-comment.cm-list-1"
			)[1] as HTMLElement;
			const taskId = idElement.textContent;

			if (!settingsAreCompleteAndLoggedIn(this, false)) return;

			if (checkPointElement.checked) {
				GoogleCompleteTaskById(this, taskId);
			} else {
				GoogleUnCompleteTaskById(this, taskId);
			}
		});

		const createTodoListModal = async () => {
			const list = await getAllUncompletedTasksOrderdByDue(this);

			new TaskListModal(this, list).open();
		};

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "list-google-tasks",
			name: "List Google Tasks",
			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}
				if (!canRun) {
					return;
				}
				createTodoListModal();
			},
		});

		//Create a new task command
		this.addCommand({
			id: "create-google-task",
			name: "Create Google Tasks",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				new CreateTaskModal(this).open();
			},
		});

		const writeTodoIntoFile = async (editor: Editor) => {
			const tasks = await getAllUncompletedTasksOrderdByDue(this);
			tasks.forEach((task) => {
				let date = "";
				if (task.due) {
					date = moment(task.due).local().format("DD.MM.YYYY");
				} else {
					date = "-----------";
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
		};

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "insert-google-tasks",
			name: "Insert Google Tasks",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView
			): boolean => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				writeTodoIntoFile(editor);
			},
		});


		//Copy Refresh token to clipboard
		this.addCommand({
			id: "copy-google-refresh-token",
			name: "Copy Google Refresh Token to Clipboard",

			callback: () => {
				const token = getRT();
				if(token == undefined || token == ''){
					new Notice("No Refresh Token. Please Login.")
					return;
				}

				navigator.clipboard.writeText(token).then(function() {
					new Notice("Token copied")
				}, function(err) {
					new Notice("Could not copy token")
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
