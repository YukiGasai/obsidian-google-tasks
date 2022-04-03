export interface GoogleTasksSettings {
	googleClientId: string;
	googleClientSecret: string;
	googleApiToken: string;
}

export interface TaskList {
	kind: string;
	id: string;
	etag: string;
	title: string;
	updated: string;
	selfLink: string;
}

export interface Task {
	kind: string;
	id: string;
	etag: string;
	title: string;
	updated: string;
	selfLink: string;
	parent: string;
	position: string;
	notes: string;
	status: string;
	due: string;
	completed: string;
	deleted: boolean;
	hidden: boolean;
	links: [
		{
			type: string;
			description: string;
			link: string;
		}
	];
	taskListName?: string;
}

export interface TaskListResponse {
	kind: string;
	etag: string;
	items: TaskList[];
}

export interface TaskResponse {
	kind: string;
	etag: string;
	nextPageToken?: string;
	items: Task[];
}

export interface TaskInput {
	title: string;
	details: string;
	taskListId: string;
	due: string;
}
