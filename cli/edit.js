// Description: Opens the selected script in your editor
import { selectScript } from "../utils.js";
let script = await selectScript(`Select script to open in ${env.KIT_EDITOR}?`);
edit(await script.filePath, kenvPath());
