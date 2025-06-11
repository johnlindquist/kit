#!/usr/bin/env node

// src/run/script-runner-mcp.ts
import { pathToFileURL } from "url";
import { Console } from "console";
import { Writable } from "stream";
import "@johnlindquist/kit";
var capturedOutput = "";
var originalConsoleLog = console.log;
var outputStream = new Writable({
  write(chunk, encoding, callback) {
    capturedOutput += chunk.toString();
    callback();
  }
});
var captureConsole = new Console({ stdout: outputStream, stderr: outputStream });
console.log = (...args) => {
  captureConsole.log(...args);
  console.error("[console.log]", ...args);
};
async function runScript() {
  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.error("No script path provided");
    process.exit(1);
  }
  const scriptArgs = process.argv.slice(3);
  try {
    global.args = scriptArgs;
    let argIndex = 0;
    global.arg = async (prompt) => {
      const promptText = typeof prompt === "string" ? prompt : prompt?.placeholder || "Input";
      console.error(`[arg] prompt: "${promptText}", returning: "${scriptArgs[argIndex] || ""}"`);
      return scriptArgs[argIndex++] || "";
    };
    const scriptUrl = pathToFileURL(scriptPath).href;
    console.error(`[runner] Importing script: ${scriptUrl}`);
    const module = await import(scriptUrl);
    let result = module.default;
    if (result === void 0 && Object.keys(module).length > 0) {
      const firstExport = Object.keys(module).find((key) => key !== "default");
      if (firstExport) {
        result = module[firstExport];
      }
    }
    if (result === void 0 && capturedOutput) {
      const trimmed = capturedOutput.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          result = JSON.parse(trimmed);
        } catch (e) {
          result = trimmed;
        }
      } else {
        result = trimmed;
      }
    }
    console.log = originalConsoleLog;
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error("[runner] Error:", error);
    console.log = originalConsoleLog;
    console.log(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
runScript();
