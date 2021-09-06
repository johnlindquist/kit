"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clipboardy_1 = require("clipboardy");
global.paste = clipboardy_1.read;
global.copy = clipboardy_1.write;
