"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.KIT =
    process.env.KIT_OVERRIDE ||
        path.dirname(new URL(import.meta.url).pathname);
process.env.KENV = process.env.KIT_TEST
    ? path.resolve(process.cwd(), "test")
    : process.cwd();
const dotenv_1 = require("dotenv");
const util_1 = require("@core/util");
require("./api/global.js");
require("./api/kit.js");
require("./api/lib.js");
require("./target/terminal.js");
(0, dotenv_1.config)({
    path: process.env.KIT_DOTENV || kenvPath(".env"),
});
(0, util_1.assignPropsTo)(process.env, global.env);
//codegen
