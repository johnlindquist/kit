import { readFile, writeFile, copyFile, unlink } from 'node:fs/promises'
import { pathExists } from 'fs-extra'
import path from 'node:path'
import { kitDotEnvPath, kenvPath } from './resolvers.js'

// Resilient chalk import with fallback for when dependencies aren't available during installation
let chalk: any
try {
    const chalkModule = await import('chalk')
    chalk = chalkModule.default
} catch (error) {
    // Fallback chalk implementation when package isn't available
    const fallbackChalk = (text: string) => text
    const createChalkFunction = () => {
        const fn = function (strings: TemplateStringsArray | string, ...values: any[]) {
            if (typeof strings === 'string') {
                return strings
            }
            // Handle template literals
            let result = ''
            for (let i = 0; i < strings.length; i++) {
                result += strings[i]
                if (i < values.length) {
                    result += values[i]
                }
            }
            return result
        }

        // Add color methods
        fn.red = fallbackChalk
        fn.yellow = fallbackChalk
        fn.green = fallbackChalk
        fn.blue = fallbackChalk
        fn.cyan = fallbackChalk
        fn.magenta = fallbackChalk
        fn.white = fallbackChalk
        fn.gray = fallbackChalk
        fn.grey = fallbackChalk

        return fn
    }

    chalk = createChalkFunction()
}

export interface EnvBackupResult {
    success: boolean
    backupPath?: string
    error?: string
}

export interface EnvRestoreResult {
    success: boolean
    mergedVariables?: number
    error?: string
}

/**
 * Creates a timestamped backup of the .env file
 */
export const backupEnvFile = async (): Promise<EnvBackupResult> => {
    try {
        const envPath = kitDotEnvPath()

        if (!(await pathExists(envPath))) {
            return { success: true } // No file to backup
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = kenvPath(`.env.backup.${timestamp}`)

        await copyFile(envPath, backupPath)

        global.log?.(chalk.green(`✅ Backed up .env to ${backupPath}`))

        return {
            success: true,
            backupPath
        }
    } catch (error) {
        const errorMessage = `Failed to backup .env file: ${error}`
        global.log?.(chalk.red(errorMessage))
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Parses .env file content into key-value pairs
 */
const parseEnvContent = (content: string): Map<string, string> => {
    const env = new Map<string, string>()
    const lines = content.split(/\r?\n/)

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
            const [, key, value] = match
            env.set(key.trim(), value.trim())
        }
    }

    return env
}

/**
 * Formats env variables back to .env file format
 */
const formatEnvContent = (envMap: Map<string, string>): string => {
    const lines: string[] = []

    for (const [key, value] of envMap) {
        // Check if value needs quotes
        const needsQuotes = /[\s"'`$&|<>^;,\(\)\\]/.test(value) || value.includes('#')
        const formattedValue = needsQuotes ? `"${value}"` : value
        lines.push(`${key}=${formattedValue}`)
    }

    return lines.join('\n')
}

/**
 * Merges user env variables with template variables, preferring user values
 */
export const mergeEnvFiles = async (userBackupPath: string, templatePath: string): Promise<Map<string, string>> => {
    const merged = new Map<string, string>()

    // First, load template variables (defaults)
    if (await pathExists(templatePath)) {
        const templateContent = await readFile(templatePath, 'utf-8')
        const templateVars = parseEnvContent(templateContent)

        for (const [key, value] of templateVars) {
            merged.set(key, value)
        }
    }

    // Then, override with user variables (preserve user settings)
    if (await pathExists(userBackupPath)) {
        const userContent = await readFile(userBackupPath, 'utf-8')
        const userVars = parseEnvContent(userContent)

        for (const [key, value] of userVars) {
            merged.set(key, value) // User values take precedence
        }
    }

    return merged
}

/**
 * Restores .env file from backup, merging with any new template variables
 */
export const restoreEnvFile = async (backupPath?: string): Promise<EnvRestoreResult> => {
    try {
        if (!backupPath || !(await pathExists(backupPath))) {
            return { success: true } // Nothing to restore
        }

        const envPath = kitDotEnvPath()
        let mergedVars = 0

        // Check if a new template .env was created during installation
        if (await pathExists(envPath)) {
            // Merge user backup with new template
            const merged = await mergeEnvFiles(backupPath, envPath)
            const mergedContent = formatEnvContent(merged)

            await writeFile(envPath, mergedContent, 'utf-8')
            mergedVars = merged.size

            global.log?.(chalk.green(`✅ Restored .env with ${mergedVars} variables (merged with new template)`))
        } else {
            // Just restore the backup directly
            await copyFile(backupPath, envPath)

            const content = await readFile(backupPath, 'utf-8')
            const userVars = parseEnvContent(content)
            mergedVars = userVars.size

            global.log?.(chalk.green(`✅ Restored .env with ${mergedVars} variables`))
        }

        // Clean up backup file
        await unlink(backupPath)

        return {
            success: true,
            mergedVariables: mergedVars
        }
    } catch (error) {
        const errorMessage = `Failed to restore .env file: ${error}`
        global.log?.(chalk.red(errorMessage))
        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Lists all .env backup files
 */
export const listEnvBackups = async (): Promise<string[]> => {
    try {
        const { readdir } = await import('node:fs/promises')
        const kenvDir = kenvPath()
        const files = await readdir(kenvDir)

        return files
            .filter(file => file.startsWith('.env.backup.'))
            .map(file => path.join(kenvDir, file))
            .sort()
            .reverse() // Most recent first
    } catch (error) {
        global.log?.(chalk.yellow(`Warning: Could not list .env backups: ${error}`))
        return []
    }
}

/**
 * Cleans up old .env backup files (keeps last 5)
 */
export const cleanupOldBackups = async (): Promise<void> => {
    try {
        const backups = await listEnvBackups()

        if (backups.length > 5) {
            const toDelete = backups.slice(5) // Keep first 5 (most recent)

            for (const backup of toDelete) {
                await unlink(backup)
                global.log?.(chalk.gray(`🧹 Cleaned up old backup: ${path.basename(backup)}`))
            }
        }
    } catch (error) {
        global.log?.(chalk.yellow(`Warning: Could not cleanup old backups: ${error}`))
    }
} 