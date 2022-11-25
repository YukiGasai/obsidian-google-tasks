import { DropdownComponent, Editor, Modal, Setting } from "obsidian";
import { customSetting } from "../helper/CustomSettingElement";
import { CreateGoogleTask } from "../googleApi/GoogleCreateTask";
import GoogleTasks from "../GoogleTasksPlugin";
import { getAllTaskLists } from "../googleApi/ListAllTasks";
import { Task, TaskInput } from "../helper/types";
import { taskToList } from "src/helper/TaskToList";

export class CreateTaskModal extends Modal {
	plugin: GoogleTasks;
	editor: Editor;
	taskTitle: string;
	taskDetails: string;
	taskList: string;
	taskDue: string;
	createdTask: Task;

	onSubmit: (taskInput: TaskInput) => void;
	constructor(plugin: GoogleTasks, editor: Editor = null) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor
	}
	async onOpen() {
		const taskList = await getAllTaskLists(this.plugin);
		this.taskList = taskList[0].id;

		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Add a new Task" });
		new Setting(contentEl)
			.setName("Title")
			.addText((text) =>
				text.onChange((value) => {
					this.taskTitle = value;
				})
			)
			.settingEl.querySelector("input")
			.focus();

		new Setting(contentEl).setName("Details").addText((text) =>
			text.onChange((value) => {
				this.taskDetails = value;
			})
		);

		const dateSelectElement = customSetting(
			contentEl,
			"Due date",
			""
		).createEl("input", {
			type: "date",
		});

		dateSelectElement.addEventListener("input", (event) => {
			this.taskDue = dateSelectElement.value;
		});

		const dropDown = new Setting(contentEl);

		dropDown.setName("Categorie");
		dropDown.addDropdown((text: DropdownComponent) => {
			text.onChange((value) => {
				this.taskList = value;
			});

			for (let i = 0; i < taskList.length; i++) {
				text.addOption(taskList[i].id, taskList[i].title);
			}

			return text;
		});

		new Setting(contentEl).addButton((button) =>
			button.setButtonText("Create").onClick(async() => {
				const taskInput: TaskInput = {
					title: this.taskTitle,
					details: this.taskDetails,
					due: this.taskDue,
					taskListId: this.taskList,
				};
				this.createdTask = await CreateGoogleTask(this.plugin, taskInput);
				this.close();
			})
		);
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();

		if(this.editor){
			const cursor = this.editor.getCursor();
			this.editor.setLine(cursor.line, taskToList(this.createdTask) )
		}

	}
}
