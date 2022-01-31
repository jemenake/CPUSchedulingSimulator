



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