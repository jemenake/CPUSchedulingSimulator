
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
        console.log("Scheduling")
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


// RR
