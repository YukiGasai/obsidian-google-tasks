# Obsidian Google Tasks

Manage your Google Tasks from inside Obsidian

## Features

-   List tasks
-   Create tasks
-   Edit tasks (Will create a new task and delete the old one)
-   Mark es done / todo
-   Delete done tasks

> Working with specific time is not supported by the Google API :(

## Installation

-   Download obsidian-goole-tasks from latest [release](https://github.com/YukiGasai/obsidian-goole-tasks/releases/)
-   Extract zip into `.obsidian/plugins` folder
-   Restart Obsidian
-   Activate inside the obsidian settings page
-   [Create Google Cloud Project](https://console.cloud.google.com/projectcreate?)
-   [Activate Google Tasks API](https://console.cloud.google.com/marketplace/product/google/tasks.googleapis.com?q=search&referrer=search&project=iron-core-327018)
-   [Configuire OAUTH screen](https://console.cloud.google.com/apis/credentials/consent?)
    -   Select Extern
    -   Fill necessary inputs
    -   Add your email as tester if using "@gmail" add gmail and googlemail
-   [Add API Token](https://console.cloud.google.com/apis/credentials)
-   [Add OAUTH client](https://console.cloud.google.com/apis/credentials/oauthclient)
    -   select Webclient
    -   add `http://127.0.0.1:42813` as Javascript origin
    -   add `http://127.0.0.1:42813/callback/` and `http://127.0.0.1:42813/callback/` as redirect URI
-   add the keys into the fields unter the plugin settings
-   Press Login

## Usage

### Google Task View

-   Open view by pressing the checkmark icon in the left sidebar
-   View will open and list your tasks
    -   Complete them by clicking the checkbox
    -   Edit them by long clicking the task
    -   Show and hide the todo and done list by pressing the title texts
    -   Force update the list by pressing on Google Tasks
    -   The list will check for changes in a set intervall (changeable in settings)
    -   Press the plus button to create a new task
    -   Use the dropdown to switch between lists

### Commands

#### List Google Tasks

Shows a list of all un done tasks selcting one will complete the task

#### Create Google Tasks

Will open a popup to create a new task

#### Insert Google Tasks

Will insert a lost of all un done tasks into the current file. Checking the task inside the File will complete / uncomplete it.
