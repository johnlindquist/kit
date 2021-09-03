process.env.KIT =
    process.env.KIT_OVERRIDE ||
        path.dirname(new URL(import.meta.url).pathname);
process.env.KENV = process.env.KIT_TEST
    ? path.resolve(process.env.KIT, "test")
    : process.cwd();
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
//codegen
