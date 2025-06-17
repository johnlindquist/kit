import type { Tool } from '@modelcontextprotocol/sdk/types'

// Define InputSchema type matching MCP SDK specification
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

// Helper to convert a "simple" schema (e.g. { name: "User name" })
// into a full JSON-Schema compliant InputSchema. A value can be:
//  - string  → treated as { type: "string", description: value }
//  - number  → treated as { type: "number", description: String(value), default: value }
//  - boolean → treated as { type: "boolean", description: "", default: value }
//  - array   → treated as { type: "array", description: "", default: value }
//  - object  → assumed to already be a schema fragment for that property
function expandSimpleSchema(simple: Record<string, any>): InputSchema {
  const properties: Record<string, any> = {}
  const required: string[] = []

  for (const [key, val] of Object.entries(simple)) {
    // Skip special keys that would exist on a full schema
    if (key === 'type' || key === 'properties' || key === 'required') continue

    let propSchema: any

    if (typeof val === 'string') {
      propSchema = { type: 'string', description: val }
      // In simple syntax, everything is optional by default
    } else if (typeof val === 'number') {
      propSchema = { type: 'number', description: String(val), default: val }
      // In simple syntax, everything is optional by default
    } else if (typeof val === 'boolean') {
      propSchema = { type: 'boolean', description: '', default: val }
      // In simple syntax, everything is optional by default
    } else if (Array.isArray(val)) {
      propSchema = { type: 'array', description: '', default: val }
      // In simple syntax, everything is optional by default
    } else if (typeof val === 'object' && val !== null) {
      // Assume user provided a detailed schema for this property
      propSchema = val
      // In simple syntax, everything is optional by default
    } else {
      // Fallback to string type
      propSchema = { type: 'string' }
      // In simple syntax, everything is optional by default
    }

    properties[key] = propSchema
  }

  const fullSchema: InputSchema = {
    type: 'object',
    properties,
  }
  if (required.length) fullSchema.required = required
  return fullSchema
}

// Helper type to map individual property schemas to TS types
type PrimitiveTypeMap<T extends string> =
  T extends 'string' ? string :
  T extends 'number' ? number :
  T extends 'boolean' ? boolean :
  T extends 'array' ? any[] :
  any

type InferParamType<P> =
  // Schema object with explicit type
  P extends { type: infer U }
  ? PrimitiveTypeMap<Extract<U, string>>
  // Direct primitive defaults
  : P extends string ? string
  : P extends number ? number
  : P extends boolean ? boolean
  : P extends any[] ? any[]
  : any

// Infer final params object type from InputSchema or shorthand object
export type InferParams<S> =
  // Full JSON schema style with properties
  S extends { properties: infer Props }
  ? { [K in keyof Props]: InferParamType<Props[K]> }
  // Simple shorthand object (no properties key)
  : S extends Record<string, any>
  ? { [K in keyof S]:
    // If value is a schema-like object with `type` string literal
    S[K] extends { type: infer T }
    ? T extends 'string' ? string :
    T extends 'number' ? number :
    T extends 'boolean' ? boolean :
    T extends 'array' ? any[] :
    any
    : S[K] extends string ? string :
    S[K] extends number ? number :
    S[K] extends boolean ? boolean :
    S[K] extends any[] ? any[] :
    any }
  : Record<string, any>

// Overload: full JSON schema style with properties literal
export function params<P extends Record<string, any>>(schema: { type: 'object'; properties: P; required?: readonly (keyof P)[] }): Promise<{ [K in keyof P]: InferParamType<P[K]> }>

// Overload: shorthand or any record schema
export function params<S extends Record<string, any>>(schema: S): Promise<InferParams<S>>

// Actual implementation
export async function params(inputSchema: any): Promise<any> {
  // Normalise input schema: if no properties exist we treat it as shorthand
  let schema: InputSchema
  if (inputSchema && (inputSchema as any).properties) {
    schema = inputSchema as InputSchema
  } else {
    schema = expandSimpleSchema(inputSchema as unknown as Record<string, any>)
  }

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
  const parameterNames = getParameterNames(schema)
  if (
    global.headers &&
    parameterNames.length > 0 &&
    parameterNames.every(k => k in global.headers)
  ) {
    return global.headers as any
  }

  // Check environment variable for MCP calls
  if (process.env.KIT_MCP_CALL) {
    try {
      const mcpCall = JSON.parse(process.env.KIT_MCP_CALL)
      if (mcpCall.parameters) {
        return mcpCall.parameters as any
      }
    } catch (error) {
      // Ignore JSON parse errors
    }
  }

  // Parse CLI parameters
  const cliParams = await parseCliParameters(schema)

  // Prompt for missing parameters
  return await promptForMissingParameters(schema, cliParams || {}) as any
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