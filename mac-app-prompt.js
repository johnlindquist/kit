import "./api/global.js";
import "./api/kit.js";
import "./api/lib.js";
import { Channel } from "./enums.js";
import "./os/mac.js";
import "./target/app.js";
let { script, args } = await new Promise((resolve, reject) => {
    let messageHandler = data => {
        if (data.channel === Channel.VALUE_SUBMITTED) {
            process.off("message", messageHandler);
            resolve(data.value);
        }
    };
    process.on("message", messageHandler);
});
await run(script, ...args);
