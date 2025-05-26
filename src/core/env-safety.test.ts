import ava, { type ExecutionContext, TestFn } from "ava"
import tmp from "tmp-promise"
import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { writeFile, readFile, unlink, mkdir, chmod } from "node:fs/promises"
import { pathExists } from "fs-extra"

// Import our safety utilities
import { backupEnvFile, restoreEnvFile, mergeEnvFiles, cleanupOldBackups } from "./env-backup.js"
import { EnvFileLock, safeReadEnvFile, safeWriteEnvFile, cleanupStaleLocks } from "./env-file-lock.js"

// Test-only global type declarations
declare global {
    var __kitDotEnvPathMock: (() => string) | undefined
    var __kenvPathMock: ((...parts: string[]) => string) | undefined
}

interface TestContext {
    tempDir: string
    envPath: string
    originalKitDotEnvPathMock: (() => string) | undefined
    originalKenvPathMock: ((...parts: string[]) => string) | undefined
}

type Context = ExecutionContext<TestContext>

// Mock the kitDotEnvPath function
let mockEnvPath = ""

const test = ava as TestFn<TestContext>

test.beforeEach(async (t) => {
    const tempDir = await tmp.dir({ unsafeCleanup: true })
    const envPath = join(tempDir.path, ".env")
    mockEnvPath = envPath

    // Store original mocks if they exist
    const originalKitDotEnvPathMock = global.__kitDotEnvPathMock
    const originalKenvPathMock = global.__kenvPathMock

    // Mock kitDotEnvPath to return our test path
    global.__kitDotEnvPathMock = () => mockEnvPath
    global.__kenvPathMock = (...parts: string[]) => join(tempDir.path, ...parts)

    t.context = {
        tempDir: tempDir.path,
        envPath,
        originalKitDotEnvPathMock,
        originalKenvPathMock
    }
})

test.afterEach.always((t) => {
    // Restore original mocks or delete if they didn't exist
    if (t.context.originalKitDotEnvPathMock) {
        global.__kitDotEnvPathMock = t.context.originalKitDotEnvPathMock
    } else {
        delete global.__kitDotEnvPathMock
    }

    if (t.context.originalKenvPathMock) {
        global.__kenvPathMock = t.context.originalKenvPathMock
    } else {
        delete global.__kenvPathMock
    }
})

test.serial("should backup and restore .env file correctly", async (t) => {
    const originalContent = "TEST_VAR=original_value\nANOTHER_VAR=another_value"
    await writeFile(t.context.envPath, originalContent)

    // Create backup
    const backupResult = await backupEnvFile()
    t.true(backupResult.success)
    t.truthy(backupResult.backupPath)

    // Verify backup exists and has correct content
    const backupExists = await pathExists(backupResult.backupPath!)
    t.true(backupExists)

    const backupContent = await readFile(backupResult.backupPath!, 'utf-8')
    t.is(backupContent, originalContent)

    // Delete the original file (simulating fresh installation scenario)
    await unlink(t.context.envPath)

    // Restore from backup
    const restoreResult = await restoreEnvFile(backupResult.backupPath)
    t.true(restoreResult.success)

    // Verify restored content
    const restoredContent = await readFile(t.context.envPath, 'utf-8')
    t.is(restoredContent, originalContent)
})

test.serial("should merge env files preserving user values", async (t) => {
    const userEnvPath = join(t.context.tempDir, "user.env")
    const templateEnvPath = join(t.context.tempDir, "template.env")

    const userContent = "USER_VAR=user_value\nSHARED_VAR=user_shared_value"
    const templateContent = "TEMPLATE_VAR=template_value\nSHARED_VAR=template_shared_value"

    await writeFile(userEnvPath, userContent)
    await writeFile(templateEnvPath, templateContent)

    const merged = await mergeEnvFiles(userEnvPath, templateEnvPath)

    // User values should take precedence
    t.is(merged.get("USER_VAR"), "user_value")
    t.is(merged.get("TEMPLATE_VAR"), "template_value")
    t.is(merged.get("SHARED_VAR"), "user_shared_value") // User wins

    t.is(merged.size, 3)
})

test.serial("should handle file locking correctly", async (t) => {
    const lock = new EnvFileLock(t.context.envPath)

    // Test basic locking
    const acquired = await lock.acquire({ timeout: 1000 })
    t.true(acquired)

    // Test that second lock fails quickly
    const lock2 = new EnvFileLock(t.context.envPath)
    await t.throwsAsync(
        () => lock2.acquire({ timeout: 500, maxRetries: 5 }),
        { message: /Failed to acquire lock/ }
    )

    // Release first lock
    await lock.release()

    // Now second lock should succeed
    const acquired2 = await lock2.acquire({ timeout: 1000 })
    t.true(acquired2)
    await lock2.release()
})

test.serial("should safely read and write env files concurrently", async (t) => {
    const initialContent = ["VAR1=value1", "VAR2=value2", "VAR3=value3"]
    await safeWriteEnvFile(initialContent, t.context.envPath)

    // Simulate concurrent operations
    const operations = [
        safeReadEnvFile(t.context.envPath),
        safeWriteEnvFile([...initialContent, "VAR4=value4"], t.context.envPath),
        safeReadEnvFile(t.context.envPath),
        safeWriteEnvFile([...initialContent, "VAR5=value5"], t.context.envPath),
    ]

    const results = await Promise.all(operations)

    // All operations should complete successfully
    t.is(results.length, 4)

    // Final read should show the file in a consistent state
    const finalContent = await safeReadEnvFile(t.context.envPath)
    t.true(finalContent.length >= initialContent.length)
})

test.serial("should handle stale lock cleanup", async (t) => {
    const lock = new EnvFileLock(t.context.envPath)

    // Create a stale lock file manually
    const staleLockPath = `${t.context.envPath}.lock`
    const staleLockData = {
        timestamp: Date.now() - 70000, // 70 seconds ago (stale)
        pid: 99999,
        file: t.context.envPath
    }
    await writeFile(staleLockPath, JSON.stringify(staleLockData))

    // Should be able to acquire lock (removes stale lock)
    const acquired = await lock.acquire({ timeout: 1000 })
    t.true(acquired)

    await lock.release()
})

test.serial("should backup multiple files and cleanup old ones", async (t) => {
    const content = "TEST_VAR=value"
    await writeFile(t.context.envPath, content)

    // Create multiple backups
    const backups: string[] = []
    for (let i = 0; i < 7; i++) {
        await new Promise(resolve => setTimeout(resolve, 10)) // Ensure different timestamps
        const result = await backupEnvFile()
        t.true(result.success)
        backups.push(result.backupPath!)
    }

    // All backups should exist
    for (const backup of backups) {
        t.true(await pathExists(backup))
    }

    // Cleanup should remove old ones (keeps 5)
    await cleanupOldBackups()

    let remainingCount = 0
    for (const backup of backups) {
        if (await pathExists(backup)) {
            remainingCount++
        }
    }

    t.is(remainingCount, 5)
})

test.serial("should handle corrupted lock files", async (t) => {
    const corruptedLockPath = `${t.context.envPath}.lock`
    await writeFile(corruptedLockPath, "invalid json content")

    const lock = new EnvFileLock(t.context.envPath)

    // Should handle corrupted lock and acquire successfully
    const acquired = await lock.acquire({ timeout: 1000 })
    t.true(acquired)

    await lock.release()
})

test.serial("should preserve comments and empty lines in env files", async (t) => {
    const contentWithComments = [
        "# This is a comment",
        "VAR1=value1",
        "",
        "# Another comment",
        "VAR2=value2",
        ""
    ]

    await safeWriteEnvFile(contentWithComments, t.context.envPath)
    const readBack = await safeReadEnvFile(t.context.envPath)

    t.deepEqual(readBack, contentWithComments)
})

test.serial("should handle atomic write failures gracefully", async (t) => {
    // Skip this test on Windows since chmod doesn't work the same way
    if (process.platform === 'win32') {
        t.pass('Skipping permission test on Windows (different permission model)')
        return
    }

    const content = ["VAR1=value1"]

    // Make the directory read-only to prevent file creation
    await chmod(t.context.tempDir, 0o444) // Read-only directory

    try {
        // This should handle the error gracefully
        await t.throwsAsync(
            () => safeWriteEnvFile(content, t.context.envPath),
            { message: /EACCES|permission denied/ }
        )
    } finally {
        // Restore write permissions for cleanup
        await chmod(t.context.tempDir, 0o755)
    }
})

test.serial("should handle missing backup files gracefully", async (t) => {
    const nonExistentBackup = join(t.context.tempDir, "nonexistent.backup")

    const result = await restoreEnvFile(nonExistentBackup)
    t.true(result.success) // Should succeed (nothing to restore)
})

test.serial("withLock should release lock even if operation throws", async (t) => {
    const lock = new EnvFileLock(t.context.envPath)

    await t.throwsAsync(
        () => lock.withLock(async () => {
            throw new Error("Test error")
        }),
        { message: "Test error" }
    )

    // Lock should be released even after error
    const isLocked = await lock.isLocked()
    t.false(isLocked)

    // Should be able to acquire lock again
    const acquired = await lock.acquire({ timeout: 1000 })
    t.true(acquired)
    await lock.release()
})

test.serial("should backup and restore with template merging", async (t) => {
    const originalUserContent = "USER_VAR=user_value\nSHARED_VAR=user_shared_value"
    await writeFile(t.context.envPath, originalUserContent)

    // Create backup
    const backupResult = await backupEnvFile()
    t.true(backupResult.success)
    t.truthy(backupResult.backupPath)

    // Simulate a new template being installed
    const newTemplateContent = "TEMPLATE_VAR=template_value\nSHARED_VAR=template_shared_value\nANOTHER_TEMPLATE_VAR=another_template"
    await writeFile(t.context.envPath, newTemplateContent)

    // Restore from backup (should merge with template)
    const restoreResult = await restoreEnvFile(backupResult.backupPath)
    t.true(restoreResult.success)
    t.is(restoreResult.mergedVariables, 4) // USER_VAR, SHARED_VAR (user wins), TEMPLATE_VAR, ANOTHER_TEMPLATE_VAR

    // Verify merged content preserves user values
    const restoredContent = await readFile(t.context.envPath, 'utf-8')
    const lines = restoredContent.split('\n')

    // User values should be preserved
    t.true(lines.includes('USER_VAR=user_value'))
    t.true(lines.includes('SHARED_VAR=user_shared_value')) // User value wins over template

    // Template values should be added
    t.true(lines.includes('TEMPLATE_VAR=template_value'))
    t.true(lines.includes('ANOTHER_TEMPLATE_VAR=another_template'))
})

test.serial("formatEnvContent should handle various quoting scenarios", async (t) => {
    const { envPath } = t.context
    const testCases = [
        {
            name: "already double-quoted with spaces",
            input: new Map([["QUOTED_SPACE", '"already quoted value"']]),
            expected: 'QUOTED_SPACE="already quoted value"',
        },
        {
            name: "already single-quoted with spaces",
            input: new Map([["QUOTED_SINGLE_SPACE", "'already single quoted'"]]),
            expected: "QUOTED_SINGLE_SPACE='already single quoted'",
        },
        {
            name: "already double-quoted comma list",
            input: new Map([["QUOTED_LIST", '"item1,item2,item3"']]),
            expected: 'QUOTED_LIST="item1,item2,item3"',
        },
        {
            name: "value with internal quotes needing quotes",
            input: new Map([["INTERNAL_QUOTES", 'value with "internal" quotes']]),
            expected: 'INTERNAL_QUOTES="value with \"internal\" quotes"',
        },
        {
            name: "simple value no quotes",
            input: new Map([["SIMPLE", "value"]]),
            expected: "SIMPLE=value",
        },
        {
            name: "value needing quotes due to special char",
            input: new Map([["SPECIAL_CHAR", "value with ; semicolon"]]),
            expected: 'SPECIAL_CHAR="value with ; semicolon"',
        },
        {
            name: "value needing quotes due to hash",
            input: new Map([["HASH_VAL", "value#withhash"]]),
            expected: 'HASH_VAL="value#withhash"',
        },
        {
            name: "empty value",
            input: new Map([["EMPTY_VAL", ""]]),
            expected: 'EMPTY_VAL=""', // Empty values are typically quoted
        },
        {
            name: "value with spaces needing quotes",
            input: new Map([["SPACE_VAL", "value with spaces"]]),
            expected: 'SPACE_VAL="value with spaces"',
        },
        {
            name: "original KCMDS example",
            input: new Map([["KIT_MAIN_SHORTCUT", "cmd ;"]]),
            expected: 'KIT_MAIN_SHORTCUT="cmd ;"',
        },
        {
            name: "original TRUST_KENVS example",
            input: new Map([["KIT_JOHNLINDQUIST_DANGEROUSLY_TRUST_KENVS", "kit-examples,sponsors,server"]]),
            expected: 'KIT_JOHNLINDQUIST_DANGEROUSLY_TRUST_KENVS="kit-examples,sponsors,server"',
        }
    ];

    // Dynamically import formatEnvContent from env-backup.ts
    // This is a bit hacky due to it not being directly exported,
    // usually it would be better to test via public API or export for testing.
    const { formatEnvContent } = await import("./env-backup.js") as any;


    for (const tc of testCases) {
        const actualContent = formatEnvContent(tc.input);
        t.is(actualContent, tc.expected, `Test case failed: ${tc.name}`);

        // Also test the round trip via file write and read
        await writeFile(envPath, actualContent, "utf-8");
        const fileContent = await readFile(envPath, "utf-8");
        t.is(fileContent, tc.expected, `File round trip failed for: ${tc.name}`);
    }
}) 