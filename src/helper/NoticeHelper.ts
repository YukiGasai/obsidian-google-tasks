import { Notice } from "obsidian";
import type GoogleTasks from "src/GoogleTasksPlugin";

export function createNotice(
	plugin: GoogleTasks,
	text: string,
	showNotice = true
) {
	

	if (plugin.settings.showNotice && showNotice) {
		new Notice(text);
	}
}
