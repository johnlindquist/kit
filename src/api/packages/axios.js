"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
global.get = axios_1.default.get;
global.put = axios_1.default.put;
global.post = axios_1.default.post;
global.patch = axios_1.default.patch;
