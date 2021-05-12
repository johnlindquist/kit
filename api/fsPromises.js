import { readFile, writeFile, appendFile, readdir, } from "fs/promises";
global.readFile = readFile;
global.writeFile = writeFile;
global.appendFile = appendFile;
global.readdir = readdir;
