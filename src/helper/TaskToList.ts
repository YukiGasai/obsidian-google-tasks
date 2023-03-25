import type { Task } from 'src/helper/types';

export const taskToList = (task: Task): string => {
    let date = "-----------";
    if (task.due) {
        date = window.moment.utc(task.due).local().format("YYYY-MM-DD");
    }
	return `- [${task.status=="completed"? "x": " "}] ${date} ${task.title}  %%${task.id}%%\n`;
}