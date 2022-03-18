/*
current_proccesses = [
[job0, job1, job2]

*/

// Todo list
// Create job creator function - Joe?
// Create priority scheduler (separate queues for each priority)
// Create UI - Joe
// 

// Priority scheduler
//    Scheduler decides how many queues to use
// Needs to set self.queue_names (and length must match the length of trace[i].queues)
//   FIFO (unified) would just return something like ["Unified queue"]
//   FIFO (one queue per CPU) would return something like ["CPU0", "CPU1", ...] // because schedule would check system.cpus.length

// Simulator
//    Decides how many CPUs
// 

// UI Needs
//    Trace of: all queues for each timeslice (list of int "0" for P0) (check: no process appears in multiple queues)
//    List of CPU assignments (list of int "0" for CPU0, null if there's no assignement) (check: no process appears twice. Every process also appears in a queue. List.length = # of CPUs)
//    State of all processes (including finished ones but not-yet-started jobs) list of Job
//    Aggregate stats (average wait, ....) systemwide AND per-process at each timeslice
//
// {
//    trace: [
//      {  2-priority scheduler and 3CPU system
//        queues: [ [jobObj1,jobObj2], [jobObj4,jobObj5,jobObj3] ],
//        queue_names: [[Queue 1], [Queue 2]],
//        assignments: [jobObj1, jobObj2, jobObj4],
//        stats: {
//          longest_wait: 0,
//      
//        }
//      }
//    ],
//    queue_names: [ "High priority", "Low Priority" ]
//    stats: { // Overall
//      longest_wait: 0,
//      
//    }
// }

class Stats {
    constructor() {
        this.avg_response_time = 0;
        this.avg_turn_around_time = 0;
        this.avg_wait_time = 0;

        this.longest_response_time = null;
        this.longest_turn_around_time = null
        this.longest_wait = null;

        this.throughput = null;
    }
}

class OverallTraceObject {
    constructor(trace_object_list, system, scheduler_name) {
        this.trace_object_list = trace_object_list
        this.queue_names = null
        this.stats = null
        this.system = system
        this.scheduler_name = scheduler_name
    }
}

class TraceObject {
    constructor(live_jobs, waiting_jobs, queues, assignments) {
        this.live_jobs = live_jobs
        this.waiting_jobs = waiting_jobs
        this.queues = queues
        this.assignments = assignments
    }
}

// This class describes a process/thread/job
// Its lifecycle is determined by an array of strings describing how many cycles it computes/waits for
// Example: this.lifecycle = [ "c10", "w5", "c13" ]
//  represents a job which computes for 10 cycles, then waits for 5, then computes for another 13 and then exits
class Job {
    constructor(job_number, arrival_time, priority, lifecycle) {
        this.job_number = job_number
        this.arrival_time = arrival_time
        this.priority = priority
        // This clones the lifecycle (as long as it remains an array of strings) so that it will be easy to create
        // clone a job with something like:  new_job = new Job(old_job)
        this.lifecycle = lifecycle.slice()
        this.cycle_count = 0 // Cycle count for round robin

        // Metrics
        this.first_computation_time = null  // Used for response time
        this.finished_cycle_time = null     // Used for turnaround
        this.waiting_time = 0             // Waiting time when wants to compute
    }

    getResponseTime() {
        return this.first_computation_time - this.arrival_time
    }

    getTurnAroundTime() {
        return this.finished_cycle_time - this.arrival_time
    }

    getWaitTime() {
        return this.waiting_time
    }

    clone() {
        let job = new Job(this.job_number, this.arrival_time, this.priority, this.lifecycle)
        job.first_computation_time = this.first_computation_time
        job.finished_cycle_time = this.finished_cycle_time
        job.waiting_time = this.waiting_time
        return job
    }

    toString() {
        return "Proc:" + this.job_number + " Pri:" + this.priority + " Life:" + this.lifecycle.join(",")
    }

    isAlive(cpu_time) {
        if (cpu_time == null) {
            throw new Error("ERROR: You must call Job.isAlive with a cputime")
        }
        // If it's our arrival time and we haven't finished
        return (this.arrival_time <= cpu_time) && (!this.isFinished())
    }

    isFinished() {
        return this.lifecycle.length == 0
    }

    isWaiting() {
        return (!this.isFinished()) && (this.lifecycle[0][0] == "w")
    }

    // Decrement the wait timer
    recordWait() {
        // Make sure that we're really waiting
        if (!this.isWaiting()) {
            throw new Error("ERROR: we were asked to record a wait for a non-waiting process, which looked like " + JSON.stringify(this))
        }
        // Get everything after the first char as an integer
        let number = parseInt(this.lifecycle[0].substring(1))
        // If it's a 1, then we have finished waiting, so delete this array element. Otherwise, decrement
        if (number <= 1) {
            this.lifecycle = this.lifecycle.slice(1)
        } else {
            this.lifecycle[0] = "w" + (number - 1)
        }
    }

    recordComputation(cycle) {
        // Make sure that we're really waiting
        if (this.isWaiting()) {
            // This is actually something we shouldn't throw an exeption for. This would just indicate
            // a bad scheduler, so we should schedule it and just make note of the mistake in the notes
            // for this timeslice
            throw new Error("ERROR: we were asked to record computation for a waiting process, which looked like " + JSON.stringify(this))
        }

        if (this.first_computation_time == null) {
            this.first_computation_time = cycle
        }

        // Get everything after the first char as an integer
        let number = parseInt(this.lifecycle[0].substring(1))
        // If it's a 1, then we have finished waiting, so delete this array element. Otherwise, decrement
        if (number <= 1) {
            this.lifecycle = this.lifecycle.slice(1)
        } else {
            this.lifecycle[0] = "c" + (number - 1)
        }

        if (this.isFinished() && this.finished_cycle_time == null) {
            this.finished_cycle_time = cycle + 1 // Add one becuase technically it finishes at the start of next cycle
        }
    }
}

class System {
    // This is where we track the configuration of the system. Not just the permanent
    // aspects (like # of CPUs) but also the state (like which CPUs are asleep)
    constructor(name, cpus) {
        this.name = name
        this.cpus = cpus
    }

    toString() {
        return "System: " + this.name
    }
}

class SystemState {
    constructor(jobs, seed) {
        this.jobs = jobs
        this.cycle = 0
        this.seed = seed
    }

    getSystemTime() {
        return this.cycle
    }

    // Returns all jobs which haven't finished
    getUnfinishedJobs() {
        return this.jobs.filter((job) => (!job.isFinished()))
    }

    // Get all jobs which are started and not finished (either waiting or requiring computation)
    getLiveJobs() {
        let cpu_time = this.getSystemTime()
        return this.jobs.filter((job) => job.isAlive(cpu_time))
    }

    // Get all jobs which are waiting for computation
    getRunningJobs() {
        return this.getLiveJobs().filter((job) => job.isAlive(this.cycle) && (!job.isWaiting()))
    }

    // Get all jobs which are waiting for computation
    getWaitingJobs() {
        return this.getLiveJobs().filter((job) => (job.isWaiting()))
    }

    /* not used currently
    getLiveOrDeadJobs() {
        let cpu_time = this.getSystemTime()
        return this.jobs.filter((job) => job.isAlive(cpu_time) || job.isFinished())
    }
    */

    dumpJobs() {
        this.jobs.forEach((job) => {
            console.log(JSON.parse(JSON.stringify(job)))
        })
    }

    dumpLiveJobs() {
        this.dumpJobs(this.getLiveJobs())
    }

    dumpStatus() {
        console.log("======= Simulator Status =======")
        console.log("Clock:" + this.getSystemTime())
        console.log("  == Live Jobs ==")
        this.dumpLiveJobs()
    }

    // Here's where we actually record the decision from the scheduler. We are passed
    // an array of processes which are assigned to CPU0, CPU1, etc, according to the
    // array index
    recordSchedule(assignments) {
        // for(var i=0; i<assignments.length; i++) {
        //     console.log("CPU" + i + " gets process " + assignments[i])
        // }

        console.log("This is where we would add this cycle's jobs to the trace.")
        // Makes a deep copy according to stack overflow
        // let clonedArray = JSON.parse(JSON.stringify(assignments))

        // this.trace.push(clonedArray.slice()) // Make a copy of the array, just in case something else messes with it later
        this.trace.push("adding something to the trace so that the clock count advances")
    }
}

function throwError(msg) {
    alert(msg)
    console.error(msg)
    someFunctionThatDoesntExist()
}

// let MIN_JOBS = 10
// let MAX_JOBS = 10
// let MIN_WAIT_TIME = 1
// let MAX_WAIT_TIME = 10 // Maximum time any job needs to wait for something
// let MIN_COMPUTE_TIME = 1
// let MAX_COMPUTE_TIME = 10 // Maximum time any job needs to compute before needing to wait or finish
let AVG_COMPUTE_WAIT_CYCLE = 12
let MAX_WAIT_CYCLES = 4 // Maximum _number_ of times any job needs to wait for something like
let MIN_PRIORITY = 0
let MAX_PRIORITY = 1
// let MAX_ARRIVAL_TIME = 40

// We need some way of stopping if we have an infinite loop, for some reason. So, figure out the
// longest a process can need to run (_not_ counting time waiting in the run queue) and add that
// to the latest possible arrival time. This should give us a rough idea of clock cycle count whereupon
// we can terminate the simulation with an error. We need to pad this number (probably by multiplying by
// some amount) in order to account for time the process is waiting in the run queue.
let LAST_EXPECTED_CYCLE = AVG_COMPUTE_WAIT_CYCLE * MAX_WAIT_CYCLES * 100

// Sourced from stack overflow (https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript)
function mulberry32(a) {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function createJob(job_number, wait_ratio, job_load, seed, last_arrival) {
    let priority = MIN_PRIORITY + Math.floor(mulberry32(seed) * (MAX_PRIORITY - MIN_PRIORITY))
    // Arrival time is calculated from the "job_load", which is a target number of
    // processes to arrive over 10 cycles. So we divide 20 by the job_load, and find a random
    // number between 0 and that number, and add that to the arrival of the last process
    let arrival_time = last_arrival + Math.floor(mulberry32(seed) * 20 / job_load)
    console.log("Last arrival was " + last_arrival + " new arrival is " + arrival_time)
    let MIN_COMPUTE_TIME = 1
    let MAX_COMPUTE_TIME = AVG_COMPUTE_WAIT_CYCLE * (100 -wait_ratio) / 100
    let MIN_WAIT_TIME = 1
    let MAX_WAIT_TIME = AVG_COMPUTE_WAIT_CYCLE * wait_ratio / 100
    var lifecycle = []
    lifecycle.push("c" + (MIN_COMPUTE_TIME + Math.floor(mulberry32(seed) * (MAX_COMPUTE_TIME - MIN_COMPUTE_TIME))))
    let num_waits = Math.floor(mulberry32(seed) * MAX_WAIT_CYCLES)
    for (j = 0; j < num_waits; j++) {
        lifecycle.push("w" + (MIN_WAIT_TIME + Math.floor(mulberry32(seed) * (MAX_WAIT_TIME - MIN_WAIT_TIME))))
        lifecycle.push("c" + (MIN_COMPUTE_TIME + Math.floor(mulberry32(seed) * (MAX_COMPUTE_TIME - MIN_COMPUTE_TIME))))
    }
    console.log("Creating a job #" + job_number + " with arrival time " + arrival_time + " and priority " + priority)
    return new Job(job_number, arrival_time, priority, lifecycle)
}

// Creates a list of Jobs
function createJobList(job_count, wait_ratio, job_load, seed) {
    var jobs = []
    jobs.push(createJob(0, wait_ratio, job_load, seed, 0))
    jobs[0].arrival_time = 0
    for (i = 1; i < job_count; i++) {
        jobs.push(createJob(i, wait_ratio, job_load, seed + i, jobs[i-1].arrival_time))
    }

    // We need to make sure that _some_ job starts at time=0 (or it makes for a boring start to the simulation)
    // so we just pick job #0
    jobs[0].arrival_time = 0

    // Now, we need to order the jobs so that their job numbers are in sequential order
    // Easiest way to do this is probably to just sort the list by arrival_time and
    // then re-assign the job numbers to match their index in the array
    // jobs.sort((a, b) => a.arrival_time - b.arrival_time)
    // for (i = 0; i < jobs.length; i++) {
    //     console.log("Assigning job number " + i + " to job number " + jobs[i].job_number)
    //     jobs[i].job_number = i
    // }


    console.log("Last expected cycle is " + LAST_EXPECTED_CYCLE)
    return jobs
}

function simulator(system, schedulers, job_count, wait_ratio, job_load, seed) {
    console.log("1")
    var starting_jobs = createJobList(job_count, wait_ratio, job_load, seed)
    var overall_trace_object_list = []

    // Here's where we make a list of every scheduler we want to run this job list against
    // let schedulers = [new RandomScheduler("Random Schedule", system)]

    // At this point, we have a list of jobs, and we can cycle through all of the schedulers
    schedulers.forEach((scheduler) => {
        console.log("Simulating scheduler named : " + scheduler.name)

        var working_copy = starting_jobs.reduce((list, job) => list.concat(job.clone()), [])
        let system_state = new SystemState(working_copy, seed)

        overall_trace_object_list.push(computeScheduleWith(system, system_state, scheduler))
    })

    // Here's where we make a list of every scheduler we want to run this job list against
    //let schedulers = [new RandomScheduler("Random Schedule", system)]
    //let schedulers = [new FIFOScheduler("FIFO Schedule", system)]
    // let schedulers = [new RRScheduler("RR Schedule", system, 0, 2)]

    return overall_trace_object_list
}

function computeScheduleWith(system, system_state, scheduler) {
    system_state.cycle = 0
    console.log("computeSchedule() called with the " + system.name + " and " + scheduler.name + " and " + system_state.jobs.length + " jobs")
    let trace = new OverallTraceObject([], system, scheduler.name)
    let cpus_filled_sum = 0;

    // Run until nothing is alive
    //while (starting_jobs.some((job) => job.isAlive())) {
    while (system_state.getUnfinishedJobs().length > 0) {
        if (system_state.getSystemTime() > LAST_EXPECTED_CYCLE * 2) {
            throwError("ERROR: The system clock reached " + system_state.getSystemTime() + " which is longer than we expected to need for computation. It's likely that the simulator has an infinite loop, somewhere.")
        }

        let schedule = scheduler.schedule(system_state)
        schedule.assignments.forEach((job) => {
            // console.log("Assignment = " + JSON.stringify(job))
        })



        // Trace update
        trace.trace_object_list.push(
            new TraceObject(
                system_state.getRunningJobs(system_state.cycle).map(job => job.clone()),  // Live Jobs
                system_state.getWaitingJobs().map(job => job.clone()),  // Waiting Jobs
                schedule.queues.map((list) => // Outer list of queues
                    list.map((job) => list.length > 0 ? job.clone() : []) // Inner list of queues
                ),
                schedule.assignments.reduce((list, job) => job != null ? list.concat(job.clone()) : list.concat(null), [])// CPU assigments
            )
        )

        // Constant Trace Values
        trace.queue_names = schedule.queue_names
        trace.system = system
        trace.scheduler_name = scheduler.name

        // Decrementing values

        // We need to process the waiting jobs, first! Otherwise, a job with "c1" that gets
        // computation will get its last computation done, and _then_ get a cycle of wait
        // reduced
        system_state.jobs.forEach((job) => {
            // console.log("Checking job #" + job.job_number)
            if (job.isWaiting()) {
                // console.log("Looks like job #" + job.job_number + " is waiting, so we'll decrement it's wait time")
                // console.log("Before: " + JSON.stringify(job.lifecycle))
                job.recordWait()        // Reduce wait
                // console.log("After : " + JSON.stringify(job.lifecycle))
            }
        })

        // Now, give the selected processes some computation
        // schedule.assignments.forEach((job) => {
        for (let i = 0; i < schedule.assignments.length; i++) {
            var job = schedule.assignments[i]
            if (job == null) {
                // console.log("CPU" + i + " Got a null assignment. This isn't a bad thing. Just noting it in the logs during development")
            } else {
                cpus_filled_sum += 1
                // console.log("Looks like job #" + job.job_number + " got some CPU time")
                // console.log("Before: " + JSON.stringify(job.lifecycle))
                job.recordComputation(system_state.cycle)  // Reduce computation    
                // console.log("After : " + JSON.stringify(job.lifecycle))
            }
        }

        // Add to wait time, by finding jobs that are running and not in a cpu
        system_state.getRunningJobs().forEach((running_job) => {

            let found = false;
            schedule.assignments.forEach((assignement) => {
                if (assignement != null && assignement.job_number == running_job.job_number) {
                    found = true
                }
            })
            if (!found) {
                running_job.waiting_time += 1
            }
        })

        // Incriment cycle count
        system_state.cycle += 1
    }

    // Calculate Agregate Stats
    var stats = new Stats()
    // this.avg_response_time = 0;
    // this.avg_turn_around_time = 0;
    // this.avg_wait_time = 0;

    // this.longest_response_time = -1;
    // this.longest_turn_around_time = -1;
    // this.longest_wait = -1;

    system_state.jobs.forEach((job) => {
        stats.avg_response_time += job.getResponseTime()
        stats.avg_turn_around_time += job.getTurnAroundTime()
        stats.avg_wait_time += job.getWaitTime()

        if (job.getResponseTime() > stats.longest_response_time) {
            stats.longest_response_time = job.getResponseTime()
        }

        if (job.getTurnAroundTime() > stats.longest_turn_around_time) {
            stats.longest_turn_around_time = job.getTurnAroundTime()
        }

        if (job.getWaitTime() > stats.longest_wait) {
            stats.longest_wait = job.getWaitTime()
        }

    })

    stats.throughput = cpus_filled_sum / system_state.cycle
    stats.avg_response_time = stats.avg_response_time / system_state.jobs.length
    stats.avg_turn_around_time = stats.avg_turn_around_time / system_state.jobs.length
    stats.avg_wait_time = stats.avg_wait_time / system_state.jobs.length
    trace.stats = stats

    return trace;
}
