#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { globby } from "globby";
import { readFileSync } from "fs";
import { join } from "path";
import { runScriptWithResult } from "../core/script-runner.test.js";
import { parseScriptFile } from "./script-discovery.test.js";
async function discoverAllScripts(directory) {
    const scriptPaths = await globby(['**/*.js', '**/*.ts'], {
        cwd: directory,
        ignore: ['node_modules/**', '**/*.test.js', '**/*.test.ts']
    });
    const scripts = [];
    for (const scriptPath of scriptPaths) {
        try {
            const fullPath = join(directory, scriptPath);
            const content = readFileSync(fullPath, 'utf-8');
            const script = await parseScriptFile(fullPath, content);
            scripts.push(script);
        }
        catch (error) {
            console.error(`Failed to parse script ${scriptPath}:`, error);
        }
    }
    return scripts;
}
function createToolSchema(script) {
    const properties = {};
    script.placeholders.forEach((placeholder, index) => {
        const paramName = placeholder.name || `arg${index + 1}`;
        properties[paramName] = z.string().describe(placeholder.placeholder || `Argument ${index + 1}`);
    });
    return z.object(properties);
}
async function main() {
    // Create MCP server
    const server = new McpServer({
        name: "script-kit-mcp",
        version: "1.0.0"
    });
    // Discover scripts from ~/.kenv/scripts
    const kenvPath = process.env.KENV || join(process.env.HOME || '', '.kenv');
    const scriptsDir = join(kenvPath, 'scripts');
    console.error(`Discovering scripts in ${scriptsDir}...`);
    const scripts = await discoverAllScripts(scriptsDir);
    console.error(`Found ${scripts.length} scripts`);
    // Register each script as a tool
    for (const script of scripts) {
        const schema = createToolSchema(script);
        server.tool(script.name.replace(/\s+/g, '-').toLowerCase(), script.metadata?.description || `Run the ${script.name} Script Kit script`, schema.shape, async (params) => {
            // Convert parameters to args array
            const args = script.placeholders.map((placeholder, index) => {
                const paramName = placeholder.name || `arg${index + 1}`;
                return params[paramName] || '';
            });
            try {
                // Run the actual script
                const result = await runScriptWithResult(script.filePath, args);
                return {
                    content: [{
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error running script: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        });
        console.error(`Registered tool: ${script.name}`);
    }
    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Script Kit MCP server started");
}
// Run the server
main().catch(error => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
