/*
current_proccesses = [
[job0, job1, job2]

*/

class Rectangle {
    constructor(job_number, run_time, arrival_time) {
        this.job_number = job_number
        this.orig_run_time = run_time
        this.run_time_left = run_time
        this.arrival_time = arrival_time
        this.finish_time = None
    }
}


function simulator() {


    list_of_objects = starting_objs
    while(1){
        // Prep info
        cycle++
        list_of_objects.update() // pull in procceses that just arrived, update any computations done on this end

        // Pass to selected schedular
        if(scheduler = 'fifo') {
            job_to_run = fifo(list_of_objects)
        }
        else if(scheduler == 'rr') {
            job_to_run = round_robin(list_of_objects)
        }
        else {
            // error
        }
        
        
        // Based on result add to final schedule list for gui demo
        job_to_run.add_to_results()

    }
}

simulator()