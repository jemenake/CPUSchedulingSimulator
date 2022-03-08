
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

// Random scheduler that randomly assigns jobs to each CPU by shortest CPU queue
class RandomScheduler extends Scheduler {
    constructor(name, system) {
        super(name, system)
        console.log("RandomScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        console.log("available_jobs = " + JSON.stringify(available_jobs))
        available_jobs.forEach((job) => {
            console.log("Live Job: " + job.job_number + " " + JSON.stringify(job.lifecycle))
        })
        this.queues[0] = [...available_jobs] // Queue order doesn't matter so just assign it to live jobs
        let assignments = this.assignCPUJobs(available_jobs, "random")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }

    assignCPUJobs(available_jobs, method) {
        var assignments = Array(this.system.cpus.length).fill(null) // Start with an array of nulls for each CPU
        // As long as there are available jobs to assign to a CPU and there are CPU's to assign _to_...
        while (available_jobs.length > 0 && assignments.findIndex((val) => val == null) != -1 ) {
            let cpu_idx = assignments.findIndex((val) => val == null)

            let proc_idx = 0
            if (method == "random") {
                proc_idx = Math.floor(Math.random() * available_jobs.length) // Pick a random process from those available
            } else if (method == "fifo" || method == 'rr') { // fifo and round-robin both choose the first process
                proc_idx = 0
            }
            
            console.log("Assigning job " + available_jobs[proc_idx].job_number + " to CPU at index " + cpu_idx)
            assignments[cpu_idx] = available_jobs[proc_idx]
            delete available_jobs[proc_idx] // Remove this job from the list of available 
        }
        return assignments
    }

    /* This assumes every CPU has a queue
    // Assigns each available job to each CPU by shortest CPU queue
    assignCPUJobs(available_jobs, method) {
        var assignments = Array(system.cpus.length).fill([]) // Start with an array of empty arrays, one for each CPU
        // As long as there are available jobs to assign to a CPU and there are CPU's to assign _to_...
        while (available_jobs.length > 0) {
            let cpu_idx = this.findShortestIndex2D(assignments) 

            let proc_idx = 0
            if (method == "random") {
                proc_idx = Math.floor(Math.random() * available_jobs.length) // Pick a random process from those available
            } else if (method == "fifo") {
                proc_idx = 0
            }

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

// FIFO scheduler assigns jobs in a first-in-first-out manner
class FIFOScheduler extends RandomScheduler {
    constructor(name, system) {
        super(name, system)
        console.log("FIFOScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        console.log("available_jobs = " + JSON.stringify(available_jobs))
        available_jobs.forEach((job) => {
            console.log("Live Job: " + job.job_number + " " + JSON.stringify(job.lifecycle))
        })
        var cur_jobs = this.getCurrentJobs(available_jobs)
        this.queues[0] = [...cur_jobs]
        var assignments = super.assignCPUJobs(available_jobs, "fifo")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }

    // Returns a list of current live jobs in FIFO order
    getCurrentJobs(available_jobs) {
        var cur_jobs = []
        var prev_jobs = this.queues[0]

        // Push previous jobs that are still live
        for (const prev_job of prev_jobs) {
            if (this.job_exists(prev_job, available_jobs)) {
                cur_jobs.push(prev_job)
            }
        }

        // Push remaining live jobs
        for (const available_job of available_jobs) {
            if (!this.job_exists(available_job, cur_jobs)) {
                cur_jobs.push(available_job)
            }
        }
        return cur_jobs
    }

    // Checks if a given job exists in a list of jobs
    job_exists(job, jobs) {
        for (const j in jobs) {
            if (job.job_number == j.job_number) {
                return true
            }
        }
        return false
    }
}

// Round-Robin scheduler alots a certain number of cyles for each process, and switches to the next process in line once that limit is hit
class RRScheduler extends FIFOScheduler {
    constructor(name, system, cycle_count, cycle_limit) {
        super(name, system)
        this.cycle_count = cycle_count
        this.cycle_limit = cycle_limit
        console.log("RRScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        var cur_jobs = this.getCurrentJobs(available_jobs)
        this.queues[0] = [...cur_jobs]

        var last_process = this.queues[0][0]
        // New job so reset cyle count
        if (last_process != cur_jobs[0]) {
            this.cycle_count = 0
        }

        // Current job has run out of cycles so move it to the back of the line and reset count
        if (this.cycle_count >= this.cycle_limit) {
            cur_jobs.shift(cur_jobs.pop())
            this.cycle_count = 0
        } else {
            this.cycle_count++
        }

        var assignments = this.assignCPUJobs(cur_jobs, "rr")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }
}

// Priority scheduler maintains a queue of queues for each priority level
class PriorityScheduler extends FIFOScheduler {
    constructor(name, system, num_priority_levels) {
        super(name, system)
        this.num_priority_levels = num_priority_levels
        this.queues = []
        this.queue_names = []
        for(let i = 0; i < this.num_priority_levels; i++) {
            this.queue_names.push("Priority Queue " + i)
            this.queues.push([])
        }
        console.log("PriorityScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        var available_jobs_by_priority = this.getAvailableJobsByPriority(available_jobs)
        var cur_jobs_by_priority = this.getCurrentJobsByPriority(available_jobs_by_priority)

        // Copy current jobs to queues
        for (let i = 0; i < this.num_priority_levels; i++) {
            this.queues[i] = [...cur_jobs_by_priority[i]]
        }

        // Since jobs are in priority order, we can flatten it and treat it as normal FIFO assignment
        var assignments = this.assignCPUJobs(cur_jobs_by_priority.flat(), "fifo")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }

    // Returns available jobs as a list of lists of jobs by priority level (one list for each priority level)
    getAvailableJobsByPriority(available_jobs) {
        var available_jobs_by_priority = []
        for (let i = 0; i < this.num_priority_levels; i++) {
            available_jobs_by_priority.push([])
        }

        for (const job of available_jobs) {
            available_jobs_by_priority[job.priority].push(job)
        }
        return available_jobs_by_priority
    }

    // Returns a list of lists of current live jobs in FIFO order by priority level
    getCurrentJobsByPriority(available_jobs_by_priority) {
        var cur_jobs_by_priority = []
        for (let i = 0; i < this.num_priority_levels; i++) {
            cur_jobs_by_priority.push([])
        }
        var prev_jobs = this.queues[0]

        for (let i = 0; i < this.num_priority_levels; i++) {
            // Push previous jobs that are still live
            var prev_jobs = this.queues[i]
            for (const prev_job of prev_jobs) {
                if (this.job_exists(prev_job, available_jobs_by_priority[i])) {
                    cur_jobs_by_priority[i].push(prev_job)
                }
            }
    
            // Push remaining live jobs
            for (const available_job of available_jobs_by_priority[i]) {
                if (!this.job_exists(available_job, cur_jobs_by_priority[i])) {
                    cur_jobs_by_priority.push(available_job)
                }
            }
        }
        return cur_jobs_by_priority
    }
}


// CFS: every 20ms every process gets a little bit of time if they haven't had any

// SRTN
