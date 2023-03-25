import { Editor, Modal } from "obsidian";
import TaskSelectionComp from "../svelte/TaskSelectionComp.svelte";
import type GoogleTasks from "../GoogleTasksPlugin";
import type { Task } from "../helper/types";
import { taskToList } from "../helper/TaskToList";

export class SelectInsertTaskModal extends Modal {
	plugin: GoogleTasks;
    editor: Editor;

	constructor(plugin: GoogleTasks, editor: Editor) {
		super(plugin.app);
		this.plugin = plugin;
        this.editor = editor;
	}
    async onOpen(): Promise<void> {
        const { contentEl } = this;
        new TaskSelectionComp({
            target: contentEl,
            props: {
                plugin: this.plugin,
                selectInsertTaskModal: this,
                onSubmit: this.onSubmit,
            }
        });
    }

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}


    onSubmit(tasks: Task[], selectInsertTaskModal: SelectInsertTaskModal ):void {
        tasks.forEach((task) => {
            selectInsertTaskModal.editor.replaceRange(
                taskToList(task),
                selectInsertTaskModal.editor.getCursor()
            );
        });

        selectInsertTaskModal.close();
    };
}
