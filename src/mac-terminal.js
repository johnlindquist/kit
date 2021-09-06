"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const util_1 = require("@core/util");
require("./api/global.js");
require("./api/kit.js");
require("./api/lib.js");
require("./os/mac.js");
require("./target/terminal.js");
(0, dotenv_1.config)({
    path: process.env.KIT_DOTENV || kenvPath(".env"),
});
(0, util_1.assignPropsTo)(process.env, global.env);
let script = await arg("Path to script:");
await run(script);
