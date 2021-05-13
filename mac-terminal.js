import "./env.js";
import "./api/global.js";
import "./api/kit.js";
import "./api/k.js";
import "./os/mac.js";
import "./target/terminal.js";
let script = await arg("Path to script:");
await run(script);
