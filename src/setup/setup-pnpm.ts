import { lstat, unlink, symlink } from "node:fs/promises"

const isWindows = process.platform === "win32"

async function createWindowsWrapper(
  pnpmPath: string,
  symlinkPath: string
): Promise<void> {
  const cmdContent = `@echo off\n"${pnpmPath}" %*`
  await writeFile(symlinkPath, cmdContent, "utf8")
}

async function removeSymlinkIfExists(path: string) {
  try {
    const stats = await lstat(path)
    if (stats.isSymbolicLink()) {
      await unlink(path)
    }
  } catch (error) {
    // If lstat throws an error, it means the path doesn't exist,
    // so we don't need to do anything
  }
}

try {
  // Install pnpm locally
  console.log("Installing pnpm locally...")

  // Create symlink
  const pnpmPath = kitPath("node_modules", ".bin", "pnpm")
  const npmSymlinkPath = kenvPath(
    isWindows ? "npm.cmd" : "npm"
  )
  const pnpmSymlinkPath = kenvPath(
    isWindows ? "pnpm.cmd" : "pnpm"
  )

  console.log("Creating symlink...")
  try {
    if (isWindows) {
      // Remove existing symlinks if they exist
      await removeSymlinkIfExists(npmSymlinkPath)
      await removeSymlinkIfExists(pnpmSymlinkPath)

      await createWindowsWrapper(pnpmPath, npmSymlinkPath)
      await createWindowsWrapper(pnpmPath, pnpmSymlinkPath)
    } else {
      // Remove existing symlinks if they exist
      await removeSymlinkIfExists(npmSymlinkPath)
      await removeSymlinkIfExists(pnpmSymlinkPath)

      await symlink(pnpmPath, pnpmSymlinkPath)
      await symlink(pnpmPath, npmSymlinkPath)
    }
  } catch (error) {
    console.error("Failed to create symlink:", error)
    console.log(
      "You may need to run this command manually after setup."
    )
  }
  console.log(
    "Configuring pnpm to use local Node.js version..."
  )
  try {
    await exec(
      "pnpm config set use-node-version 22.9.0 --location project",
      {
        cwd: kenvPath(),
      }
    )
    console.log("pnpm configuration updated successfully.")
  } catch (configError) {
    console.error(
      "Failed to update pnpm configuration:",
      configError
    )
    console.log(
      "You may need to run this command manually after setup."
    )
  }
} catch (error) {
  console.error("An error occurred during setup:", error)
  process.exit(1)
}

export {}
