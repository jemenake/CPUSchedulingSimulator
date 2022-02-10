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

    toString() {
        return "Proc:" + this.job_number + " Pri:" + this.priority + " Life:" + this.lifecycle.join(",")
    }

    isAlive(cpu_time) {
        if (cpu_time == null) {
            throw new Error("ERROR: You must call Job.isAlive with a cputime")
        }
        // If it's our arrival time and we haven't finished
        return (this.arrival_time <= cpu_time) && (! this.isFinished())
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
            // This is actually something we shouldn't throw an exeption for. This would just indicate
            // a bad scheduler, so we should schedule it and just make note of the mistake in the notes
            // for this timeslice
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
        this.trace = [] // This will contain the list of all process->CPU assignments. It's length will be the system time
    }

    getSystemTime() {
        return this.trace.length
    }

    getLiveJobs() {
        let cpu_time = this.getSystemTime()
        return this.jobs.filter((job) => job.isAlive(cpu_time))
    }

    dumpJobs() {
        this.jobs.forEach((job) => {
            console.log(job.toString())
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
        for(var i=0; i<assignments.length; i++) {
            console.log("CPU" + i + " gets process " + assignments[i])
        }
        this.trace.push(assignments.slice()) // Make a copy of the array, just in case something else messes with it later
    }
}

// Goals 
// 1. get FIFO working
// 2. Add multiple cores



function simulator() {
    var starting_jobs = [
        new Job(0, 0, 3,[ "c3", "w2", "c4" ]),
        new Job(1, 2, 3,[ "c8", "w12", "c24", "w1", "c1" ]),
        new Job(2, 5, 3,[ "c22" ])
    ]

    // Define the system we're running on
    let system = new System("1-CPU System", 1)

    let system_state = new SystemState(starting_jobs)

    // Grab tasks that start at time zero if any
    current_jobs = [] 
    for(let job in starting_jobs){
        if (job.arrival_time == 0){
            current_jobs.push(job)
        }
    }

    // Here's where we make a list of every scheduler we want to run this job list against
    let schedulers = [ new RandomScheduler() ]

    // At this point, we have a list of jobs, and we can cycle through all of the schedulers
    schedulers.forEach((scheduler) => {
        console.log("Simulating scheduler named : " + scheduler.name)
        computeScheduleWith(system, system_state, scheduler)
    })
}

function computeScheduleWith(system, system_state, scheduler) {
    console.log("computeSchedule() called with the " + system.name + " and " + scheduler.name + " and " + system_state.jobs.length + " jobs")

    // Run until nothing is alive
    //while (starting_jobs.some((job) => job.isAlive())) {
    for(i=0; i<3; i++) {
        let cpu_time = system_state.getSystemTime()
        cpu_assignments = scheduler.schedule(system, system_state)
        // TODO: Decrease wait and cpu times based upon what the scheduler decided
        //      for each process that the scheduler has selected for computation
        //          recordComputation()        
        //      for each process that is waiting
        //          recordWait()

        // Add these assignments to the overall schedule
        system_state.recordSchedule(cpu_assignments)
        system_state.dumpStatus()
    }
    
        
        
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