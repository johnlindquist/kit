import type { Tool } from '@modelcontextprotocol/sdk/types'

// Extract the inputSchema type from the Tool type
export type InputSchema = Tool['inputSchema']

// Re-export for convenience
export type { InputSchema as ParamsSchema }

// Helper function to get parameter names from InputSchema
function getParameterNames(schema: InputSchema): string[] {
  if (!schema?.properties) return []
  return Object.keys(schema.properties)
}

// Helper function to get parameter info from inputSchema
function getParameterInfo(schema: InputSchema, name: string): any {
  if (!schema?.properties) return {}
  return schema.properties[name] || {}
}

export async function params<T = Record<string, any>>(
  inputSchema: InputSchema
): Promise<T> {
  // Check if we're being called via MCP headers
  if (global.headers?.['X-MCP-Parameters']) {
    try {
      const parameters = JSON.parse(global.headers['X-MCP-Parameters'])
      return parameters as T
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Check if all parameters are in headers (fallback)
  const parameterNames = getParameterNames(inputSchema)
  if (
    global.headers &&
    parameterNames.length > 0 &&
    parameterNames.every(k => k in global.headers)
  ) {
    return global.headers as unknown as T
  }

  // Check environment variable for MCP calls
  if (process.env.KIT_MCP_CALL) {
    try {
      const mcpCall = JSON.parse(process.env.KIT_MCP_CALL)
      if (mcpCall.parameters) {
        return mcpCall.parameters as T
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Parse CLI parameters
  const cliParams = await parseCliParameters(inputSchema)
  
  // Prompt for missing parameters
  return await promptForMissingParameters(inputSchema, cliParams || {})
}

async function parseCliParameters<T>(schema: InputSchema): Promise<T | null> {
  const args = process.argv.slice(2)
  if (args.length === 0) return null

  const params: any = {}
  let hasParams = false
  const parameterNames = getParameterNames(schema)

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2)
      const nextArg = args[i + 1]

      if (parameterNames.includes(key)) {
        hasParams = true
        const paramInfo = getParameterInfo(schema, key)

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
  if (schema?.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!(key in params) && (propSchema as any).default !== undefined) {
        params[key] = (propSchema as any).default
      }
    }
  }

  return params as T
}

async function promptForMissingParameters<T>(schema: InputSchema, existingParams: any): Promise<T> {
  const result: any = { ...existingParams }

  if (!schema?.properties) {
    return result as T
  }

  const requiredParams = schema.required || []

  // Only prompt for parameters that are missing
  for (const [name, propSchema] of Object.entries(schema.properties)) {
    const paramInfo = propSchema as any
    
    // Skip if parameter already has a value
    if (result[name] !== undefined) {
      continue
    }
    
    // Skip if parameter has a default value and is not required
    if (paramInfo.default !== undefined && !requiredParams.includes(name)) {
      result[name] = paramInfo.default
      continue
    }
    
    // Prompt for missing parameter
    if (paramInfo.type === "string" && paramInfo.enum) {
      // Use select for enums
      result[name] = await global.arg({
        placeholder: paramInfo.description || `Select ${name}`,
        choices: paramInfo.enum.map((value: any) => ({ name: String(value), value }))
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
      result[name] = value.split(",").map((v: string) => v.trim())
    } else {
      // Default text input
      result[name] = await global.arg({
        placeholder: paramInfo.description || `Enter ${name}`
      })
    }
  }

  // Apply defaults for any remaining missing parameters
  for (const [name, propSchema] of Object.entries(schema.properties)) {
    const paramInfo = propSchema as any
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