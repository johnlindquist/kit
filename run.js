console.log(`⚠️ KIT:`, process.env.KIT);
console.log(`❤️ import.meta.url`, new URL(import.meta.url).pathname);
if (!process.env?.KIT) {
    process.env.KIT = path.dirname(new URL(import.meta.url).pathname);
}
if (!process.env?.KENV) {
    process.env.KENV = process.cwd();
}
import { config } from "dotenv";
import { assignPropsTo } from "kit-bridge/esm/util";
import "./api/global.js";
import "./api/kit.js";
import "./api/lib.js";
import "./target/terminal.js";
config({
    path: process.env.KIT_DOTENV || kenvPath(".env"),
});
assignPropsTo(process.env, global.env);
