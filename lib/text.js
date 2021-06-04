import { Channel } from "../enums.js";
export let getSelectedText = async () => {
    send(Channel.HIDE_APP);
    await applescript(String.raw `tell application "System Events" to keystroke "c" using command down`);
    let selectedText = await applescript(String.raw `get the clipboard`);
    return selectedText.trim();
};
/**
@param text - a string to paste at the cursor
@example
```
await setSelectedText(`Script Kit is awesome!`)
```
*/
export let setSelectedText = async (text) => {
    await applescript(String.raw `set the clipboard to "${text.replaceAll('"', '\\"')}"`);
    send(Channel.HIDE_APP);
    await applescript(String.raw `tell application "System Events" to keystroke "v" using command down`);
};
