"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@core/db");
let kitPrefs = await (0, db_1.getPrefs)();
let selectedSetting = await arg("Which setting");
let value = await arg("Set to what?");
kitPrefs.data[selectedSetting] = value;
await kitPrefs.write();
