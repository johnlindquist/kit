"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSelectedText = exports.getSelectedText = void 0;
const enum_1 = require("@core/enum");
let getSelectedText = async () => {
    send(enum_1.Channel.HIDE_APP);
    await applescript(String.raw `tell application "System Events" to keystroke "c" using command down`);
    return await paste();
};
exports.getSelectedText = getSelectedText;
/**
@param text - a string to paste at the cursor
@example
```
await setSelectedText(`Script Kit is awesome!`)
```
*/
let setSelectedText = async (text) => {
    send(enum_1.Channel.HIDE_APP);
    await applescript(String.raw `set the clipboard to "${text.replaceAll('"', '\\"')}"`);
    await applescript(String.raw `tell application "System Events" to keystroke "v" using command down`);
    await applescript(String.raw `set the clipboard to ""`);
};
exports.setSelectedText = setSelectedText;
