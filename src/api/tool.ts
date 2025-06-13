import { Channel } from "../core/enum.js"
import type { ParameterConfig, ToolConfig } from "../types/globals"

// Store tool definitions for MCP registration
export const toolDefinitions = new Map<string, ToolConfig>()

export async function tool<T = Record<string, any>>(
  config: ToolConfig<T>
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
  if (
    global.headers &&
    !global.headers['X-MCP-Tool'] &&
    config.parameters &&
    Object.keys(config.parameters).every(k => k in global.headers)
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
    return cliParams
  }
  
  // Otherwise, prompt the user for parameters
  return await promptForParameters(config)
}

async function parseCliParameters<T>(config: ToolConfig<T>): Promise<T | null> {
  const args = process.argv.slice(2)
  if (args.length === 0) return null
  
  const params: any = {}
  let hasParams = false
  
  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2)
      const nextArg = args[i + 1]
      
      if (config.parameters?.[key]) {
        hasParams = true
        const paramConfig = config.parameters[key]
        
        switch (paramConfig.type) {
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
  if (config.parameters) {
    for (const [key, param] of Object.entries(config.parameters) as Array<[string, ParameterConfig]>) {
      if (!(key in params) && param.default !== undefined) {
        params[key] = param.default
      }
    }
  }
  
  return params as T
}

async function promptForParameters<T>(config: ToolConfig<T>): Promise<T> {
  const result: any = {}
  
  if (!config.parameters) {
    return result as T
  }
  
  // Prompt for each parameter
  for (const [name, param] of Object.entries(config.parameters) as Array<[string, ParameterConfig]>) {
    if (param.type === "string" && param.enum) {
      // Use select for enums
      result[name] = await global.arg({
        placeholder: param.description || `Select ${name}`,
        choices: param.enum.map(value => ({ name: String(value), value }))
      })
    } else if (param.type === "number") {
      // Use number input
      const value = await global.arg({
        placeholder: param.description || `Enter ${name}`,
        type: "text" // Will validate as number
      })
      result[name] = Number(value)
    } else if (param.type === "boolean") {
      // Use toggle or select
      result[name] = await global.arg({
        placeholder: param.description || `${name}?`,
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false }
        ]
      })
    } else if (param.type === "array") {
      // For arrays, prompt for comma-separated values
      const value = await global.arg({
        placeholder: param.description || `Enter ${name} (comma-separated)`
      })
      result[name] = value.split(",").map(v => v.trim())
    } else {
      // Default text input
      result[name] = await global.arg({
        placeholder: param.description || `Enter ${name}`
      })
    }
    
    // Apply defaults if no value provided
    if (result[name] === undefined && (param as any).default !== undefined) {
      result[name] = (param as any).default
    }
  }
  
  // Validate required parameters
  for (const [name, param] of Object.entries(config.parameters) as Array<[string, ParameterConfig]>) {
    if (param.required && (result[name] === undefined || result[name] === null || result[name] === "")) {
      throw new Error(`Required parameter '${name}' is missing`)
    }
  }
  
  return result as T
}

export function parametersToJsonSchema(parameters?: Record<string, ParameterConfig>) {
  if (!parameters) {
    return {
      type: "object",
      properties: {},
      additionalProperties: true
    }
  }
  
  const properties: Record<string, any> = {}
  const required: string[] = []
  
  for (const [name, param] of Object.entries(parameters)) {
    const schema: any = {
      type: param.type,
      description: param.description,
    }
    
    if (param.default !== undefined) {
      schema.default = param.default
    }
    
    if (param.enum) {
      schema.enum = param.enum
    }
    
    if (param.pattern) {
      schema.pattern = param.pattern
    }
    
    if (param.minimum !== undefined) {
      schema.minimum = param.minimum
    }
    
    if (param.maximum !== undefined) {
      schema.maximum = param.maximum
    }
    
    if (param.type === "array" && param.items) {
      // For array items, directly convert the item parameter config
      schema.items = {
        type: param.items.type,
        description: param.items.description
      }
    }
    
    if (param.type === "object" && param.properties) {
      const subSchema = parametersToJsonSchema(param.properties)
      schema.properties = subSchema.properties
      if (subSchema.required && subSchema.required.length > 0) {
        schema.required = subSchema.required
      }
    }
    
    properties[name] = schema
    
    if (param.required) {
      required.push(name)
    }
  }
  
  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false
  }
}