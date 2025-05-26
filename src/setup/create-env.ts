import { backupEnvFile, mergeEnvFiles, formatEnvContent } from "../core/env-backup.js"
import { safeWriteEnvFile } from "../core/env-file-lock.js"
import chalk from "chalk"

// Check if .env already exists
const envPath = kenvPath(".env")
const alreadyExists = await pathExists(envPath)

if (!alreadyExists) {
	// Create new .env from template
	let envTemplatePath = kitPath("templates", "env", "template.env")

	let envTemplate = await readFile(envTemplatePath, "utf8")

	let envTemplateCompiler = compile(envTemplate)
	let compiledEnvTemplate = envTemplateCompiler({
		...process.env,
		KIT_MAIN_SHORTCUT: process.platform === "win32" ? "ctrl ;" : "cmd ;"
	})

	const templateLines = compiledEnvTemplate.split(/\r?\n/)
	await safeWriteEnvFile(templateLines, envPath)

	global.log?.(chalk.green(`✅ Created new .env file with template variables`))
} else {
	// Merge template variables with existing .env file
	global.log?.(chalk.blue(`📝 .env file exists, checking for new template variables...`))

	// Create backup first
	const backupResult = await backupEnvFile()

	if (backupResult.success) {
		try {
			let envTemplatePath = kitPath("templates", "env", "template.env")
			let envTemplate = await readFile(envTemplatePath, "utf8")

			let envTemplateCompiler = compile(envTemplate)
			let compiledEnvTemplate = envTemplateCompiler({
				...process.env,
				KIT_MAIN_SHORTCUT: process.platform === "win32" ? "ctrl ;" : "cmd ;"
			})

			// Write template to temporary file
			const tempTemplatePath = kenvPath(".env.template.tmp")
			await writeFile(tempTemplatePath, compiledEnvTemplate, "utf8")

			// Merge existing .env with new template
			const merged = await mergeEnvFiles(envPath, tempTemplatePath)

			// Format merged content using the corrected function
			const mergedContentString = formatEnvContent(merged)
			const mergedLines = mergedContentString.split('\n');

			// Write merged content safely
			await safeWriteEnvFile(mergedLines, envPath)

			// Clean up temporary template file
			await unlink(tempTemplatePath).catch(() => { })

			global.log?.(chalk.green(`✅ Merged .env file with ${merged.size} variables (preserving your existing settings)`))

			// Clean up backup since merge was successful
			if (backupResult.backupPath) {
				await unlink(backupResult.backupPath).catch(() => { })
			}
		} catch (error) {
			global.log?.(chalk.red(`❌ Failed to merge .env template: ${error}`))

			// Restore from backup if merge failed
			if (backupResult.backupPath) {
				try {
					await copyFile(backupResult.backupPath, envPath)
					await unlink(backupResult.backupPath)
					global.log?.(chalk.yellow(`🔄 Restored .env from backup after merge failure`))
				} catch (restoreError) {
					global.log?.(chalk.red(`❌ Failed to restore .env backup: ${restoreError}`))
				}
			}
		}
	} else {
		global.log?.(chalk.yellow(`⚠️ Could not backup .env file: ${backupResult.error}`))
		global.log?.(chalk.yellow(`⚠️ Skipping template merge to avoid potential data loss`))
	}
}

export { }