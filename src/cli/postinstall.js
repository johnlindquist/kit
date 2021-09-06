"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log(`Starting postinstall`);
let tmpScriptsPath = kitPath("tmp", "scripts");
cp(kenvPath("scripts/*"), tmpScriptsPath);
