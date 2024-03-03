# JobManager
[⬅️ Go back to dev home](../#readme) <a href="/src/jobs/jobManager.js" target="_blank"><img align="right" src="https://img.shields.io/badge/<%2F>%20Source-darkcyan"></a>

&nbsp;

The JobManager is a module for managing reoccurring intervals, also called jobs.  
For example, the updater registers a job by default to handle the update check, which runs every 6 hours.  

Jobs are registered at runtime by calling `registerJob(job: Job)`, where job is an object which includes metadata and the function to execute.  
This feature is also available to Plugins, as documented on the [Creating Plugins page](../../wiki/creating_plugins.md#jobmanager).  

The job manager should be used whenever possible to reduce points of failure.  
Do not register intervals yourself, let this do it for you.

&nbsp;

Every function and object property is documented with JsDocs in the implementation file.  
Please check them out using your IntelliSense or by clicking the button in the top right corner of this page.
