"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@core/util");
let { default: enquirer } = (await Promise.resolve().then(() => __importStar(require("enquirer"))));
global.kitPrompt = async (config) => {
    if (config?.choices) {
        config = { ...config, type: "autocomplete" };
    }
    if (config?.secret) {
        config = { type: "password", ...config };
    }
    config = { type: "input", name: "value", ...config };
    if (typeof config.choices === "function") {
        let f = config.choices;
        if (config.choices.length === 0) {
            let choices = config.choices();
            if (typeof choices?.then === "function")
                choices = await choices;
            choices = choices.map(({ name, value }) => ({
                name,
                value,
            }));
            config = {
                ...config,
                choices,
            };
        }
        else {
            let suggest = global._.debounce(async function (input) {
                let results = await f(input.replace(/[^0-9a-z]/gi, ""));
                this.choices = await this.toChoices(results);
                await this.render();
                return this.choices;
            }, 250);
            config = {
                ...config,
                choices: [],
                suggest,
            };
        }
    }
    let promptConfig = {
        ...config,
        message: config.placeholder,
    };
    // TODO: Strip out enquirer autocomplete
    let { prompt } = enquirer;
    prompt.on("cancel", () => process.exit());
    let result = (await prompt(promptConfig));
    return result.value;
};
global.arg = async (messageOrConfig = "Input", choices) => {
    let firstArg = global.args.length
        ? global.args.shift()
        : null;
    if (firstArg) {
        let valid = true;
        if (typeof messageOrConfig !== "string" &&
            messageOrConfig?.validate) {
            let { validate } = messageOrConfig;
            let validOrMessage = await validate(firstArg);
            if (typeof validOrMessage === "string") {
                console.log(validOrMessage);
            }
            if (typeof validOrMessage === "string" ||
                !validOrMessage) {
                valid = false;
            }
        }
        if (valid) {
            return firstArg;
        }
    }
    let config = { placeholder: "" };
    if (typeof messageOrConfig === "string") {
        config.placeholder = messageOrConfig;
    }
    else {
        config = messageOrConfig;
    }
    config.choices = choices;
    let input = await global.kitPrompt(config);
    return input;
};
global.textarea = global.arg;
let { default: minimist } = (await Promise.resolve().then(() => __importStar(require("minimist"))));
global.args = [];
global.updateArgs = arrayOfArgs => {
    let argv = minimist(arrayOfArgs);
    global.args = [...argv._, ...global.args];
    global.argOpts = Object.entries(argv)
        .filter(([key]) => key != "_")
        .flatMap(([key, value]) => {
        if (typeof value === "boolean") {
            if (value)
                return [`--${key}`];
            if (!value)
                return [`--no-${key}`];
        }
        return [`--${key}`, value];
    });
    (0, util_1.assignPropsTo)(argv, global.arg);
    global.flag = { ...argv, ...global.flag };
    delete global.flag._;
};
global.updateArgs(process.argv.slice(2));
let terminalInstall = async (packageName) => {
    if (!global.flag?.trust) {
        let installMessage = global.chalk `\n{green ${global.kitScript}} needs to install the npm library: {yellow ${packageName}}`;
        let downloadsMessage = global.chalk `{yellow ${packageName}} has had {yellow ${(await get(`https://api.npmjs.org/downloads/point/last-week/` +
            packageName)).data.downloads}} downloads from npm in the past week`;
        let packageLink = `https://npmjs.com/package/${packageName}`;
        let readMore = global.chalk `
  Read more about {yellow ${packageName}} here: {yellow ${packageLink}}
  `;
        echo(installMessage);
        echo(downloadsMessage);
        echo(readMore);
        let message = global.chalk `Do you trust {yellow ${packageName}}?`;
        let config = {
            placeholder: message,
            choices: [
                { name: "No", value: false },
                { name: "Yes", value: true },
            ],
        };
        let trust = await global.kitPrompt(config);
        if (!trust) {
            echo(`Ok. Exiting...`);
            exit();
        }
    }
    echo(global.chalk `Installing {yellow ${packageName}} and continuing...`);
    await global.cli("install", packageName);
};
let { createNpm } = await Promise.resolve().then(() => __importStar(require("../api/npm.js")));
global.npm = createNpm(terminalInstall);
global.getBackgroundTasks = async () => ({
    channel: "",
    tasks: [],
});
global.getSchedule = async () => ({
    channel: "",
    schedule: [],
});
global.getScriptsState = async () => ({
    channel: "",
    tasks: [],
    schedule: [],
});
global.div = async (html = "", containerClasses = "") => {
    let { default: cliHtml } = await Promise.resolve().then(() => __importStar(require("cli-html")));
    console.log(cliHtml(html));
};
global.textarea = async () => {
    console.warn(`"textarea" is not support in the terminal`);
    exit();
};
global.editor = async () => {
    console.warn(`"editor" is not support in the terminal`);
    exit();
};
global.drop = async () => {
    console.warn(`"drop" is not support in the terminal`);
    exit();
};
