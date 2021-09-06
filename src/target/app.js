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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const enum_1 = require("@core/enum");
const util_1 = require("@core/util");
let displayChoices = (choices, className = "") => {
    switch (typeof choices) {
        case "string":
            global.setPanel(choices, className);
            break;
        case "object":
            global.setChoices(choices, className);
            break;
    }
};
let promptId = 0;
let invokeChoices = ({ ct, choices, className }) => async (input) => {
    let resultOrPromise = choices(input);
    if (resultOrPromise && resultOrPromise.then) {
        let result = await resultOrPromise;
        if (ct.promptId === promptId &&
            ct.tabIndex === global.onTabIndex) {
            displayChoices(result, className);
            return result;
        }
    }
    else {
        displayChoices(resultOrPromise, className);
        return resultOrPromise;
    }
};
let getInitialChoices = async ({ ct, choices, className, }) => {
    if (typeof choices === "function") {
        return await invokeChoices({ ct, choices, className })("");
    }
    else {
        displayChoices(choices, className);
        return choices;
    }
};
let waitForPromptValue = ({ choices, validate, ui, className, }) => new Promise((resolve, reject) => {
    promptId++;
    let ct = {
        promptId,
        tabIndex: global.onTabIndex,
    };
    let process$ = new rxjs_1.Observable(observer => {
        let m = (data) => observer.next(data);
        let e = (error) => observer.error(error);
        process.on("message", m);
        process.on("error", e);
        return () => {
            process.off("message", m);
            process.off("error", e);
        };
    }).pipe((0, operators_1.switchMap)(data => (0, rxjs_1.of)(data)), (0, operators_1.share)());
    let tab$ = process$.pipe((0, operators_1.filter)(data => data.channel === enum_1.Channel.TAB_CHANGED), (0, operators_1.tap)(data => {
        let tabIndex = global.onTabs.findIndex(({ name }) => {
            return name == data?.tab;
        });
        // console.log(`\nUPDATING TAB: ${tabIndex}`)
        global.onTabIndex = tabIndex;
        global.currentOnTab = global.onTabs[tabIndex].fn(data?.input);
    }), (0, operators_1.share)());
    let message$ = process$.pipe((0, operators_1.share)(), (0, operators_1.takeUntil)(tab$));
    let generate$ = message$.pipe((0, operators_1.filter)(data => data.channel === enum_1.Channel.GENERATE_CHOICES), (0, operators_1.map)(data => data.input), (0, operators_1.switchMap)(input => {
        let ct = {
            promptId,
            tabIndex: +Number(global.onTabIndex),
        };
        return invokeChoices({ ct, choices, className })(input);
    }), (0, operators_1.switchMap)(choice => rxjs_1.NEVER));
    let valueSubmitted$ = message$.pipe((0, operators_1.filter)(data => data.channel === enum_1.Channel.VALUE_SUBMITTED));
    let value$ = valueSubmitted$.pipe((0, operators_1.tap)(data => {
        if (data.flag) {
            global.flag[data.flag] = true;
        }
    }), (0, operators_1.map)(data => data.value), (0, operators_1.switchMap)(async (value) => {
        if (validate) {
            let validateMessage = await validate(value);
            if (typeof validateMessage === "string") {
                let Convert = await npm("ansi-to-html");
                let convert = new Convert();
                global.setHint(convert.toHtml(validateMessage));
                global.setChoices(global.kitPrevChoices);
            }
            else {
                return value;
            }
        }
        else {
            return value;
        }
    }), (0, operators_1.filter)(value => typeof value !== "undefined"), (0, operators_1.take)(1));
    let blur$ = message$.pipe((0, operators_1.filter)(data => data.channel === enum_1.Channel.PROMPT_BLURRED));
    blur$.pipe((0, operators_1.takeUntil)(value$)).subscribe({
        next: () => {
            exit();
        },
    });
    generate$.pipe((0, operators_1.takeUntil)(value$)).subscribe();
    let initialChoices$ = (0, rxjs_1.of)({
        ct,
        choices,
        className,
    }).pipe(
    // filter(() => ui === UI.arg),
    (0, operators_1.switchMap)(getInitialChoices));
    initialChoices$.pipe((0, operators_1.takeUntil)(value$)).subscribe();
    (0, rxjs_1.merge)(value$).subscribe({
        next: value => {
            resolve(value);
        },
        complete: () => {
            // console.log(`Complete: ${promptId}`)
        },
        error: error => {
            reject(error);
        },
    });
});
global.kitPrompt = async (config) => {
    await wait(0); //need to let tabs finish...
    let { ui = enum_1.UI.arg, placeholder = "", validate = null, strict = Boolean(config?.choices), choices: choices = [], secret = false, hint = "", input = "", ignoreBlur = false, mode = enum_1.Mode.FILTER, className = "", flags = undefined, selected = "", type = "text", } = config;
    if (flags) {
        setFlags(flags);
    }
    global.setMode(typeof choices === "function" && choices?.length > 0
        ? enum_1.Mode.GENERATE
        : mode);
    let tabs = global.onTabs?.length
        ? global.onTabs.map(({ name }) => name)
        : [];
    global.send(enum_1.Channel.SET_PROMPT_DATA, {
        tabs,
        tabIndex: global.onTabs?.findIndex(({ name }) => global.arg?.tab),
        placeholder: (0, strip_ansi_1.default)(placeholder),
        kitScript: global.kitScript,
        parentScript: global.env.KIT_PARENT_NAME,
        kitArgs: global.args.join(" "),
        secret,
        ui,
        strict,
        selected,
        type,
        ignoreBlur,
    });
    global.setHint(hint);
    if (input)
        global.setInput(input);
    if (ignoreBlur)
        global.setIgnoreBlur(true);
    return await waitForPromptValue({
        choices,
        validate,
        ui,
        className,
    });
};
global.drop = async (placeholder = "Waiting for drop...") => {
    return await global.kitPrompt({
        ui: enum_1.UI.drop,
        placeholder,
        ignoreBlur: true,
    });
};
global.form = async (html = "", formData = {}) => {
    send(enum_1.Channel.SET_FORM_HTML, { html, formData });
    return await global.kitPrompt({
        ui: enum_1.UI.form,
    });
};
global.div = async (html = "", containerClasses = "") => {
    let wrapHtml = `<div class="${containerClasses}">${html}</div>`;
    return await global.kitPrompt({
        choices: wrapHtml,
        ui: enum_1.UI.div,
    });
};
global.editor = async (options = {
    value: "",
    language: "",
    scrollTo: "top",
}) => {
    send(enum_1.Channel.SET_EDITOR_CONFIG, {
        options: typeof options === "string"
            ? { value: options }
            : options,
    });
    return await global.kitPrompt({
        ui: enum_1.UI.editor,
        ignoreBlur: true,
    });
};
global.hotkey = async (placeholder = "Press a key combo:") => {
    return await global.kitPrompt({
        ui: enum_1.UI.hotkey,
        placeholder,
    });
};
global.arg = async (placeholderOrConfig = "Type a value:", choices) => {
    let firstArg = global.args.length
        ? global.args.shift()
        : null;
    if (firstArg) {
        let validate = placeholderOrConfig
            ?.validate;
        if (typeof validate === "function") {
            let valid = await validate(firstArg);
            if (valid === true)
                return firstArg;
            let Convert = await npm("ansi-to-html");
            let convert = new Convert();
            let hint = valid === false
                ? `${firstArg} is not a valid value`
                : convert.toHtml(valid);
            return global.arg({
                ...placeholderOrConfig,
                hint,
            });
        }
        else {
            return firstArg;
        }
    }
    // if (firstArg) {
    //   let valid = true
    //   if (
    //     typeof placeholderOrConfig !== "string" &&
    //     placeholderOrConfig?.validate
    //   ) {
    //     let { validate } = placeholderOrConfig
    //     let validOrMessage = await validate(firstArg)
    //     valid =
    //       typeof validOrMessage === "boolean" &&
    //       validOrMessage
    //     if (typeof validOrMessage === "string")
    //       placeholderOrValidateMessage = validOrMessage
    //   }
    //   if (valid) {
    //     return firstArg
    //   }
    // }
    if (typeof placeholderOrConfig === "string") {
        return await global.kitPrompt({
            ui: enum_1.UI.arg,
            placeholder: placeholderOrConfig,
            choices: choices,
        });
    }
    return await global.kitPrompt({
        choices: choices,
        ...placeholderOrConfig,
    });
};
global.textarea = async (options = {
    value: "",
    placeholder: `cmd + s to submit\ncmd + w to close`,
}) => {
    send(enum_1.Channel.SET_TEXTAREA_CONFIG, {
        options: typeof options === "string"
            ? { value: options }
            : options,
    });
    return await global.kitPrompt({
        ui: enum_1.UI.textarea,
        ignoreBlur: true,
    });
};
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
let appInstall = async (packageName) => {
    if (!global.arg?.trust) {
        let placeholder = `${packageName} is required for this script`;
        let packageLink = `https://npmjs.com/package/${packageName}`;
        let hint = `[${packageName}](${packageLink}) has had ${(await get(`https://api.npmjs.org/downloads/point/last-week/` +
            packageName)).data.downloads} downloads from npm in the past week`;
        let trust = await global.arg({ placeholder, hint: md(hint) }, [
            {
                name: `Abort`,
                value: "false",
            },
            {
                name: `Install ${packageName}`,
                value: "true",
            },
        ]);
        if (trust === "false") {
            echo(`Ok. Exiting...`);
            exit();
        }
    }
    setHint(`Installing ${packageName}...`);
    await global.cli("install", packageName);
};
let { createNpm } = await Promise.resolve().then(() => __importStar(require("../api/npm.js")));
global.npm = createNpm(appInstall);
global.setPanel = async (html, containerClasses = "") => {
    let wrapHtml = `<div class="${containerClasses}">${html}</div>`;
    global.send(enum_1.Channel.SET_PANEL, {
        html: wrapHtml,
    });
};
global.setMode = async (mode) => {
    global.send(enum_1.Channel.SET_MODE, {
        mode,
    });
};
global.setHint = async (hint) => {
    global.send(enum_1.Channel.SET_HINT, {
        hint,
    });
};
global.setInput = async (input) => {
    global.send(enum_1.Channel.SET_INPUT, {
        input,
    });
};
global.setIgnoreBlur = async (ignore) => {
    global.send(enum_1.Channel.SET_IGNORE_BLUR, { ignore });
};
global.getDataFromApp = async (channel) => {
    if (process?.send) {
        return await new Promise((res, rej) => {
            let messageHandler = data => {
                if (data.channel === channel) {
                    res(data);
                    process.off("message", messageHandler);
                }
            };
            process.on("message", messageHandler);
            send(`GET_${channel}`);
        });
    }
    else {
        return {};
    }
};
global.getBackgroundTasks = () => global.getDataFromApp("BACKGROUND");
global.getSchedule = () => global.getDataFromApp("SCHEDULE");
global.getScriptsState = () => global.getDataFromApp("SCRIPTS_STATE");
