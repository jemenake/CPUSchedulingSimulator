
class Scheduler {
    constructor(name) {
        console.log("Superclass initializing for " + name)
        this.name = name
    }

    schedule(jobs) {
        throw new Error("You must create a schedule method for your class")
    }
}

// FIFO
class FIFOScheduler extends Scheduler {
    name = "FIFO Scheduler"

    constructor() {
        super("FIFO")
        console.log("FIFOScheduler constructor")
    }

    schedule(jobs) {
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
