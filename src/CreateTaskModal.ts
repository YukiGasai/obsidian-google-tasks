import { DropdownComponent, Modal, Setting } from "obsidian";
import GoogleTasks from "./GoogleTasksPlugin";
import { getAllTaskLists } from "./ListAllTasks";
import { TaskInput } from "./types";

export class CreateTaskModal extends Modal {
	plugin: GoogleTasks;
	taskTitle: string;
	taskDetails: string;
	taskList: string;
	taskDue: string;

	onSubmit: (taskInput: TaskInput) => void;
	constructor(plugin: GoogleTasks, onSubmit: (taskInput: TaskInput) => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
	}
	onOpen() {
		getAllTaskLists(this.plugin).then((taskList) => {
			this.taskList = taskList[0].id;

			const { contentEl } = this;

			contentEl.createEl("h1", { text: "Add a new Taskt" });
			new Setting(contentEl).setName("Title").addText((text) =>
				text.onChange((value) => {
					this.taskTitle = value;
				})
			);

			new Setting(contentEl).setName("Details").addText((text) =>
				text.onChange((value) => {
					this.taskDetails = value;
				})
			);

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

			contentEl.createEl("span", { text: "Due date" });
			const dropDownElement = contentEl.createEl("input", {
				type: "date",
			});

			dropDownElement.addEventListener("input", (event) => {
				this.taskDue = dropDownElement.value;
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
					this.onSubmit(taskInput);
				})
			);
		});
	}
	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
