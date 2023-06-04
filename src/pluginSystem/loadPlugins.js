const PluginSystem = require("./pluginSystem.js");

const PLUGIN_REGEX = /^steam-comment-bot-/;
const packageJson = require("../../package.json");

const PLUGIN_EVENTS = {
    READY: "ready",
    STATUS_UPDATE: "statusUpdate",
    steamGuardInput: "steamGuardInput",
};

function loadPlugin(pluginName) {
    const importedPlugin = require(pluginName);

    if (!(typeof importedPlugin === "function")) {
        logger("error", `Plugin ${pluginName} is not a function`);
    }

    try {
        const pluginInstance = new importedPlugin(this);
        return { pluginName, pluginInstance };
    } catch (e) {
        logger("error", `Plugin ${pluginName} could not be instantiated`);
    }
}

PluginSystem.prototype._loadPlugins = async function () {

    // Get all plugins with the matching regex
    const plugins = Object.entries(packageJson.dependencies).filter(([key, value]) => PLUGIN_REGEX.test(key)); // eslint-disable-line
    const initiatedPlugins = plugins.map(([plugin]) => loadPlugin.bind(this)(plugin)); // Initalize each plugin

    for (const { pluginName, pluginInstance } of initiatedPlugins) {
        this.pluginList[pluginName] = pluginInstance;
        pluginInstance.load();

        // Call the exposed event functions if they exist
        Object.entries(PLUGIN_EVENTS).forEach(([eventName, event]) => { // eslint-disable-line
            this.controller.events.on(event, (...args) => pluginInstance[event]?.call(pluginInstance, ...args));
        });
    }

};
