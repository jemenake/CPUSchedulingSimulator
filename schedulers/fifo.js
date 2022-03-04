
class Scheduler {
    constructor(name, system) {
        console.log("Superclass initializing for " + name)
        this.name = name
        this.system = system
        this.queues = [[]]
        this.queue_names = [["Queue 1"]]
    }

    schedule(system, system_state) {
        throw new Error("You must create a schedule method for your class")
    }
}

// Random
// Random scheduler just randomly picks 
class RandomScheduler extends Scheduler {
    constructor(name, system) {
        super(name, system)
        console.log("RandomScheduler constructor")
    }

    schedule(system, system_state) {
        var available_jobs = system_state.getLiveJobs()
        this.queues = [...available_jobs] // Queue order doesn't matter so just assign it to live jobs
        assigments = this.assignCPUJobs(available_jobs)
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }

    // Assigns each available job to each CPU by shortest CPU queue
    assignCPUJobs(available_jobs) {
        var assignments = Array(system.cpus.length).fill([]) // Start with an array of empty arrays, one for each CPU
        // As long as there are available jobs to assign to a CPU and there are CPU's to assign _to_...
        while (available_jobs.length > 0) {
            let cpu_idx = this.findShortestIndex2D(assignments) 
            let proc_idx = Math.floor(Math.random() * available_jobs.length) // Pick a random process from those available
            console.log("Assigning job " + available_jobs[proc_idx].name + " to CPU at index " + cpu_idx)
            assignments[cpu_idx].push(available_jobs[proc_idx])
            delete available_jobs[proc_idx] // Remove this job from the list of available 
        }
        return assignments
    }

    // Returns index of the shortest array of a 2D array
    findShortestIndex2D(arr2d) {
        min_len = arr2d[0].length
        min_index = 0
        for (let i = 1; i < arr2d.length; i++) {
            if (arr2d[i].length < min_len) {
                min_len = arr2d[i].length
                min_index = i
            }
        }
        return min_index
    }

    /* not used currently
    findNullIndex2D(arr2d) {
        for (let i = 0; i < arr2d.length; i++) {
            if (arr2d[i] == null) {
                return i
            }
        }
        return -1
    }

    getJobNumbers(jobs) {
        job_numbers = []
        for (job of job_numbers) {
            job_numbers.push(job.job_number)
        }
    }
    */
} 


// FIFO
class FIFOScheduler extends Scheduler {
    constructor(name, system, prev_jobs) {
        super(name, system)
        this.prev_jobs = prev_jobs
        // Some day for multi-queue support
        // this.queue_names = []
        // this.queues = []
        // for(i=0; i<system.cpus.count; i++) {
        //     this.queue_names.push("CPU" + i)
        //     this.queues.push([])
        // }
        console.log("FIFOScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getLiveJobs()
        var cur_jobs = []
        for (const prev_job of this.prev_jobs) { // Push previous jobs that are still live first
            if (job_exists(prev_job, available_jobs)) {
                cur_jobs.push(prev_job)
            }
        }

        for (const available_job of available_jobs) { // Push remaining live jobs
            if (!job_exists(available_job, cur_jobs)) {
                cur_jobs.push(available_job)
            }
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
        return {
            "queues": [this.getJobNumbers(cur_jobs)],
            "assignments": assignments
        }
    }

    job_exists(job, jobs) {
        for (const j in jobs) {
            if (job.job_number == j.job_number) {
                return true
            }
        }
        return false
    }
}

// RR
class RRScheduler extends FIFOScheduler {
    constructor(name, prev_jobs, cycle_count, cycle_limit) {
        super(name, prev_jobs)
        this.cycle_count = cycle_count
        this.cycle_limit = cycle_limit
        console.log("RRScheduler constructor")
    }

    schedule(system, system_state) {
        var available_jobs = system_state.getLiveJobs()
        var cur_jobs = []
        for (const prev_job of this.prev_jobs) { // Push previous jobs that are still live first
            if (super.job_exists(prev_job, available_jobs)) {
                cur_jobs.push(prev_job)
            }
        }

        for (const available_job of available_jobs) { // Push remaining live jobs
            if (!super.job_exists(available_job, cur_jobs)) {
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
        return {
            "queues": [this.getJobNumbers(cur_jobs)],
            "assignments": assignments
        }
    }
}

// priority scheduler: have a certain number of queues (default 3 say)

// schedulers need to return assignments and queues
// can return a list of queues of jobs (even a list of one queue)
// list of current cpu assignments of jobs
// have a function to get queue names for every scheduler ex: ["high priority", "low priority"]
// have a prev_queues list for number of queues
// each job has a priority (up to 4)

// CFS: every 20ms every process gets a little bit of time if they haven't had any

// fifo twist: fifo with no priority but a queue for every processor (so 3 processors would have 3 queues) and put new processes in the shortest queue (queue with shortest length)


// SRTN
