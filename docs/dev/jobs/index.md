# JobManager
[⬅️ Go back to dev home](../#readme) <a href="/src/jobs/jobManager.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

## Table Of Contents

- [Introduction](#introduction)
- [JsDocs](#jsDocs)

&nbsp;

<a id="introduction"></a>

# Introduction
The JobManager is a module for managing reoccurring intervals, also called jobs.  
For example, the updater registers a job by default to handle the update check, which runs every 6 hours.  

Jobs are registered at runtime by calling `registerJob(job: Job)`, where job is an object which includes metadata and the function to execute.  
This feature is also available to Plugins, as documented on the [Creating Plugins page](../../wiki/creating_plugins.md#jobmanager).  

The job manager should be used whenever possible to reduce points of failure.  
Do not register intervals yourself, let this do it for you.

Please use your browser's search function <kbd>Ctrl</kbd>+<kbd>F</kbd> to find something specific on this page.

&nbsp;

<a id="jsDocs"></a>

# JsDocs
<a name="JobManager"></a>

## JobManager
**Kind**: global class  

* [JobManager](#JobManager)
    * [new JobManager(controller)](#new_JobManager_new)
    * [.controller](#JobManager+controller) : [<code>Controller</code>](#Controller)
    * [.jobs](#JobManager+jobs) : [<code>Array.&lt;Job&gt;</code>](#Job)
    * [._runDueJobs()](#JobManager+_runDueJobs)
    * [.registerJob(job)](#JobManager+registerJob) ⇒ <code>Error</code> \| <code>null</code>
    * [.unregisterJob(name)](#JobManager+unregisterJob) ⇒ <code>Error</code> \| <code>null</code>

<a name="new_JobManager_new"></a>

### new JobManager(controller)
Constructor - The jobManager handles running and managing interval based functions (jobs), like update checks, cleanups, etc.


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the controller object |

<a name="JobManager+controller"></a>

### jobManager.controller : [<code>Controller</code>](#Controller)
Reference to the controller object

**Kind**: instance property of [<code>JobManager</code>](#JobManager)  
<a name="JobManager+jobs"></a>

### jobManager.jobs : [<code>Array.&lt;Job&gt;</code>](#Job)
Collection of all registered jobs

**Kind**: instance property of [<code>JobManager</code>](#JobManager)  
<a name="JobManager+_runDueJobs"></a>

### jobManager.\_runDueJobs()
Internal: Executes all due jobs.

**Kind**: instance method of [<code>JobManager</code>](#JobManager)  
<a name="JobManager+registerJob"></a>

### jobManager.registerJob(job) ⇒ <code>Error</code> \| <code>null</code>
Registers a job

**Kind**: instance method of [<code>JobManager</code>](#JobManager)  
**Returns**: <code>Error</code> \| <code>null</code> - Returns `null` on success or `err` on failure, specifying the reason why.  

| Param | Type | Description |
| --- | --- | --- |
| job | [<code>Job</code>](#Job) | Object of the job to register |

<a name="JobManager+unregisterJob"></a>

### jobManager.unregisterJob(name) ⇒ <code>Error</code> \| <code>null</code>
Unregisters a job

**Kind**: instance method of [<code>JobManager</code>](#JobManager)  
**Returns**: <code>Error</code> \| <code>null</code> - Returns `null` on success or `err` on failure, specifying the reason why.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the job to unregister |

