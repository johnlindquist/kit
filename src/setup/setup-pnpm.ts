const isWindows = process.platform === "win32"

async function createWindowsWrapper(
	pnpmPath: string,
	symlinkPath: string
): Promise<void> {
	const cmdContent = `@echo off\n"${pnpmPath}" %*`
	await writeFile(symlinkPath, cmdContent, "utf8")
}

try {
	// Install pnpm locally
	console.log("Installing pnpm locally...")
	await exec("npm install pnpm")

	// Create symlink
	const pnpmPath = kenvPath("node_modules", ".bin", "pnpm")
	const symlinkPath = kenvPath(isWindows ? "pnpm.cmd" : "pnpm")

	console.log("Creating symlink...")
	if (isWindows) {
		await createWindowsWrapper(pnpmPath, symlinkPath)
	} else {
		await ensureSymlink(pnpmPath, symlinkPath)
	}

	console.log("Configuring pnpm to use local Node.js version...")
	try {
		await exec(
			`pnpm config set use-node-version "${knodePath("bin", "node")}" --location project`
		)
		console.log("pnpm configuration updated successfully.")
	} catch (configError) {
		console.error("Failed to update pnpm configuration:", configError)
		console.log("You may need to run this command manually after setup.")
	}
} catch (error) {
	console.error("An error occurred during setup:", error)
	process.exit(1)
}

export {}
