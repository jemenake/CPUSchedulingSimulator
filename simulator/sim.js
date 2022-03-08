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

        // Metrics
        this.first_computation_time = -1  // Used for response time
        this.finished_cycle_time = -1     // Used for turnaround
        this.waiting_time = 0             // Waiting time when wants to compute
    }

    turnAroundTime(){

    }



    clone() {
        return new Job(this.job_number, this.arrival_time, this.priority, this.lifecycle)
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
        // Get everything after the first char as an integer
        let number = parseInt(this.lifecycle[0].substring(1))
        // If it's a 1, then we have finished waiting, so delete this array element. Otherwise, decrement
        if (number <= 1) {
            this.lifecycle = this.lifecycle.slice(1)
        } else {
            this.lifecycle[0] = "c" + (number - 1)
        }

        if (this.first_computation_time == -1){
            this.first_computation_time = cycle
        }

        if (this.isFinished() & this.finished_cycle_time == -1){
            this.first_computation_time = cycle
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
    constructor(jobs) {
        this.jobs = jobs
        this.cycle = 0
        }

    getSystemTime() {
        return this.cycle
    }

    // Returns all jobs which haven't finished
    getUnfinishedJobs() {
        return this.jobs.filter((job) => (! job.isFinished()))
    }

    // Get all jobs which are started and not finished (either waiting or requiring computation)
    getLiveJobs() {
        let cpu_time = this.getSystemTime()
        return this.jobs.filter((job) => job.isAlive(cpu_time))
    }

    // Get all jobs which are waiting for computation
    getRunningJobs() {
        return this.getLiveJobs().filter((job) => (! job.isWaiting()))
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

// Goals 
// 1. get FIFO working
// 2. Add multiple cores

function throwError(msg) {
    alert(msg)
    console.error(msg)
}

let MIN_JOBS = 4
let MAX_JOBS = 4
let MIN_WAIT_TIME = 1
let MAX_WAIT_TIME = 10 // Maximum time any job needs to wait for something
let MIN_COMPUTE_TIME = 1
let MAX_COMPUTE_TIME = 10 // Maximum time any job needs to compute before needing to wait or finish
let MAX_WAIT_CYCLES = 4 // Maximum _number_ of times any job needs to wait for something like
let MIN_PRIORITY = 0
let MAX_PRIORITY = 3
let MAX_ARRIVAL_TIME = 40
// We need some way of stopping if we have an infinite loop, for some reason. So, figure out the
// longest a process can need to run (_not_ counting time waiting in the run queue) and add that
// to the latest possible arrival time. This should give us a rough idea of clock cycle count whereupon
// we can terminate the simulation with an error. We need to pad this number (probably by multiplying by
// some amount) in order to account for time the process is waiting in the run queue.
let LAST_EXPECTED_CYCLE = MAX_ARRIVAL_TIME + (MAX_COMPUTE_TIME * (1 + MAX_WAIT_CYCLES)) + (MAX_WAIT_TIME * MAX_WAIT_CYCLES)

function createJob(job_number) {
    let priority = MIN_PRIORITY + Math.floor(Math.random() * (MAX_PRIORITY - MIN_PRIORITY))
    let arrival_time = Math.floor(Math.random() * MAX_ARRIVAL_TIME)
    // We _must_ have a starting computation
    var lifecycle = []
    lifecycle.push("c" + (MIN_COMPUTE_TIME + Math.floor(Math.random() * (MAX_COMPUTE_TIME - MIN_COMPUTE_TIME))))
    let num_waits = Math.floor(Math.random() * MAX_WAIT_CYCLES)
    for(j=0; j<num_waits; j++) {
        lifecycle.push("w" + (MIN_WAIT_TIME + Math.floor(Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME))))
        lifecycle.push("c" + (MIN_COMPUTE_TIME + Math.floor(Math.random() * (MAX_COMPUTE_TIME - MIN_COMPUTE_TIME))))
    }
    console.log("Creating a job #" + job_number + " with arrival time " + arrival_time + " and priority " + priority)
    return new Job(job_number, arrival_time, priority, lifecycle)
}

// Creates a list of Jobs
function createJobList() {
    // Pick a number between MIN_JOBS and MAX_JOBS
    let num_jobs = MIN_JOBS + Math.floor(Math.random() * (MAX_JOBS - MIN_JOBS))
    var jobs = []
    for (i=0; i<num_jobs; i++) {
        jobs.push(createJob(i))
    }
    // We need to make sure that _some_ job starts at time=0 (or it makes for a boring start to the simulation)
    // so we just pick job #0
    jobs[0].arrival_time = 0
    console.log("Last expected cycle is " + LAST_EXPECTED_CYCLE)
    return jobs
}

function simulator() {

    var starting_jobs = createJobList()

    var overall_trace_object_list = []
    // var starting_jobs = [
    //     new Job(0, 0, 3, ["c3", "w2", "c4"]),
    //     new Job(1, 2, 3, ["c8", "w12", "c24", "w1", "c1"]),
    //     new Job(2, 5, 3, ["c22"])
    // ]

    // Define the system we're running on
    let system = new System("1-CPU System", 1)

    let system_state = new SystemState(starting_jobs)

    // Grab tasks that start at time zero if any
    current_jobs = []
    for (let job in starting_jobs) {
        if (job.arrival_time == 0) {
            current_jobs.push(job)
        }
    }

    // Here's where we make a list of every scheduler we want to run this job list against
    //let schedulers = [new RandomScheduler("Random Schedule", system)]
    //let schedulers = [new FIFOScheduler("FIFO Schedule", system)]
    let schedulers = [new RRScheduler("RR Schedule", system, 0, 2)]

    // At this point, we have a list of jobs, and we can cycle through all of the schedulers
    schedulers.forEach((scheduler) => {
        console.log("Simulating scheduler named : " + scheduler.name)
        overall_trace_object_list.push(computeScheduleWith(system, system_state, scheduler))
    })

    return overall_trace_object_list
}

function computeScheduleWith(system, system_state, scheduler) {
    system_state.cycle = 0
    console.log("computeSchedule() called with the " + system.name + " and " + scheduler.name + " and " + system_state.jobs.length + " jobs")
    trace = new OverallTraceObject([], system, scheduler.name)
    // Run until nothing is alive
    //while (starting_jobs.some((job) => job.isAlive())) {
    while (system_state.getUnfinishedJobs().length > 0) {
        if (system_state.getSystemTime() > LAST_EXPECTED_CYCLE * 2) {
            throwError("ERROR: The system clock reached " + system_state.getSystemTime() + " which is longer than we expected to need for computation. It's likely that the simulator has an infinite loop, somewhere.")
        }
        
        let schedule = scheduler.schedule(system_state)
        schedule.assignments.forEach((job) => {
            console.log("Assignment = " + JSON.stringify(job))
        })

        // We need to process the waiting jobs, first! Otherwise, a job with "c1" that gets
        // computation will get its last computation done, and _then_ get a cycle of wait
        // reduced
        system_state.jobs.forEach((job) => {
            console.log("Checking job #" + job.job_number)
            if (job.isWaiting()) {
                console.log("Looks like job #" + job.job_number + " is waiting, so we'll decrement it's wait time")
                console.log("Before: " + JSON.stringify(job.lifecycle))
                job.recordWait()        // Reduce wait
                console.log("After : " + JSON.stringify(job.lifecycle))
            }
        })

        // Now, give the selected processes some computation
        schedule.assignments.forEach((job) => {
            if (job == null) {
                console.log("Got a null assignment. This isn't a bad thing. Just noting it in the logs during development")
            } else {
                console.log("Looks like job #" + job.job_number + " got some CPU time")
                console.log("Before: " + JSON.stringify(job.lifecycle))
                job.recordComputation(system_state.cycle)  // Reduce computation    
                console.log("After : " + JSON.stringify(job.lifecycle))
            }
        })

        // Add to wait time, by finding jobs that are running and not in a cpu
        system_state.getRunningJobs().forEach((running_job) => {
            let found = false;
            schedule.assignments.forEach((assignement) => {
                if (assignement != null && assignement.job_number == running_job.job_number){
                    found = true
                }
            })
            if (!found){
                running_job.waiting_time += 1
            }
        })

        // Trace update
            trace.trace_object_list.push(
                new TraceObject(
                system_state.getRunningJobs().reduce((list, job) => list.concat(job.clone()), []),  // Live Jobs
                system_state.getWaitingJobs().reduce((list, job) => list.concat(job.clone()), []),  // Waiting Jobs
                schedule.queues.reduce((outer_result_list, inner_list) => outer_result_list.concat( // Outer list of queues
                    inner_list.length > 0 ? inner_list.reduce((inner_result_list, job) => inner_result_list.concat(job.clone()), []) : [] // Inner list of queues
                    )
                    , []),                  // Queues
                schedule.assignments.reduce((list, job) => job != null ? list.concat(job.clone()) : list.concat(null), []))             // CPU assigments
                )
        
        // Constant Trace Values
        trace.queue_names = schedule.queue_names
        trace.system = system
        trace.scheduler_name = scheduler.name

        // Incriment cycle count
        system_state.cycle += 1
    }

    // Calculate Agregate Stats

    return trace;
}
