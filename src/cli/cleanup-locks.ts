import { cleanupStaleLocks } from "../core/env-file-lock.js"
import { cleanupOldBackups } from "../core/env-backup.js"
import chalk from "chalk"

log(chalk.blue("🧹 Cleaning up stale locks and old backups..."))

try {
    // Clean up stale lock files
    await cleanupStaleLocks()
    log(chalk.green("✅ Cleaned up stale lock files"))

    // Clean up old backup files
    await cleanupOldBackups()
    log(chalk.green("✅ Cleaned up old backup files"))

    log(chalk.green("🎉 Cleanup completed successfully!"))

} catch (error) {
    log(chalk.red(`❌ Error during cleanup: ${error}`))
    process.exit(1)
} 