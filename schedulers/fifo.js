
class Scheduler {
    constructor() {
        throw new Error("Can't instantiate abstract class!");
    }
    schedule() {
        throw new Error("You must create a schedule method for your class")
    }
}

class FIFOScheduler extends Scheduler {
    constructor() {
        console.log("I'm making a FIFO")
    }

    schedule() {
        console.log("Scheduling")
    }
} 

// FIFO
function fifo(job_list){}
    var first_job = NULL
    for (const element of job_list) {
        if (first_job == None){
            first_job = job
        }
        else if (first_job.job_number > job.job_number){
            first_job = job
        }
    return first_job
}

// SRTN


// RR
