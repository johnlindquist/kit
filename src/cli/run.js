"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Description: Run the selected script
const db_1 = require("@core/db");
let command = await arg(`Which script do you want to run?`, (0, db_1.scriptValue)("command"));
await run(command);
