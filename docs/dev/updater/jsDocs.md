<a name="Updater"></a>

## Updater
**Kind**: global class  

* [Updater](#Updater)
    * [new Updater(controller)](#new_Updater_new)
    * [.run(forceUpdate, respondModule, resInfo)](#Updater+run) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [~stopOnFatalError()](#Updater+run..stopOnFatalError)

<a name="new_Updater_new"></a>

### new Updater(controller)
Constructor - Initializes the updater which periodically checks for new versions available on GitHub, downloads them and handles backups.


| Param | Type | Description |
| --- | --- | --- |
| controller | [<code>Controller</code>](#Controller) | Reference to the controller object |

<a name="Updater+run"></a>

### updater.run(forceUpdate, respondModule, resInfo) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks for any available update and installs it.

**Kind**: instance method of [<code>Updater</code>](#Updater)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Promise that will be resolved with false when no update was found or with true when the update check or download was completed. Expect a restart when true was returned.  

| Param | Type | Description |
| --- | --- | --- |
| forceUpdate | <code>boolean</code> | If true an update will be forced, even if disableAutoUpdate is true or the newest version is already installed |
| respondModule | <code>function</code> | If defined, this function will be called with the result of the check. This allows to integrate checking for updates into commands or plugins. Passes resInfo and txt as parameters. |
| resInfo | [<code>resInfo</code>](#resInfo) | Object containing additional information your respondModule might need to process the response (for example the userID who executed the command). |

<a name="Updater+run..stopOnFatalError"></a>

#### run~stopOnFatalError()
Shorthander to abort when a part of the updater is missing and couldn't be repaired

**Kind**: inner method of [<code>run</code>](#Updater+run)  
