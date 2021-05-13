import { homedir } from "os";
import { resolve } from "path";
process.env.KIT = import.meta.url
    .replace("file://", "")
    .replace("env.js", "");
if (!process.env.KENV)
    process.env.KENV = resolve(homedir(), ".kenv");
