import { Bin } from "kit-bridge/esm/enum";
import { createBinFromScript, selectScript, } from "../utils.js";
let type = await arg("Select type:", Object.values(Bin));
let script = await selectScript(`Create bin from which script?`, false);
await createBinFromScript(type, script);
