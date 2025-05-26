<a name="JobManager"></a>

## JobManager
**Kind**: global class  

* [JobManager](#JobManager)
    * [new JobManager(controller)](#new_JobManager_new)
    * [.controller](#JobManager+controller) : [<code>Controller</code>](#Controller)
    * [.jobs](#JobManager+jobs) : [<code>Array.&lt;Job&gt;</code>](#Job)
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

