// 1Password CLI and SDK integration for ScriptKit
// Provides secure secret retrieval with both CLI and SDK support

import { Channel } from "../../core/enum.js"

// Dynamic imports for SDK (only loaded when needed)
let sdkClient: any = null
let sdkInitPromise: Promise<any> | null = null

interface OnePasswordOptions {
    vault?: string
    field?: string
    cache?: boolean
    fallbackToEnv?: boolean
    cacheDuration?: 'session' | 'until-quit' | 'until-sleep'
    useSDK?: boolean  // Use SDK instead of CLI
}

// In-memory cache for the current session
const opCache = new Map<string, string>()

// Helper to create environment variable name from 1Password reference
function createEnvVarName(itemName: string, vaultName?: string, fieldName: string = 'password'): string {
    const parts = ['OP']
    if (vaultName) parts.push(vaultName)
    parts.push(itemName, fieldName)

    return parts
        .map(part => part.toUpperCase().replace(/[^A-Z0-9]/g, '_'))
        .join('_')
}

async function checkOpCliAvailable(): Promise<boolean> {
    try {
        await global.exec('op --version')
        return true
    } catch (error) {
        return false
    }
}

async function checkOpAuthenticated(): Promise<boolean> {
    try {
        await global.exec('op account list')
        return true
    } catch (error) {
        return false
    }
}

async function ensureOpSession(): Promise<void> {
    const isAvailable = await checkOpCliAvailable()
    if (!isAvailable) {
        throw new Error('1Password CLI (op) is not installed. Install from: https://developer.1password.com/docs/cli/')
    }

    const isAuthenticated = await checkOpAuthenticated()
    if (!isAuthenticated) {
        global.log('🔐 1Password CLI requires authentication...')
        try {
            // This will prompt user for authentication
            await global.term('op signin')
        } catch (error) {
            throw new Error('Failed to authenticate with 1Password CLI')
        }
    }
}

// SDK initialization
async function initOnePasswordSDK(): Promise<any> {
    if (sdkClient) return sdkClient
    if (sdkInitPromise) return sdkInitPromise

    sdkInitPromise = (async () => {
        try {
            const { createClient } = await import("@1password/sdk")

            // Try to get service account token
            let token = process.env.OP_SERVICE_ACCOUNT_TOKEN

            if (!token) {
                // Check kenv .env file
                const envPath = global.kenvPath(".env")
                if (await global.isFile(envPath)) {
                    const envContent = await global.readFile(envPath, "utf-8")
                    const match = envContent.match(/OP_SERVICE_ACCOUNT_TOKEN=(.+)/)
                    if (match?.[1]) {
                        token = match[1].trim()
                    }
                }
            }

            if (!token) {
                throw new Error("No service account token found")
            }

            sdkClient = await createClient({
                auth: token,
                integrationName: "Script Kit",
                integrationVersion: "1.0.0",
            })

            return sdkClient
        } catch (error) {
            sdkInitPromise = null
            throw error
        }
    })()

    return sdkInitPromise
}

global.op = async (
    itemName: string,
    vaultName?: string,
    fieldName: string = 'password',
    options?: OnePasswordOptions
): Promise<string> => {
    const cacheKey = `${vaultName || 'default'}:${itemName}:${fieldName}`
    const envVarName = createEnvVarName(itemName, vaultName, fieldName)
    const cacheDuration = options?.cacheDuration || 'session'

    // Check process.env first (fastest)
    if (process.env[envVarName]) {
        return process.env[envVarName]
    }

    // Check in-memory cache second
    if (opCache.has(cacheKey)) {
        return opCache.get(cacheKey)!
    }

    try {
        let secret: string

        if (options?.useSDK) {
            // Use SDK for retrieval
            const client = await initOnePasswordSDK()
            const opRef = vaultName
                ? `op://${vaultName}/${itemName}/${fieldName}`
                : `op://${itemName}/${fieldName}`

            secret = await client.secrets.resolve(opRef)
        } else {
            // Use CLI for retrieval (default)
            await ensureOpSession()

            // Build 1Password reference
            const opRef = vaultName
                ? `op://${vaultName}/${itemName}/${fieldName}`
                : `op://${itemName}/${fieldName}`

            // Execute 1Password CLI using argument array to avoid shell parsing issues
            const { stdout } = await global.exec(`op read "${opRef}"`)

            secret = stdout.trim()
        }

        if (!secret) {
            throw new Error(`No value found for ${itemName}`)
        }

        // Cache in memory for this session
        opCache.set(cacheKey, secret)

        // Set in current process.env immediately
        process.env[envVarName] = secret

        // Send to app for persistent caching based on duration
        if (cacheDuration !== 'session' && global.send) {
            global.send(Channel.CACHE_ENV_VAR, {
                key: envVarName,
                value: secret,
                duration: cacheDuration
            })
        }

        return secret

    } catch (error) {
        const errorDetails = error.stderr || error.stdout || error.message;
        global.log(`❌ 1Password error: ${errorDetails}`)

        // Fallback: prompt user for manual input (like global.env does)
        const fallbackValue = await global.mini({
            enter: "Enter manually (will not be saved)",
            placeholder: `1Password failed - enter ${itemName} manually:`,
            secret: true,
            keyword: "",
            hint: `Error: ${errorDetails.split("\n")[0]}`
        })

        return fallbackValue
    }
}

// New enhanced onepassword helper with additional methods
global.onepassword = async (
    reference: string,
    defaultValue?: string
): Promise<string> => {
    // Parse reference: op://vault/item/field
    const match = reference.match(/^op:\/\/(?:([^\/]+)\/)?([^\/]+)(?:\/([^\/]+))?$/)
    if (!match) {
        throw new Error(`Invalid 1Password reference: ${reference}`)
    }

    const [, vault, item, field = 'password'] = match

    try {
        // Try SDK first if available
        if (process.env.OP_SERVICE_ACCOUNT_TOKEN) {
            return await global.op(item, vault, field, { useSDK: true })
        }
        // Fall back to CLI
        return await global.op(item, vault, field)
    } catch (error) {
        if (defaultValue !== undefined) {
            return defaultValue
        }
        throw error
    }
}

// Add utility methods
global.onepassword.configure = async () => {
    const token = await global.mini({
        enter: "Save Service Account Token",
        placeholder: "Enter your 1Password Service Account Token:",
        secret: true,
        keyword: "",
        hint: "Get a token from: https://my.1password.com/integrations/directory/scriptkit"
    })

    if (token) {
        await global.cli('set-env-var', 'OP_SERVICE_ACCOUNT_TOKEN', token)
        process.env.OP_SERVICE_ACCOUNT_TOKEN = token
        global.log("✓ 1Password Service Account configured")
    }
}

global.onepassword.clearCache = () => {
    opCache.clear()
    sdkClient = null
    sdkInitPromise = null
    global.log("✓ 1Password cache cleared")
}

global.onepassword.isConfigured = () => {
    return Boolean(process.env.OP_SERVICE_ACCOUNT_TOKEN)
}

global.onepassword.hasSDK = async () => {
    try {
        await import("@1password/sdk")
        return true
    } catch {
        return false
    }
}

global.onepassword.hasCLI = checkOpCliAvailable

// Alternative: extend global.env to detect 1Password references
const originalEnv = global.env
global.env = async (envKey: string, promptConfig?: any) => {
    // Check if this is a 1Password reference
    if (envKey.startsWith('op://')) {
        const match = envKey.match(/^op:\/\/(?:([^\/]+)\/)?([^\/]+)(?:\/([^\/]+))?$/)
        if (match) {
            const [, vault, item, field] = match
            const options = typeof promptConfig === 'object' && promptConfig?.cacheDuration ?
                { cacheDuration: promptConfig.cacheDuration } : undefined
            return await global.op(item, vault, field || 'password', options)
        }
    }

    if (envKey.startsWith('1p:')) {
        const itemName = envKey.slice(3)
        const options = typeof promptConfig === 'object' && promptConfig?.cacheDuration ?
            { cacheDuration: promptConfig.cacheDuration } : undefined
        return await global.op(itemName, undefined, 'password', options)
    }

    // Fall back to original env behavior
    return originalEnv(envKey, promptConfig)
}

// Clear cache on exit for security
process.on('exit', () => {
    opCache.clear()
})

export { }