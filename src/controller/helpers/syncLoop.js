/*
 * File: syncLoop.js
 * Project: steam-comment-service-bot
 * Created Date: 21.05.2022 17:26:50
 * Author: 3urobeat
 *
 * Last Modified: 21.05.2022 23:40:35
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * Implementation of a synchronous for loop in JS (Used as reference: https://whitfin.io/handling-synchronous-asynchronous-loops-javascriptnode-js/)
 * @param {Number} iterations The amount of iterations
 * @param {Function} func The function to run each iteration (Params: loop, index)
 * @param {Function} exit This function will be called when the loop is finished
 */
module.exports.syncLoop = (iterations, func, exit) => {

    var currentIndex = 0;
    var done         = false;

    // Construct loop object
    var loop = {
        next: function () { // Run next iteration
                // Check if the next iteration is still allowed to run, otherwise stop by calling break
                if (currentIndex < iterations && !done) {
                    func(loop, currentIndex); // Call function again with new index
                    currentIndex++;
                } else {
                    this.break();
                }1;
            },
        break: function () { // Break loop and call exit function
            done = true;
            if (exit) exit();
        }
    };

    loop.next();
    return loop;
};