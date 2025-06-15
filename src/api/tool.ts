import type { Tool } from "../types/globals"

// Store tool definitions for MCP registration
export const toolDefinitions = new Map<string, Tool>()

// Helper function to get parameter names from Tool's inputSchema
function getParameterNames(config: Tool): string[] {
  if (!config.inputSchema?.properties) return []
  return Object.keys(config.inputSchema.properties)
}

// Helper function to get parameter info from inputSchema
function getParameterInfo(config: Tool, name: string): any {
  if (!config.inputSchema?.properties) return {}
  return config.inputSchema.properties[name] || {}
}

export async function tool<T = Record<string, any>>(
  config: Tool
): Promise<T> {
  // Validate config
  if (!config.name) {
    throw new Error("Tool requires a name")
  }

  // Register tool definition for MCP discovery
  toolDefinitions.set(config.name, config)

  // Check if we're being called via MCP
  // First check headers (from HTTP server)
  if (global.headers && global.headers['X-MCP-Tool'] === config.name && global.headers['X-MCP-Parameters']) {
    try {
      const parameters = JSON.parse(global.headers['X-MCP-Parameters'])
      return parameters as T
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Fallback: if all declared parameters are already present in global.headers
  // use them even when the sentinel keys are missing.
  const parameterNames = getParameterNames(config)
  if (
    global.headers &&
    !global.headers['X-MCP-Tool'] &&
    parameterNames.length > 0 &&
    parameterNames.every(k => k in global.headers)
  ) {
    return global.headers as unknown as T;
  }

  // Then check environment variable (for direct MCP calls)
  if (process.env.KIT_MCP_CALL) {
    try {
      const mcpCall = JSON.parse(process.env.KIT_MCP_CALL)
      if (mcpCall.tool === config.name) {
        // Return the parameters passed from MCP
        return mcpCall.parameters as T
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Check if parameters were passed via CLI args
  const cliParams = await parseCliParameters(config)
  if (cliParams) {
    return cliParams as T
  }

  // Otherwise, prompt the user for parameters
  return await promptForParameters(config)
}

async function parseCliParameters<T>(config: Tool): Promise<T | null> {
  const args = process.argv.slice(2)
  if (args.length === 0) return null

  const params: any = {}
  let hasParams = false
  const parameterNames = getParameterNames(config)

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2)
      const nextArg = args[i + 1]

      if (parameterNames.includes(key)) {
        hasParams = true
        const paramInfo = getParameterInfo(config, key)

        switch (paramInfo.type) {
          case "boolean":
            params[key] = nextArg !== "false"
            if (nextArg !== "false" && nextArg !== "true") i--
            break
          case "number":
            params[key] = Number(nextArg)
            i++
            break
          case "array":
            params[key] = nextArg.split(",")
            i++
            break
          default:
            params[key] = nextArg
            i++
        }
      }
    }
  }

  if (!hasParams) return null

  // Apply defaults for missing parameters
  if (config.inputSchema?.properties) {
    for (const [key, schema] of Object.entries(config.inputSchema.properties)) {
      if (!(key in params) && (schema as any).default !== undefined) {
        params[key] = (schema as any).default
      }
    }
  }

  return params as T
}

async function promptForParameters<T>(config: Tool): Promise<T> {
  const result: any = {}

  if (!config.inputSchema?.properties) {
    return result as T
  }

  const requiredParams = config.inputSchema.required || []

  // Prompt for each parameter
  for (const [name, schema] of Object.entries(config.inputSchema.properties)) {
    const paramInfo = schema as any
    
    if (paramInfo.type === "string" && paramInfo.enum) {
      // Use select for enums
      result[name] = await global.arg({
        placeholder: paramInfo.description || `Select ${name}`,
        choices: paramInfo.enum.map(value => ({ name: String(value), value }))
      })
    } else if (paramInfo.type === "number") {
      // Use number input
      const value = await global.arg({
        placeholder: paramInfo.description || `Enter ${name}`,
        type: "text" // Will validate as number
      })
      result[name] = Number(value)
    } else if (paramInfo.type === "boolean") {
      // Use toggle or select
      result[name] = await global.arg({
        placeholder: paramInfo.description || `${name}?`,
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false }
        ]
      })
    } else if (paramInfo.type === "array") {
      // For arrays, prompt for comma-separated values
      const value = await global.arg({
        placeholder: paramInfo.description || `Enter ${name} (comma-separated)`
      })
      result[name] = value.split(",").map(v => v.trim())
    } else {
      // Default text input
      result[name] = await global.arg({
        placeholder: paramInfo.description || `Enter ${name}`
      })
    }

    // Apply defaults if no value provided
    if (result[name] === undefined && paramInfo.default !== undefined) {
      result[name] = paramInfo.default
    }
  }

  // Validate required parameters
  for (const name of requiredParams) {
    if (result[name] === undefined || result[name] === null || result[name] === "") {
      throw new Error(`Required parameter '${name}' is missing`)
    }
  }

  return result as T
}

