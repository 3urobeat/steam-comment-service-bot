
/**
 * Handle intervals and timeouts to clear them after restart
 */
module.exports = () => {
    //Modify original setInterval function to be able to track all intervals being set which allows the restart function to clear all intervals (Issue reference: https://github.com/HerrEurobeat/steam-comment-service-bot/issues/94)
    //Credit for the idea: https://stackoverflow.com/a/8524313
    global.intervalList = []
    global.timeoutList = []

    //Declare oldSetInterval only if it isn't set already. Global vars aren't getting reset during restart and setting this again would lead to a circular statement (if that's the right
    // term for Zirkelschluss in German) which causes the function below to run like a thousand times and cause a MaxListenersExceededWarning (omg I feel so smart rn it's unbelievable)
    if (!global.oldSetInterval) global.oldSetInterval = setInterval;
    if (!global.oldSetTimeout) global.oldSetTimeout = setTimeout; 

    global.setInterval = function(code, delay) {
        var retval = global.oldSetInterval(code, delay);
        global.intervalList.push(retval);
        return retval;
    };

    global.setTimeout = function(code, delay) {
        var retval = global.oldSetTimeout(code, delay);
        global.timeoutList.push(retval);
        return retval;
    };
}