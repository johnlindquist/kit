import { spawn, spawnSync, fork } from "child_process"
global.spawn = spawn
global.spawnSync = spawnSync
global.fork = fork
