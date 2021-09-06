"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
global.readFile = promises_1.readFile;
global.writeFile = promises_1.writeFile;
global.appendFile = promises_1.appendFile;
global.readdir = promises_1.readdir;
