import { getLastSlashSeparated } from "../utils.js";
let { getKenvs } = await import("../utils.js");
let dir = await arg("Remove which kenv", (await getKenvs()).map(value => ({
    name: getLastSlashSeparated(value, 1),
    value,
})));
await trash(dir);
