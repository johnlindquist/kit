import { readFile, writeFile, copyFile, unlink } from 'node:fs/promises'
import { pathExists } from 'fs-extra'
import path from 'node:path'
import { kitDotEnvPath, kenvPath } from './resolvers.js'
import chalk from 'chalk'

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
export const formatEnvContent = (envMap: Map<string, string>): string => {
    const lines: string[] = []

    for (const [key, value] of envMap) {
        // Normalize Windows paths to use forward slashes
        // Forward slashes work correctly on Windows and don't need quoting in .env files
        let normalizedValue = value.replace(/\\/g, '/')

        const isAlreadyQuoted =
            (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
            (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"));

        let formattedValue = normalizedValue;

        if (isAlreadyQuoted) {
            // If already quoted, leave as is. 
            // Or, if it's double-quoted and contains internal double quotes that are not escaped, it's tricky.
            // For now, we assume valid quoting if already quoted.
            formattedValue = normalizedValue;
        } else {
            // Needs quoting if it's empty, contains problematic characters, or includes a #
            // Note: After normalization, backslashes are gone, so this won't trigger on paths
            const containsProblematicChars = /[\s"'`$&|<>^;,\(\)\\]/.test(normalizedValue);
            const needsExternalQuotes = normalizedValue === "" || containsProblematicChars || normalizedValue.includes('#');

            if (needsExternalQuotes) {
                // Escape only internal double quotes, then wrap with double quotes
                formattedValue = `"${normalizedValue.replace(/"/g, '\"')}"`;
            } else {
                // No quoting needed, use raw value
                formattedValue = normalizedValue;
            }
        }
        lines.push(`${key}=${formattedValue}`);
    }

    return lines.join('\n');
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
        global.log?.(chalk.yellow(`Warning: Could not clean up old backups: ${error}`))
    }
}
