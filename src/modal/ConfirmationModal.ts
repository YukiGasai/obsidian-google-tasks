import { ButtonComponent, Modal } from "obsidian";
import type GoogleTasks from "../GoogleTasksPlugin";

export class ConfirmationModal extends Modal {
	plugin: GoogleTasks;

	onSubmit: () => void;
	constructor(plugin: GoogleTasks, onSubmit: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
	}
	onOpen() {
		const { contentEl } = this;
		const mainContainer = contentEl.createDiv({
			cls: "googleTaskConfirmContainer",
		});
		mainContainer.createEl("h3", {
			cls: "googleTaskConfirmTitle",
			text: "Are you sure you want to delete this task?",
		});

		mainContainer.createEl("hr");

		const buttonContainer = mainContainer.createDiv({
			cls: "googleTaskConfirmButtonContainer",
		});

		//Negative response
		new ButtonComponent(buttonContainer)
			.setClass("googleTaskConfirmCancel")
			.setButtonText("Cancel")
			.onClick(() => {
				this.close();
			});

		//Positiv response
		new ButtonComponent(buttonContainer)
			.setClass("googleTaskConfirmAccept")
			.setButtonText("Confirm")
			.onClick(() => {
				this.onSubmit();
				this.close();
			});
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
