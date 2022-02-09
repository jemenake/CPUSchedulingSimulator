/*
current_proccesses = [
[job0, job1, job2]

*/

class Job {
    constructor(job_number, arrival_time, priority, lifecycle) {
        this.job_number = job_number
        this.arrival_time = arrival_time
        this.finish_time = None
        this.lifecycle = lifecycle
    }
}

starting_objs = [
    Job(0, 0, 3,[ "c3", "w2", "c4" ]),
    Job(1, 2, 3,[ "c8", "w12", "c24", "w1", "c1" ]),
    Job(2, 5, 3,[ "c22" ])
    ]

// Goals 
// 1. get FIFO working
// 2. Add multiple cores



function simulator() {
    var cycle = 0

    // Grab tasks that start at time zero if any
    current_jobs = [] 
    for(let job in starting_jobs){
        if (job.arrival_time == 0){
            current_jobs.push(job)
        }
    }

    // At this point, we have a list of jobs, and we can cycle through all of the schedulers
    array.forEach(scheduler => schedulers) {
        
    });

    console.log("Getting the scheduler ready")
    var the_schedule = [] // the complete trace that will be handed to the gui
    the_scheduler = FIFOScheduler()


        // This way requires schedule() to return an object representing the CPU assignements        the_schedule.append(the_scheduler.schedule(list_of_jobs))w
    // Loop until no more jobs
        // or....
        // This way, schedule() gets to modify the_schedule however it wants
        the_scheduler.schedule(list_of_jobs, the_schedule))

        // After we know what the_scheduler
    while(theist_of_objects)>0){
 wants in the CPUs, we should decrement the computneeded com   pute tie
        // [ "c3", "w2", "c4" ]
        // [ "c2", "w2", "c4" ]
        // [ "c1", "w2", "c4" ]
        // [ "w2", "c4" ]
        // [ "w1", "c4" ]
        // [ "c4" ]
        // [ "c4" ]
        // [ "c4" ]
        // [ "c4" ]
        // [ "c4" ]
        // [ "c3" ]

        // of each process in a CPU and decrement the wait time of everything else
        // For each job in starting_jobs:
        //    if job.lifecycle[0]m     my_awesome_scheduler.schedule() // <- Some kind of parameters (like the processes waiting for CPU) would go here

.startswith()""c" and sethe_scheduleis_scehduled()heduled()the_sceihedult,e, 
        //.      get number after 'c'
        //.      if number is 1, then delete this string from lifecycle (eg. job.lifecycle.shift())
        //.      otherwise, replace job.lifecycle[0] with "c"+(number - 1)
        //    else if job.lifecycle[0].startswith("w")
        //.      get number after 'w'
        //.      if number is 1, then delete this string from lifecycle (eg. job.lifecycle.shift())
        //.      otherwise, replace job.lifecycle[0] with "w"+(number - 1)
        

//         // // Pass to selected schedular
        // if(scheduler = 'fifo') {
        //     job_to_run = fifo(list_of_objects)
        // }
        // else if(scheduler == 'rr') {
        //     job_to_run = round_robin(list_of_objects)
        // }
        // else {
        //     throw new UserException('Invalid Scheduler Type')
        }
        
        
        // Based on result add to final schedule list for gui demo
        job_to_run.add_to_results()

        // Prep info
        cycle++
        for(let job in starting_objs){


        // Append to the_schedule whatever the process->CPU assignments are for this cycle            if (job.arrival_time == cycle){
                current_jobs.push(job)
    // Give the resulting schedule to the UI 

           }
        }
        list_of_objects // pull in procceses that just arrived, update any computations done on this end
    }
}
// 

simulator()