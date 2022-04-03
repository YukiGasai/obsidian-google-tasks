import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

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
import { TaskList } from "./TaskListModal";

// Remember to rename these classes and interfaces!

const DEFAULT_SETTINGS: GoogleTasksSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleApiToken: "",
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
				const arr: Task[] = await getAllUncompletedTasksOrderdByDue(
					this
				);
				new TaskList(this, arr).open();
			},
		});

		//Create a new task command
		this.addCommand({
			id: "create-google-task",
			name: "Create Google Tasks",

			callback: async () => {
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

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);

				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
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

class SampleSettingTab extends PluginSettingTab {
	plugin: GoogleTasks;

	constructor(app: App, plugin: GoogleTasks) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("ClientId")
			.setDesc("Google client id")
			.addText((text) =>
				text
					.setPlaceholder("Enter your client id")
					.setValue(this.plugin.settings.googleClientId)
					.onChange(async (value) => {
						this.plugin.settings.googleClientId = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("ClientSecret")
			.setDesc("Google client secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your client secret")
					.setValue(this.plugin.settings.googleClientSecret)
					.onChange(async (value) => {
						this.plugin.settings.googleClientSecret = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("ApiToken")
			.setDesc("Google Api Token")
			.addText((text) =>
				text
					.setPlaceholder("Enter your api token")
					.setValue(this.plugin.settings.googleApiToken)
					.onChange(async (value) => {
						this.plugin.settings.googleApiToken = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
