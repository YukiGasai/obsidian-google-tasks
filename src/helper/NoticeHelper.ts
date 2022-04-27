import { Notice } from "obsidian";
import GoogleTasks from "src/GoogleTasksPlugin";

export function createNotice(
	plugin: GoogleTasks,
	text: string,
	showNotice: boolean = true
) {
	if (plugin.settings.showNotice && showNotice) {
		new Notice(text);
	}
}
