/*
 * File: jobManager.js
 * Project: steam-comment-service-bot
 * Created Date: 2024-02-11 10:48:17
 * Author: 3urobeat
 *
 * Last Modified: 2025-01-12 17:04:36
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 - 2025 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * @typedef Job Documentation of a Job, stored in JobManager's job collection
 * @type {object}
 * @property {string} name Name of the job
 * @property {string} [description] Optional: Description of the job
 * @property {function(JobManager): void} func Function which will be executed
 * @property {number} interval Number in milliseconds to wait between executions of func. Minimum value is 250ms!
 * @property {boolean} [runOnRegistration] Set to true to run the job once instantly after registration
 * @property {number} [_lastExecTimestamp] Internal: Timestamp of the last execution of func. Do not set this value, it is managed by the JobManager internally.
 * @property {number} [_registeredAt] Internal: Timestamp of when this job was registered. Do not set this value, it is managed by the JobManager internally.
 */


/**
 * Constructor - The jobManager handles running and managing interval based functions (jobs), like update checks, cleanups, etc.
 * @class
 * @param {Controller} controller Reference to the controller object
 */
const JobManager = function(controller) {

    /**
     * Reference to the controller object
     * @type {Controller}
     */
    this.controller = controller;

    /**
     * Collection of all registered jobs
     * @type {Array.<Job>}
     */
    this.jobs = [];


    // Check for due jobs every 250ms
    this._jobExecInterval = setInterval(() => {
        this._runDueJobs();
    }, 250);

};

module.exports = JobManager;


/**
 * Internal: Executes all due jobs.
 * @private
 */
JobManager.prototype._runDueJobs = function() {

    this.jobs.forEach((job) => {

        // Check if job is due by adding interval to last timestamp and checking if current timestamp is greater
        if (job._lastExecTimestamp + job.interval < Date.now()) {
            logger("debug", `JobManager: Running due job '${job.name}'...`);

            job.func(this);

            job._lastExecTimestamp = Date.now();
        }

    });

};


/**
 * Registers a job
 * @param {Job} job Object of the job to register
 * @returns {Error | null} Returns `null` on success or `err` on failure, specifying the reason why.
 */
JobManager.prototype.registerJob = function(job) {

    // Check if job object is missing mandatory fields
    if (!job.name || !job.interval || !job.func) {
        return new Error("Job is missing mandatory fields!");
    }

    // Check if interval is <250
    if (job.interval < 250) {
        return new Error("Job interval must be greater than 250ms!");
    }

    // Check if a job with the same name already exists
    if (this.jobs.some((e) => e.name === job.name)) {
        return new Error("Job with the same name already exists!");
    }

    // Set _lastExecTimestamp to 0 or Now, depending on whether runOnRegistration is enabled
    if (job.runOnRegistration) {
        job._lastExecTimestamp = 0;
    } else {
        job._lastExecTimestamp = Date.now();
    }

    job._registeredAt = Date.now();

    // Register job and return null on success
    this.jobs.push(job);

    logger("debug", `JobManager: Registered job '${job.name}' which executes ${job.runOnRegistration ? "now and then " : ""}every ${job.interval}ms`);

    return null;

};


/**
 * Unregisters a job
 * @param {string} name Name of the job to unregister
 * @returns {Error | null} Returns `null` on success or `err` on failure, specifying the reason why.
 */
JobManager.prototype.unregisterJob = function(name) {

    // Check if job does not exist
    if (!this.jobs.some((e) => e.name === name)) {
        return new Error("Job does not exist!");
    }

    // Remove job and return null on success
    const index = this.jobs.findIndex((e) => e.name === name);

    this.jobs.splice(index, 1);

    logger("debug", `JobManager: Unregistered job '${name}'!`);

    return null;

};
