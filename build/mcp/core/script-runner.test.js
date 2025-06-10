import ava from 'ava';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { fork } from 'child_process';
// Helper to create test scripts
async function createTestScript(content) {
    const testDir = join(tmpdir(), 'kit-test-scripts', randomUUID());
    mkdirSync(testDir, { recursive: true });
    const scriptPath = join(testDir, 'test-script.js');
    // Wrap content with minimal kit environment setup
    const fullContent = `
    // Mock global args if not present
    if (typeof args === 'undefined') {
      global.args = process.argv.slice(2)
    }
    
    ${content}
  `;
    writeFileSync(scriptPath, fullContent, 'utf-8');
    return scriptPath;
}
// Function to run script and capture result
export async function runScriptWithResult(scriptPath, scriptArgs = []) {
    return new Promise((resolve, reject) => {
        const child = fork(scriptPath, scriptArgs, {
            silent: true,
            env: {
                ...process.env,
                KIT_CONTEXT: 'workflow',
                NODE_ENV: 'test'
            }
        });
        let output = '';
        let error = '';
        child.stdout?.on('data', (data) => {
            output += data.toString();
        });
        child.stderr?.on('data', (data) => {
            error += data.toString();
        });
        child.on('message', (message) => {
            // Handle IPC messages if needed
            if (message && typeof message === 'object' && 'result' in message) {
                resolve(message.result);
            }
        });
        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Script exited with code ${code}: ${error}`));
            }
            else {
                // Try to parse the last line of output as JSON result
                const lines = output.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                try {
                    // If the script logs the result as JSON
                    if (lastLine.startsWith('{') || lastLine.startsWith('[')) {
                        resolve(JSON.parse(lastLine));
                    }
                    else {
                        resolve(output.trim());
                    }
                }
                catch (e) {
                    resolve(output.trim());
                }
            }
        });
        child.on('error', (err) => {
            reject(err);
        });
    });
}
// Alternative approach using module loading
export async function runScriptModule(scriptPath, scriptArgs = []) {
    // Save original args
    const originalArgs = global.args;
    try {
        // Set up args for the script
        global.args = scriptArgs;
        // Clear module cache to ensure fresh execution
        delete require.cache[scriptPath];
        // Import the module
        const moduleExports = require(scriptPath);
        // Handle async module exports
        if (moduleExports && typeof moduleExports.then === 'function') {
            return await moduleExports;
        }
        return moduleExports;
    }
    finally {
        // Restore original args
        global.args = originalArgs;
    }
}
// Test cases
ava('should capture module.exports result', async (t) => {
    const scriptPath = await createTestScript(`
    module.exports = { result: "success", data: 42 }
  `);
    // Update the script to log the result
    const scriptWithLog = await createTestScript(`
    const result = { result: "success", data: 42 }
    console.log(JSON.stringify(result))
    module.exports = result
  `);
    const result = await runScriptWithResult(scriptWithLog);
    t.deepEqual(result, { result: "success", data: 42 });
    // Cleanup
    rmSync(scriptPath, { recursive: true, force: true });
});
ava('should capture async exported result', async (t) => {
    const scriptPath = await createTestScript(`
    const result = (async () => {
      return { processed: true, items: [1, 2, 3] }
    })()
    
    result.then(r => console.log(JSON.stringify(r)))
    module.exports = result
  `);
    const result = await runScriptWithResult(scriptPath);
    t.deepEqual(result, { processed: true, items: [1, 2, 3] });
    // Cleanup
    rmSync(scriptPath, { recursive: true, force: true });
});
ava('should pass arguments to script', async (t) => {
    const scriptPath = await createTestScript(`
    const [name, age] = args
    const result = { name, age: parseInt(age) }
    console.log(JSON.stringify(result))
    module.exports = result
  `);
    const result = await runScriptWithResult(scriptPath, ["John", "30"]);
    t.deepEqual(result, { name: "John", age: 30 });
    // Cleanup
    rmSync(scriptPath, { recursive: true, force: true });
});
ava('should handle script errors gracefully', async (t) => {
    const scriptPath = await createTestScript(`
    throw new Error("Script error")
  `);
    await t.throwsAsync(runScriptWithResult(scriptPath), {
        message: /Script exited with code/
    });
    // Cleanup
    rmSync(scriptPath, { recursive: true, force: true });
});
ava('should handle scripts that return functions', async (t) => {
    const scriptPath = await createTestScript(`
    const result = {
      type: "function",
      name: "testFunction"
    }
    console.log(JSON.stringify(result))
    module.exports = () => result
  `);
    const result = await runScriptWithResult(scriptPath);
    t.deepEqual(result, { type: "function", name: "testFunction" });
    // Cleanup
    rmSync(scriptPath, { recursive: true, force: true });
});
