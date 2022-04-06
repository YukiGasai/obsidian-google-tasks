const moment = require("moment");
import { DropdownComponent, Modal, Setting } from "obsidian";
import { customSetting } from "../helper/CustomSettingElement";
import GoogleTasks from "../GoogleTasksPlugin";
import { getListId } from "../view/GoogleTaskView";
import { getAllTaskLists } from "../googleApi/ListAllTasks";
import { Task, TaskInput } from "../helper/types";

export class UpdateTaskModal extends Modal {
	plugin: GoogleTasks;
	oldTask: Task;
	newTask: Task;

	onSubmit: (newTask: Task) => void;
	constructor(
		plugin: GoogleTasks,
		onSubmit: (newTask: Task) => void,
		task: Task
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		this.oldTask = task;
	}
	onOpen() {
		getAllTaskLists(this.plugin).then((taskList) => {
			const { contentEl } = this;

			this.newTask = this.oldTask;

			contentEl.createEl("h1", { text: "Edit Task" });

			new Setting(contentEl)
				.setName("Title")

				.addText((text) => {
					text.onChange((value) => {
						this.newTask.title = value;
					});
					text.setValue(this.oldTask.title);
					text.inputEl.focus();
				});

			new Setting(contentEl).setName("Details").addText((text) => {
				text.onChange((value) => {
					this.newTask.notes = value;
				});
				text.setValue(this.oldTask.notes);
			});

			const dateSelectElement = customSetting(
				contentEl,
				"Due date",
				""
			).createEl("input", {
				type: "date",
			});

			dateSelectElement.addEventListener("input", (event) => {
				this.newTask.due = dateSelectElement.value;
			});

			if (this.oldTask.due) {
				dateSelectElement.value = moment(this.oldTask.due).format(
					"YYYY-MM-DD"
				);
			}

			const dropDown = new Setting(contentEl);

			dropDown.setName("Categorie");
			dropDown.addDropdown((text: DropdownComponent) => {
				text.onChange((value) => {
					this.newTask.parent = value;
				});

				for (let i = 0; i < taskList.length; i++) {
					text.addOption(taskList[i].id, taskList[i].title);
				}

				text.setValue(getListId(this.oldTask));

				return text;
			});

			new Setting(contentEl).addButton((button) =>
				button.setButtonText("Update").onClick(() => {
					this.close();

					this.onSubmit(this.newTask);
				})
			);
		});
	}
	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
