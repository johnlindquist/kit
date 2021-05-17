import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./os/mac.js"
import "./target/app.js"

let script = await arg("Path to script:")
await run(script)
