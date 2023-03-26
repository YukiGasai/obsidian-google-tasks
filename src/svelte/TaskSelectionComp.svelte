<script lang="ts">
	import type { Task, TaskList } from "../helper/types";
	import type GoogleTasks from "../GoogleTasksPlugin";
	import { onMount } from "svelte";
	import { getAllTasks } from "../googleApi/ListAllTasks";
	import type { SelectInsertTaskModal } from "../modal/SelectInsertTaskModal";
	import { moment } from "obsidian";



    export let plugin:GoogleTasks;
    export let onSubmit: (tasks, SelectInsertTaskModal) => void;
    export let selectInsertTaskModal: SelectInsertTaskModal;

    let startDate = null;
    let endDate = null;

    let allowCompletedTasks: string = "notCompleted";
    let tasks: [Task, boolean][] = [];
    let taskLists: [string, boolean][] = [];

    onMount(async () => {
        tasks = (await getAllTasks(plugin, startDate, endDate)).map((task) => [task, !task.completed]);
        taskLists = getTaskLists(tasks).map((taskList) => [taskList, true]);
    });

    function getTaskLists(tasks:[Task, boolean][] ): string[] {
        const result: string[] = [];

        for (const [task, selected] of tasks) {
            if (!result.contains(task.taskListName)) {
                result.push(task.taskListName);
            }
        }

        return result;
    }

    async function updateStartDate(event: Event) {
        startDate = window.moment((event.target as HTMLInputElement).value);
        tasks = (await getAllTasks(plugin, startDate, endDate)).map((task) => [task, true]);
    }

    async function updateEndDate(event: Event) {
        endDate = window.moment((event.target as HTMLInputElement).value);
        tasks = (await getAllTasks(plugin, startDate, endDate)).map((task) => [task, true]);
    }

    function changedTaskLists (e) {
        console.log(e)
        tasks = tasks.map(([task, selected]) => {

            if (task.taskListName !== e.target.name) {
                return [task, selected];
            }

            return [task, e.target.checked]
            
        });
    }


    function updateCompletedFilter() {
        tasks = tasks.map(([task, selected]) => {
            if (allowCompletedTasks == "all") {
                return [task, true];
            } else if (allowCompletedTasks == "completed") {
                return [task, task.status === "completed"];
            } else if (allowCompletedTasks == "notCompleted") {
                return [task, task.status !== "completed"];
            }
        });
    }

</script>
<div>
    <h1>Task Selection</h1>
        
    <button on:click={()=>onSubmit(tasks.map(([task, selected]) => {

        if(!selected) {
            return null;
        }
        return task;

    }).filter(task => task !== null), selectInsertTaskModal)}
    >Insert selected Tasks</button>

    <h3>Date Range</h3>
    <label for="startDate">
        Start Date
        <input type="date" name="startDate" value={startDate?.format("YYYY-MM-DD") ?? ""} on:change={updateStartDate}>
    </label>
    <label for="endDate">
        End Date
        <input type="date" name="endDate" value={endDate?.format("YYYY-MM-DD") ?? ""}  on:change={updateEndDate}>
    </label>
    <select name="" id="" bind:value={allowCompletedTasks} on:change={updateCompletedFilter}>
        <option value="all">All</option>
        <option value="completed">Completed</option>
        <option value="notCompleted">Not Completed</option>
    </select>
    <h3>Lists</h3>
    {#each taskLists as [taskList, selected]}
        <div>
            <input type="checkbox" name="{taskList}" bind:checked={selected} on:change={changedTaskLists}>
            <label for="taskList">{taskList}</label>
        </div>
    {/each}

    <h3>Tasks</h3>
    {#each tasks as [task, selected]}
        <div>
            <input type="checkbox" name="task" id="" bind:checked={selected}>
            <label for="task">{task.title}</label>
        </div>
    {/each}

</div>

<style>

</style>