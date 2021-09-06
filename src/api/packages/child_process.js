"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
global.spawn = child_process_1.spawn;
global.spawnSync = child_process_1.spawnSync;
global.fork = child_process_1.fork;
