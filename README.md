# CSC550_Project

TODO:
  - Something to generate a process lifecycle (given some rand seed, and, later, maybe
    some other weights for the blend of high/low priority?)

// For describing the pattern of computation and waiting for each process
// This is generated and fed to the simulator
// An array of hashtables.
process_lifecycles = [
[
   { // Process 0. Starts at clock cycle 0. Computes for 3 cycles, waits for 2, computes for 4, and ends.
      "start_time":0,
      "priority":0,
      "lifecycle":[ "c3", "w2", "c4" ]
   },
   { // Process 1.
      "start_time":10,
      "priority":-10,
      "lifecycle":[ "c8", "w12", "c24", "w1", "c1" ]
   },
   { // Process 2.
      "start_time":11,
      "priority":10,
      "lifecycle":[ "c22" ]
   },
   ...
]

When the scheduler is fed the process lifecycles, it generates a schedule of
where all of the processes were at every cpu cycle

Simulator is fed a process_lifecycle and a scheduler and it, in iterations, calls the 
scheduler with:
 - all processes needing computation (how long they've been waiting, arrival time, priority, last CPU they ran on)
   - longest_wait time
   - current_wait
   - ...
 - What the run queues looked like last cycle

// An array where the index is what is in the queue for each cpu and what's waiting
// First element of each cpu array is what's in the cpu. The rest is what's waiting
schedule = [
   {
      // CPU cycle 0
      "cpus":[
         [ 4, 3, 1 ],    // CPU0 has process 4 in core. Process 3 and 1 are in the queue
         [ 10, 2. 6, 8], // CPU1 has process 10 in core. Process 2, 6, and 8 are in the queue
         ...
      ],
      "waiting":
         [ 11, 12, 5 ] // Processes 11, 12, and 5 are waiting for some I/O or interrupt
      "totals":
         {
            "average_wait": ...
            "longest_wait": ...
         }
      "processes": {
         "longest_wait": ...
         "average_wait": ...
      }
   },
   {
      // CPU cycle 1
   },
   ...
]

DEEP COPIES

This then gets fed into the UI so that users can view the results.
