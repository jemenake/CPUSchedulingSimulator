sim_result = {
    trace: [
        {
            queues: [ [1,2], [4,5,3] ],
            assignments: [ 1, 2, 4],
            processes: [ ],
            wait_queue: [ ],
            stats: {
                longest_wait: 0,
            }
        },
        {
            queues: [ [2], [4,5,3] ],
            assignments: [ 3, 2, 4],
            processes: [ ],
            wait_queue: [ ],
            stats: {
                longest_wait: 0,
            }
        },
    ],
    scheduler_name: "FIFO Scheduler",
    queue_names: [ "High priority", "Low Priority" ],
    stats: { // Overall
        longest_wait: 0,
    },
    system: {
        cpus: 3
    }
}