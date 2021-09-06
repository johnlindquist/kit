"use strict";
// Description: Toggle Open at Login
Object.defineProperty(exports, "__esModule", { value: true });
const enum_1 = require("@core/enum");
const db_1 = require("@core/db");
let { openAtLogin } = await (0, db_1.getAppDb)();
let placeholder = `"Open at login" is ${openAtLogin ? "en" : "dis"}abled`;
let toggle = await arg(placeholder, [
    {
        name: "Enable",
        value: true,
    },
    {
        name: "Disable",
        value: false,
    },
]);
send(enum_1.Channel.SET_LOGIN, { openAtLogin: toggle });
