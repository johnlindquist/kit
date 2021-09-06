"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enum_1 = require("@core/enum");
let kitAppDb = await db(kitPath("db", "app.json"));
let kenv = await arg({
    placeholder: `Select kenv`,
    hint: `Current Kenv: ${process.env.KENV}`,
}, kitAppDb.KENVS);
global.send(enum_1.Channel.SWITCH_KENV, { kenvPath: kenv });
