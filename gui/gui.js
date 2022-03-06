sim_result = {
    trace: [
        {
            queues: [ [1,2], [4,5,3] ],
            assignments: [ 1, 2, 4],
            processes: [ ],
            stats: {
                longest_wait: 0,
            }
        },
        {
            queues: [ [2], [4,5,3] ],
            assignments: [ 3, 2, 4],
            processes: [ ],
            stats: {
                longest_wait: 0,
            }
        },
    ],
    queue_names: [ "High priority", "Low Priority" ],
    stats: { // Overall
        longest_wait: 0,
    },
    system: {
        cpus: 3
    }
}