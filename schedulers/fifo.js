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

// Random scheduler that randomly assigns jobs to each CPU
class RandomScheduler extends Scheduler {
    constructor(name, system) {
        super(name, system)
        console.log("RandomScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        this.logAvailableJobs(available_jobs)
        this.queues[0] = [...available_jobs] // Queue order doesn't matter so just assign it to live jobs
        let assignments = this.assignCPUJobs(available_jobs, "random")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }

    logAvailableJobs(available_jobs) {
        console.log("available_jobs = " + JSON.stringify(available_jobs))
        available_jobs.forEach((job) => {
            console.log("Live Job: " + job.job_number + " " + JSON.stringify(job.lifecycle))
        })
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
} 

// FIFO scheduler assigns jobs in a first-in-first-out manner
class FIFOScheduler extends RandomScheduler {
    constructor(name, system) {
        super(name, system)
        console.log("FIFOScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        super.logAvailableJobs(available_jobs)
        var cur_jobs = this.getCurrentJobs(available_jobs)
        this.queues[0] = [...cur_jobs]
        var assignments = super.assignCPUJobs(cur_jobs, "fifo")
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
    job_exists(jobA, jobs) {
        return jobs.some((jobB) => jobA.job_number == jobB.job_number)
     }
}

// Round-Robin scheduler alots a certain number of cyles for each process, and switches to the next process in line once that limit is hit
class RRScheduler extends FIFOScheduler {
    constructor(name, system, cycle_limit) {
        super(name, system)
        this.cycle_count = 0
        this.cycle_limit = cycle_limit
        console.log("RRScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        super.logAvailableJobs(available_jobs)
        var cur_jobs = this.getCurrentJobs(available_jobs)

        // Only need to check cycles if this isn't the first cycle and there is more than one job
        if (this.queues[0].length > 0 && cur_jobs.length > 1) {
            var last_process = this.queues[0][0]
            // New job so reset cyle count
            if (last_process.job_number != cur_jobs[0].job_number) {
                this.cycle_count = 0
            }
    
            // Current job has run out of cycles so rotate jobs and reset count
            if (this.cycle_count >= this.cycle_limit) {
                cur_jobs.push(cur_jobs.shift())
                this.cycle_count = 0
            }
        }
        this.cycle_count++

        this.queues[0] = [...cur_jobs] // Saves potentially shifted jobs
        var assignments = this.assignCPUJobs(cur_jobs, "rr")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }
}

// Multi scheduler maintains a queue of queues for each priority level
class MultiFIFOScheduler extends FIFOScheduler {
    constructor(name, system) {
        super(name, system)
        this.queues = []
        this.queue_names = []
        for(let i = 0; i < this.system.cpus.length; i++) {
            this.queue_names.push("CPU" + i + " Queue")
            this.queues.push([])
        }
        console.log("PriorityScheduler constructor")
    }

    schedule(system_state) {
        var available_jobs = system_state.getRunningJobs()
        super.logAvailableJobs(available_jobs)
        var prev_jobs_live = this.getPrevJobsMulti(available_jobs)
        var cur_jobs = this.getCurrentJobsMulti(prev_jobs_live, available_jobs)
        for (let i = 0; i < this.queues.length; i++) {
            this.queues[i] = [...cur_jobs[i]]
        }

        var assignments = super.assignCPUJobs(this.flattenByCol(cur_jobs), "fifo")
        return {
            "queues": this.queues,
            "queue_names": this.queue_names,
            "assignments": assignments
        }
    }

    // Returns a list of lists of previous jobs that are still live
    getPrevJobsMulti(available_jobs) {
        prev_jobs_live = Array.from(Array(this.queues.length), () => [])

        // Only add previous jobs that are still live
        for (let i = 0; i < this.queues.length; i++) {
            for (let j = 0; j < this.queues[i].length; j++) {
                if (this.job_exists(this.queues[i][j], available_jobs)) {
                    prev_jobs_live[i].push(this.queues[i][j])
                }
            }
        }
        return prev_jobs_live
    }

    // Returns an updated list of current jobs by adding on new jobs to previous
    getCurrentJobsMulti(prev_jobs_live, available_jobs) {
        new_jobs = getNewJobs(prev_jobs_live, available_jobs)
        for (job of new_jobs) {
            best_index = this.shortestListIndex(prev_jobs_live)
            prev_jobs_live[best_index].push(job)
        }
        return prev_jobs_live
    }

    // Returns a list of jobs that are available but not in previous jobs
    getNewJobs(prev_jobs_live, available_jobs) {
        return available_jobs.filter(x => !prev_jobs_live.flat().includes(x))
    }

    // Takes a list of lists and returns a list of all elements in column order
    // Ex: [[1,2], [3,4], [5]] => [1,3,5,2,4]
    flattenByCol(lists) {
        flattened = []
        for (let col = 0; col < this.longestLengthList(lists); col++) {
            for (let row = 0; row < lists.length; row++) {
                if (col < lists[row].length) {
                    flattened.push(lists[row][col])
                }
            }
        }
        return flattened
    }

    // Returns index of the shortest list of a list of lists
    shortestListIndex(lists) {
        min_len = lists[0].length
        min_index = 0
        for (let i = 1; i < lists.length; i++) {
            if (lists[i].length < min_len) {
                min_len = lists[i].length
                min_index = i
            }
        }
        return min_index
    }

    // Returns length of longest list in a list of irregular length lists
    longestLengthList(lists) {
        max_len = lists[0].length
        max_index = 0
        for (let i = 1; i < lists.length; i++) {
            if (lists[i].length > max_len) {
                max_len = lists[i].length
                max_index = i
            }
        }
        return max_len
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
        super.logAvailableJobs(available_jobs)
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
        var cur_jobs_by_priority = Array.from(Array(this.num_priority_levels), () => [])
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
