import { writeFile, readFile, unlink } from 'node:fs/promises'
import { pathExists } from 'fs-extra'
import path from 'node:path'
import { kitDotEnvPath, kenvPath } from './resolvers.js'
import chalk from 'chalk'
interface LockOptions {
    timeout?: number // milliseconds
    retryInterval?: number // milliseconds
    maxRetries?: number
}

const DEFAULT_LOCK_OPTIONS: Required<LockOptions> = {
    timeout: 10000, // 10 seconds
    retryInterval: 100, // 100ms
    maxRetries: 100
}

/**
 * Simple file-based locking mechanism for .env files
 */
export class EnvFileLock {
    private lockPath: string
    private locked = false
    private lockStartTime = 0

    constructor(private filePath: string = kitDotEnvPath()) {
        this.lockPath = `${this.filePath}.lock`
    }

    /**
     * Acquires a lock on the .env file
     */
    async acquire(options: LockOptions = {}): Promise<boolean> {
        const opts = { ...DEFAULT_LOCK_OPTIONS, ...options }
        const startTime = Date.now()

        for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
            try {
                // Check if lock file already exists
                if (await pathExists(this.lockPath)) {
                    // Check if lock is stale (older than timeout) or corrupted
                    const lockContent = await readFile(this.lockPath, 'utf-8').catch(() => '')
                    const lockData = this.parseLockContent(lockContent)

                    if (!lockData) {
                        // Corrupted lock file, remove it
                        global.log?.(chalk.yellow(`🔓 Removing corrupted lock: ${this.lockPath}`))
                        await unlink(this.lockPath).catch(() => { }) // Ignore errors
                    } else if (Date.now() - lockData.timestamp > 60000) { // 1 minute staleness threshold
                        global.log?.(chalk.yellow(`🔓 Removing stale lock: ${this.lockPath}`))
                        await unlink(this.lockPath).catch(() => { }) // Ignore errors
                    } else {
                        // Lock is still valid, wait and retry
                        await this.sleep(opts.retryInterval)
                        continue
                    }
                }

                // Try to create lock file
                const lockData = {
                    timestamp: Date.now(),
                    pid: process.pid,
                    file: this.filePath
                }

                await writeFile(this.lockPath, JSON.stringify(lockData), { flag: 'wx' })

                this.locked = true
                this.lockStartTime = Date.now()
                global.log?.(chalk.green(`🔒 Acquired lock: ${this.lockPath}`))
                return true

            } catch (error: any) {
                if (error.code === 'EEXIST') {
                    // Lock file exists, retry
                    await this.sleep(opts.retryInterval)
                    continue
                } else {
                    global.log?.(chalk.red(`Failed to acquire lock: ${error.message}`))
                    throw error
                }
            }
        }

        const elapsed = Date.now() - startTime
        throw new Error(`Failed to acquire lock after ${elapsed}ms (${opts.maxRetries} attempts)`)
    }

    /**
     * Releases the lock
     */
    async release(): Promise<void> {
        if (!this.locked) {
            return
        }

        try {
            await unlink(this.lockPath)
            this.locked = false
            const duration = Date.now() - this.lockStartTime
            global.log?.(chalk.green(`🔓 Released lock: ${this.lockPath} (held for ${duration}ms)`))
        } catch (error: any) {
            global.log?.(chalk.yellow(`Warning: Failed to release lock: ${error.message}`))
        }
    }

    /**
     * Executes a function with exclusive access to the .env file
     */
    async withLock<T>(fn: () => Promise<T>, options?: LockOptions): Promise<T> {
        await this.acquire(options)
        try {
            return await fn()
        } finally {
            await this.release()
        }
    }

    /**
     * Checks if the file is currently locked
     */
    async isLocked(): Promise<boolean> {
        return await pathExists(this.lockPath)
    }

    private parseLockContent(content: string): { timestamp: number; pid: number; file: string } | null {
        try {
            return JSON.parse(content)
        } catch {
            return null
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

/**
 * Safely reads the .env file with locking
 */
export const safeReadEnvFile = async (filePath?: string): Promise<string[]> => {
    const envPath = filePath || kitDotEnvPath()
    const lock = new EnvFileLock(envPath)

    return lock.withLock(async () => {
        try {
            if (!(await pathExists(envPath))) {
                return []
            }

            const contents = await readFile(envPath, 'utf-8')
            return contents.split(/\r?\n/)
        } catch (error) {
            global.log?.(chalk.red(`Error reading .env file: ${error}`))
            return []
        }
    })
}

/**
 * Safely writes to the .env file with locking and atomic operations
 */
export const safeWriteEnvFile = async (lines: string[], filePath?: string): Promise<void> => {
    const envPath = filePath || kitDotEnvPath()
    const lock = new EnvFileLock(envPath)

    return lock.withLock(async () => {
        try {
            // Write to temporary file first (atomic operation)
            const tempPath = `${envPath}.tmp.${Date.now()}`
            const content = lines.join('\n')

            await writeFile(tempPath, content, 'utf-8')

            // Atomic rename (on most filesystems)
            const { rename } = await import('node:fs/promises')
            await rename(tempPath, envPath)

            global.log?.(chalk.green(`✅ Safely wrote .env file with ${lines.length} lines`))
        } catch (error) {
            global.log?.(chalk.red(`Error writing .env file: ${error}`))
            throw error
        }
    })
}

/**
 * Cleans up any stale lock files
 */
export const cleanupStaleLocks = async (): Promise<void> => {
    try {
        const kenvDir = kenvPath()
        const { readdir } = await import('node:fs/promises')
        const files = await readdir(kenvDir)

        const lockFiles = files.filter(file => file.endsWith('.env.lock'))

        for (const lockFile of lockFiles) {
            const lockPath = path.join(kenvDir, lockFile)

            try {
                const lockContent = await readFile(lockPath, 'utf-8')
                const lockData = JSON.parse(lockContent)

                // Remove locks older than 1 minute
                if (Date.now() - lockData.timestamp > 60000) {
                    await unlink(lockPath)
                    global.log?.(chalk.gray(`🧹 Cleaned up stale lock: ${lockFile}`))
                }
            } catch {
                // Invalid lock file, remove it
                await unlink(lockPath)
                global.log?.(chalk.gray(`🧹 Cleaned up invalid lock: ${lockFile}`))
            }
        }
    } catch (error) {
        global.log?.(chalk.yellow(`Warning: Could not cleanup stale locks: ${error}`))
    }
} 