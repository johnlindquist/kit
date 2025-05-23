import { listEnvBackups, restoreEnvFile } from "../core/env-backup.js"
import { cleanupStaleLocks } from "../core/env-file-lock.js"
import { kitDotEnvPath } from "../core/utils.js"
import chalk from "chalk"
import path from "node:path"

// Clean up any stale locks first
await cleanupStaleLocks()

const backups = await listEnvBackups()

if (backups.length === 0) {
    log(chalk.yellow(`
No .env backup files found.

This script creates automatic backups of your .env file during installations
and updates. If you've recently updated Script Kit and lost your .env settings,
the backup may have been created during that process.

Backup files are stored in: ${path.dirname(kitDotEnvPath())}
They follow the pattern: .env.backup.YYYY-MM-DDTHH-MM-SS
  `))
    exit()
}

log(chalk.blue(`
Found ${backups.length} .env backup file${backups.length === 1 ? '' : 's'}:
`))

const choices = backups.map((backupPath, index) => {
    const basename = path.basename(backupPath)
    const match = basename.match(/\.env\.backup\.(.+)/)
    const timestamp = match ? match[1].replace(/-/g, ':').replace('T', ' ') : basename

    return {
        name: `${index + 1}. ${timestamp}`,
        description: `Restore from: ${basename}`,
        value: backupPath
    }
})

choices.push({
    name: `${choices.length + 1}. Show current .env content`,
    description: "View what's currently in your .env file",
    value: 'show-current'
})

choices.push({
    name: `${choices.length + 1}. Cancel`,
    description: "Exit without making changes",
    value: 'cancel'
})

const selectedAction = await arg(
    {
        placeholder: "Select a backup to restore or action to take:",
        hint: "Use ↑↓ to navigate, Enter to select"
    },
    choices
)

if (selectedAction === 'cancel') {
    log(chalk.gray("Recovery cancelled."))
    exit()
}

if (selectedAction === 'show-current') {
    try {
        const envPath = kitDotEnvPath()
        const currentContent = await readFile(envPath, 'utf-8')

        log(chalk.blue(`
Current .env file contents:
${chalk.gray('─'.repeat(50))}
${currentContent}
${chalk.gray('─'.repeat(50))}
    `))

        const shouldContinue = await arg({
            placeholder: "Continue with recovery?",
            hint: "y/n"
        }, [
            { name: "Yes, show backup options again", value: true },
            { name: "No, exit", value: false }
        ])

        if (shouldContinue) {
            // Restart the script to show backup options again
            await run('recover-env')
        }

        exit()
    } catch (error) {
        log(chalk.red(`Error reading current .env file: ${error}`))
        exit()
    }
}

// Show preview of backup content
try {
    const backupContent = await readFile(selectedAction, 'utf-8')

    log(chalk.blue(`
Preview of backup content:
${chalk.gray('─'.repeat(50))}
${backupContent}
${chalk.gray('─'.repeat(50))}
  `))

    const confirmed = await arg({
        placeholder: "Restore this backup?",
        hint: "This will replace your current .env file"
    }, [
        { name: "Yes, restore this backup", value: true },
        { name: "No, cancel", value: false }
    ])

    if (!confirmed) {
        log(chalk.gray("Recovery cancelled."))
        exit()
    }

    // Perform the restore
    log(chalk.blue("🔄 Restoring .env file from backup..."))

    const restoreResult = await restoreEnvFile(selectedAction)

    if (restoreResult.success) {
        log(chalk.green(`
✅ Successfully restored .env file!

Restored ${restoreResult.mergedVariables} environment variables.
Your Script Kit environment should now be back to its previous state.

You may need to restart Script Kit for all changes to take effect.
    `))
    } else {
        log(chalk.red(`
❌ Failed to restore .env file: ${restoreResult.error}

You can try manually copying the backup:
  Source: ${selectedAction}
  Target: ${kitDotEnvPath()}
    `))
    }

} catch (error) {
    log(chalk.red(`Error reading backup file: ${error}`))
    exit()
} 