
class Scheduler {
    constructor(name) {
        console.log("Superclass initializing for " + name)
        this.name = name
    }

    schedule(system, system_state) {
        throw new Error("You must create a schedule method for your class")
    }
}

// Random
// Random scheduler just randomly picks 
class RandomScheduler extends Scheduler {
    name = "Random Scheduler"

    constructor() {
        super("Random")
        console.log("RandomScheduler constructor")
    }

    schedule(system, system_state) {
        var available_jobs = system_state.getLiveJobs()
        var assignments = Array(system.cpus.length).fill(null) // Start with an array of nulls for each CPU
        // As long as there are available jobs to assign to a CPU and there are CPU's to assign _to_...
        while (available_jobs.length > 0 && assignments.findIndex((val) => val == null) != -1 ) {
            let cpu_idx = assignments.findIndex((val) => val == null)
            let proc_idx = Math.floor(Math.random() * available_jobs.length) // Pick a random process from those available
            console.log("Assigning job " + available_jobs[proc_idx].name + " to CPU at index " + cpu_idx)
            assignments[cpu_idx] = available_jobs[proc_idx]
            delete available_jobs[proc_idx] // Remove this job from the list of available 
        }
        return assignments
    }
} 


// FIFO
class FIFOScheduler extends Scheduler {
    name = "FIFO Scheduler"

    constructor() {
        super("FIFO")
        console.log("FIFOScheduler constructor")
    }

    schedule(system, system_state) {
        var available_jobs = system_state.getLiveJobs()
        var assignments = Array(system.cpus.length).fill(null) 
        while (available_jobs.length > 0 && assignments.findIndex((val) => val == null) != -1 ) {
            let cpu_idx = assignments.findIndex((val) => val == null)
            let proc_idx = 0 // Pick first process from those available
            console.log("Assigning job " + available_jobs[proc_idx].name + " to CPU at index " + cpu_idx)
            assignments[cpu_idx] = available_jobs[proc_idx]
            delete available_jobs[proc_idx] // Remove this job from the list of available 
        }
        return assignments
    }
}

// RR
class RRScheduler extends Scheduler {
    name = "RR Scheduler"
    prev_jobs = []
    cycle_count = 0

    constructor() {
        super("RR")
        console.log("RRScheduler constructor")
    }

    schedule(system, system_state, cycle_limit) {
        var available_jobs = system_state.getLiveJobs()
        var cur_jobs = []
        for (const prev_job of this.prev_jobs) { // Push previous jobs that are still live first
            if (this.job_exists(prev_job, available_jobs)) {
                cur_jobs.push(prev_job)
            }
        }

        for (const available_job of available_jobs) { // Push remaining live jobs
            if (!this.job_exists(available_job, cur_jobs)) {
                cur_jobs.push(available_job)
            }
        }

        var last_proc = this.prev_jobs[0] 
        if (last_proc != cur_jobs[0]) { // New job so reset count
            this.cycle_count = 0
        }

        if (this.cycle_count > cycle_limit) { // Current job has run out of cycles so move it to the back of the line and reset count
            this.cur_jobs.shift(this.cur_jobs.pop())
            this.cycle_count = 0
        }

        var assignments = Array(system.cpus.length).fill(null) 
        while (available_jobs.length > 0 && assignments.findIndex((val) => val == null) != -1 ) {
            let cpu_idx = assignments.findIndex((val) => val == null)
            let proc_idx = 0 // Pick first process from those available
            console.log("Assigning job " + available_jobs[proc_idx].name + " to CPU at index " + cpu_idx)
            assignments[cpu_idx] = available_jobs[proc_idx]
            delete available_jobs[proc_idx] // Remove this job from the list of available 
        }
        this.prev_jobs = [...this.cur_jobs]
        return assignments
    }

    job_exists(job, jobs) {
        for (const j in jobs) {
            if (job.getJobNumber() == j.getJobNumber()) {
                return true
            }
        }
        return false
    }
}

// function fifo(job_list){}
//     var first_job = NULL
//     for (const element of job_list) {
//         if (first_job == None){
//             first_job = job
//         }
//         else if (first_job.job_number > job.job_number){
//             first_job = job
//         }
//     return first_job
// }

// SRTN
