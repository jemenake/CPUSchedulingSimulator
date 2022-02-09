/*
current_proccesses = [
[job0, job1, job2]

*/

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
    }

    isAlive(cputime) {
        this.parent.constructor()
        // If it's our arrival time and we haven't finished
        return (this.arrival_time <= cputime) && (! this.isFinished())
    }

    isFinished() {
        return this.lifecycle.length == 0
    }

    isWaiting() {
        return (! this.isFinished()) && (this.lifecycle[0][0] == "w")
    }

    // Decrement the wait timer
    recordWait() {
        // Make sure that we're really waiting
        if(! this.isWaiting()) {
            throw new Error("ERROR: we were asked to record a wait for a non-waiting process, which looked like " + JSON.stringify(this))
        }
        // Get everything after the first char as an integer
        number = this.lifecycle[0].substring(1).parseInt()
        // If it's a 1, then we have finished waiting, so delete this array element. Otherwise, decrement
        if (number <= 1) {
            delete this.lifecycle[0]
        } else {
            this.lifecycle[0] = "w" + (number - 1)
        }
    }

    recordComputation() {
        // Make sure that we're really waiting
        if(this.isWaiting()) {
            throw new Error("ERROR: we were asked to record computation for a waiting process, which looked like " + JSON.stringify(this))
        }
        // Get everything after the first char as an integer
        number = this.lifecycle[0].substring(1).parseInt()
        // If it's a 1, then we have finished waiting, so delete this array element. Otherwise, decrement
        if (number <= 1) {
            delete this.lifecycle[0]
        } else {
            this.lifecycle[0] = "c" + (number - 1)
        }    
    }
}

starting_jobs = [
    new Job(0, 0, 3,[ "c3", "w2", "c4" ]),
    new Job(1, 2, 3,[ "c8", "w12", "c24", "w1", "c1" ]),
    new Job(2, 5, 3,[ "c22" ])
    ]

// Goals 
// 1. get FIFO working
// 2. Add multiple cores


function simulator() {
    // var cycle = 0

    // Grab tasks that start at time zero if any
    current_jobs = [] 
    for(let job in starting_jobs){
        if (job.arrival_time == 0){
            current_jobs.push(job)
        }
    }

    // Here's where we make a list of every scheduler we want to run this job list against
    let schedulers = [ new FIFOScheduler() ]

    // At this point, we have a list of jobs, and we can cycle through all of the schedulers
    schedulers.forEach((scheduler) => {
        console.log("Simulating scheduler named : " + scheduler.name)
        computeScheduleWith(scheduler, starting_jobs)
    })
}

function computeScheduleWith(scheduler, jobs) {

    var the_schedule = [] // the complete trace that will be handed to the gui

    // Run until nothing is alive
    //while (starting_jobs.some((job) => job.isAlive())) {
    for(i=0; i<9; i++) {
        let cpu_time = the_schedule.length
        cpu_assignments = scheduler.schedule(jobs)
        // TODO: Decrease wait and cpu times based upon what the scheduler decided
        //      for each process that the scheduler has selected for computation
        //          recordComputation()        
        //      for each process that is waiting
        //          recordWait()

        // Add these assignments to the overall schedule
        the_schedule.push(cpu_assignments)
    }
    return the_schedule
    
        
        
        // Based on result add to final schedule list for gui demo
        // job_to_run.add_to_results()

        // Prep info
        // cycle++
        // for(let job in starting_objs){


        // Append to the_schedule whatever the process->CPU assignments are for this cycle            if (job.arrival_time == cycle){
                // current_jobs.push(job)
    // Give the resulting schedule to the UI 

        //    }
        // }
        // list_of_objects // pull in procceses that just arrived, update any computations done on this end
    // }
}
// 

// simulator()