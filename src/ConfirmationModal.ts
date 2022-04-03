import { ButtonComponent, Modal } from "obsidian";
import GoogleTasks from "./GoogleTasksPlugin";

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

		const CancelButton = new ButtonComponent(buttonContainer);
		CancelButton.setClass("googleTaskConfirmCancel");
		CancelButton.setButtonText("Cancel");
		CancelButton.onClick(() => {
			this.close();
		});

		const AcceptButton = new ButtonComponent(buttonContainer);
		AcceptButton.setClass("googleTaskConfirmAccept");
		AcceptButton.setButtonText("Confirm");
		AcceptButton.onClick(() => {
			this.onSubmit();
			this.close();
		});
	}
	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
