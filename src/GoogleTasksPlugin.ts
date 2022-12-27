import { getRT } from './helper/LocalStorage';
import { Editor, MarkdownView, Plugin, WorkspaceLeaf, moment, Notice, TFile } from "obsidian";
import { GoogleTasksSettings } from "./helper/types";
import { getAllUncompletedTasksOrderdByDue, getOneTaskById } from "./googleApi/ListAllTasks";
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
import { normalize } from 'path';
import { taskToList } from './helper/TaskToList';

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
	plugin: GoogleTasks;
	showHidden = false;
	openEvent: null;
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

	onLayoutReady = async() => {
		

		this.app.workspace.on("file-open", async (file:TFile) => {
			if ( !file || file.extension !== "md") return;
			let content = await this.app.vault.adapter.read(normalize(file.path));
			if(!content.match("%%")) {
				return;
			}
		
			const matches = [...content.matchAll(/\- \[[ xX]\] .* %%[A-Za-z0-9]{22}%%/g)]
			let updated = false;
			for(let match of matches) {
				let line = match[0];
				const id = match[0].match(/%%[A-Za-z0-9]{22}%%/)[0].substring(2).slice(0,-2);
				try{
					console.log(match)
					const task = await getOneTaskById(this,id);
					if(task.status === "completed") {
						
						const indexOfX = line.indexOf("- [ ]")
					
						if(indexOfX > -1){
							line = line.replace("- [ ] ", "- [x] ")
						}
						
					}else {
						const indexOfX = line.indexOf("- [x] ")
						if(indexOfX > -1){
							line = line.replace("- [x] ", "- [ ] ")
						}
					}
				}catch(err){
					console.log(err);
					return;
				}
				
				content = content.replace(match[0], line);
				updated = true;
			}
			if(updated) {
				await this.app.vault.adapter.write(normalize(file.path), content);
			}
		})
	}

	async onload() {
		await this.loadSettings();
		this.plugin = this;
		this.app.workspace.onLayoutReady(this.onLayoutReady);

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

			const idElement = checkPointElement.parentElement.parentElement.querySelectorAll(
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
				const canRun = settingsAreCompleteAndLoggedIn(this.plugin, false);

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

		//Create a new task command
		this.addCommand({
			id: "create-google-task-with-insert",
			name: "Create Google Tasks and insert it",
			editorCheckCallback: (checking, editor, view): boolean => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				new CreateTaskModal(this, editor).open();
			}
		});

		const writeTodoIntoFile = async (editor: Editor) => {
			const tasks = await getAllUncompletedTasksOrderdByDue(this);
			tasks.forEach((task) => {
				editor.replaceRange(
					taskToList(task),
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
		this.app.vault.offref(this.openEvent);
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
