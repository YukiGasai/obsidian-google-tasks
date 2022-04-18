import { DropdownComponent, Modal, Setting } from "obsidian";
import { customSetting } from "../helper/CustomSettingElement";
import { CreateGoogleTask } from "../googleApi/GoogleCreateTask";
import GoogleTasks from "../GoogleTasksPlugin";
import { getAllTaskLists } from "../googleApi/ListAllTasks";
import { TaskInput } from "../helper/types";

export class CreateTaskModal extends Modal {
	plugin: GoogleTasks;
	taskTitle: string;
	taskDetails: string;
	taskList: string;
	taskDue: string;

	onSubmit: (taskInput: TaskInput) => void;
	constructor(plugin: GoogleTasks) {
		super(plugin.app);
		this.plugin = plugin;
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
			button.setButtonText("Create").onClick(() => {
				this.close();
				const taskInput: TaskInput = {
					title: this.taskTitle,
					details: this.taskDetails,
					due: this.taskDue,
					taskListId: this.taskList,
				};
				CreateGoogleTask(this.plugin, taskInput);
			})
		);
	}
	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
