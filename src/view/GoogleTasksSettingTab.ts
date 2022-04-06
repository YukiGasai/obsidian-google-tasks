import {
	PluginSettingTab,
	App,
	Setting,
	Notice,
	ButtonComponent,
} from "obsidian";
import { customSetting } from "../helper/CustomSettingElement";
import { LoginGoogle } from "../googleApi/GoogleAuth";
import GoogleTasks from "../GoogleTasksPlugin";
import { GoogleTaskView, VIEW_TYPE_GOOGLE_TASK } from "./GoogleTaskView";
import { getRT, setAT, setET, setRT } from "../helper/LocalStorage";

export class GoogleTasksSettingTab extends PluginSettingTab {
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
		if (getRT()) {
			new Setting(containerEl)
				.setName("Logout")
				.setDesc("Logout off your Google Account")
				.addButton((button: ButtonComponent) => {
					button.setButtonText("Logout");
					button.onClick(async (event) => {
						setRT("");
						setAT("");
						setET(0);
					});
				});
		} else {
			new Setting(containerEl)
				.setName("Login")
				.setDesc("Login to your Google Account")
				.addButton((button: ButtonComponent) => {
					button.setButtonText("Login");
					button.onClick(async (event) => {
						LoginGoogle(this.plugin);
					});
				});
		}

		new Setting(containerEl)
			.setName("Confirmations")
			.setDesc("Ask for confirmations when deleting a task")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.askConfirmation);
				toggle.onChange(async (state) => {
					this.plugin.settings.askConfirmation = state;
					await this.plugin.saveSettings();
				});
			});

		const RefreshIntervalInput = customSetting(
			containerEl,
			"Refresh Interval",
			"Time in seconds between refresh request from google server"
		).createEl("input", {
			type: "number",
		});
		RefreshIntervalInput.value = this.plugin.settings.refreshInterval + "";
		RefreshIntervalInput.min = "10";
		RefreshIntervalInput.step = "1";
		RefreshIntervalInput.addEventListener("input", async () => {
			this.plugin.settings.refreshInterval = parseInt(
				RefreshIntervalInput.value
			);
			this.app.workspace
				.getLeavesOfType(VIEW_TYPE_GOOGLE_TASK)
				.forEach((leaf) => {
					if (leaf.view instanceof GoogleTaskView) {
						leaf.view.setRefreshInterval();
					}
				});
			await this.plugin.saveSettings();
		});
	}
}

export function settingsAreComplete(plugin: GoogleTasks): boolean {
	if (
		plugin.settings.googleApiToken == "" ||
		plugin.settings.googleClientId == "" ||
		plugin.settings.googleClientSecret == ""
	) {
		new Notice("Google Tasks missing settings");
		return false;
	}
	return true;
}

export function settingsAreCompleteAndLoggedIn(plugin: GoogleTasks): boolean {
	if (!settingsAreComplete(plugin) || getRT() == "") {
		new Notice("Google Tasks missing settings or not logged in");
		return false;
	}
	return true;
}
