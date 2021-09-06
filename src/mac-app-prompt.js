"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const util_1 = require("@core/util");
const enum_1 = require("@core/enum");
require("./api/global.js");
require("./api/kit.js");
require("./api/lib.js");
require("./os/mac.js");
require("./target/app.js");
let { script, args } = await new Promise((resolve, reject) => {
    let messageHandler = data => {
        if (data.channel === enum_1.Channel.VALUE_SUBMITTED) {
            process.off("message", messageHandler);
            resolve(data.value);
        }
    };
    process.on("message", messageHandler);
});
(0, dotenv_1.config)({
    path: process.env.KIT_DOTENV,
});
(0, util_1.assignPropsTo)(process.env, global.env);
await run(script, ...args);
