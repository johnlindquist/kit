import * as lib from "./merge-lib.js";
for (let fn of Object.keys(lib)) {
    ;
    global[fn] = lib[fn];
}
export * from "./merge-lib.js";
