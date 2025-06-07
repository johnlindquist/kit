// 1Password CLI integration for ScriptKit
// Provides secure secret retrieval for security-conscious users

import { Channel } from "../../core/enum.js"

interface OnePasswordOptions {
    vault?: string
    field?: string
    cache?: boolean
    fallbackToEnv?: boolean
    cacheDuration?: 'session' | 'until-quit' | 'until-sleep'
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
        await ensureOpSession()

        // Build 1Password reference
        const opRef = vaultName
            ? `op://${vaultName}/${itemName}/${fieldName}`
            : `op://${itemName}/${fieldName}`

        // Execute 1Password CLI using argument array to avoid shell parsing issues
        const { stdout } = await global.exec(`op read "${opRef}"`)

        const secret = stdout.trim()
        if (!secret) {
            throw new Error(`No value found for ${opRef}`)
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