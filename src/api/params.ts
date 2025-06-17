import type { Tool } from '@modelcontextprotocol/sdk/types'

// Simplified parameter types
type ParamType = 'string' | 'number' | 'boolean' | 'array' | 'object'

// Base parameter schema
interface BaseParamSchema {
  type: ParamType
  description: string
  required?: boolean
  default?: unknown
}

// String parameter with enum support
interface StringParamSchema extends BaseParamSchema {
  type: 'string'
  enum?: string[]
  default?: string
}

// Number parameter
interface NumberParamSchema extends BaseParamSchema {
  type: 'number'
  default?: number
}

// Boolean parameter
interface BooleanParamSchema extends BaseParamSchema {
  type: 'boolean'
  default?: boolean
}

// Array parameter
interface ArrayParamSchema extends BaseParamSchema {
  type: 'array'
  items?: {
    type: 'string' | 'number' | 'boolean'
  }
  default?: unknown[]
}

// Object parameter
interface ObjectParamSchema extends BaseParamSchema {
  type: 'object'
  properties?: Record<string, BaseParamSchema>
  default?: Record<string, unknown>
}

// Union of all parameter schemas
type ParamSchema = StringParamSchema | NumberParamSchema | BooleanParamSchema | ArrayParamSchema | ObjectParamSchema

// Simple schema type removed as it was unused

// Type inference for parameters
type InferParamType<T> = T extends string
  ? string
  : T extends { type: 'string' }
  ? string
  : T extends { type: 'number' }
  ? number
  : T extends { type: 'boolean' }
  ? boolean
  : T extends { type: 'array' }
  ? unknown[]
  : T extends { type: 'object' }
  ? Record<string, unknown>
  : never

// Infer the return type of params function
export type InferParams<T extends Record<string, string | ParamSchema>> = {
  [K in keyof T]: InferParamType<T[K]>
}

// Convert simple schema to normalized format
function normalizeSchema(simple: Record<string, string | ParamSchema>): Record<string, ParamSchema> {
  const normalized: Record<string, ParamSchema> = {}
  
  for (const [key, value] of Object.entries(simple)) {
    if (typeof value === 'string') {
      // String shorthand: "key": "description"
      normalized[key] = {
        type: 'string',
        description: value
      }
    } else {
      // Already a param schema
      normalized[key] = value
    }
  }
  
  return normalized
}

// Get list of required parameters
function getRequiredParams(schema: Record<string, ParamSchema>): string[] {
  return Object.entries(schema)
    .filter(([_, param]) => param.required === true)
    .map(([key]) => key)
}

// Main params function with proper typing
export async function params<T extends Record<string, string | ParamSchema>>(
  inputSchema: T
): Promise<InferParams<T>> {
  // Normalize the schema
  const schema = normalizeSchema(inputSchema)

  // Check if we're being called via MCP headers
  if (global.headers?.['X-MCP-Parameters']) {
    try {
      const parameters = JSON.parse(global.headers['X-MCP-Parameters'])
      return parameters
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Check if all parameters are in headers (fallback)
  const parameterNames = Object.keys(schema)
  if (
    global.headers &&
    parameterNames.length > 0 &&
    parameterNames.every(k => k in global.headers)
  ) {
    return global.headers as InferParams<T>
  }

  // Check environment variable for MCP calls
  if (process.env.KIT_MCP_CALL) {
    try {
      const mcpCall = JSON.parse(process.env.KIT_MCP_CALL)
      if (mcpCall.parameters) {
        return mcpCall.parameters as InferParams<T>
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Parse CLI parameters
  const cliParams = await parseCliParameters(schema)

  // Prompt for missing parameters
  return await promptForMissingParameters(schema, cliParams || {}) as InferParams<T>
}

async function parseCliParameters<T>(schema: Record<string, ParamSchema>): Promise<Partial<T> | null> {
  const args = process.argv.slice(2)
  if (args.length === 0) return null

  const params: Record<string, unknown> = {}
  let hasParams = false
  const parameterNames = Object.keys(schema)

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2)
      const nextArg = args[i + 1]

      if (parameterNames.includes(key)) {
        hasParams = true
        const paramInfo = schema[key]

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
  for (const [key, paramSchema] of Object.entries(schema)) {
    if (!(key in params) && paramSchema.default !== undefined) {
      params[key] = paramSchema.default
    }
  }

  return params as Partial<T>
}

async function promptForMissingParameters<T extends Record<string, unknown>>(schema: Record<string, ParamSchema>, existingParams: Partial<T>): Promise<T> {
  const result: Record<string, unknown> = { ...existingParams }
  const requiredParams = getRequiredParams(schema)

  // Only prompt for parameters that are missing
  for (const [name, paramInfo] of Object.entries(schema)) {

    // Skip if parameter already has a value
    if (result[name] !== undefined) {
      continue
    }

    // Skip if parameter has a default value and is not required
    if (paramInfo.default !== undefined && !paramInfo.required) {
      result[name] = paramInfo.default
      continue
    }

    // Prompt for missing parameter
    if (paramInfo.type === "string" && 'enum' in paramInfo && paramInfo.enum) {
      // Use select for enums
      result[name] = await global.arg({
        placeholder: paramInfo.description || `Select ${name}`,
        choices: paramInfo.enum.map((value) => ({ name: String(value), value }))
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
  for (const [name, paramInfo] of Object.entries(schema)) {
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

// Re-export InputSchema for backward compatibility
export type InputSchema = Tool['inputSchema']
export type { InputSchema as ParamsSchema }