import { resolve } from "path";
import { config } from "dotenv";
import { homedir } from "os";
import "./api/global.js";
import "./api/kit.js";
import "./api/lib.js";
import "./os/mac.js";
import "./target/terminal.js";
import { assignPropsTo } from "./utils.js";
config({
    path: resolve(process.env.KENV || resolve(homedir(), ".kenv"), ".env"),
});
assignPropsTo(process.env, global.env);
let script = await arg("Path to script:");
await run(script);
