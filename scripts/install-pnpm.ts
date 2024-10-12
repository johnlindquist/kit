#!/usr/bin/env node --loader ts-node/esm

import { exec } from "node:child_process"
import { promisify } from "node:util"
import axios from "axios"
import * as os from "node:os"
import * as path from "node:path"
import * as fs from "node:fs/promises"

const execAsync = promisify(exec)

function abort(message: string): never {
  console.error(message)
  process.exit(1)
}

function ohai(message: string): void {
  console.log(`\x1b[1;34m==>\x1b[1;39m ${message}\x1b[0m`)
}

function isGlibcCompatible(): boolean {
  try {
    execAsync("getconf GNU_LIBC_VERSION")
    return true
  } catch {
    try {
      execAsync("ldd --version")
      return true
    } catch {
      return false
    }
  }
}

async function download(url: string): Promise<string> {
  const response = await axios.get(url)
  return response.data
}

// ... (keep the existing utility functions like abort, ohai, download)

function detectPlatform(): string {
  const platform = os.platform()
  switch (platform) {
    case "linux":
      return isGlibcCompatible() ? "linux" : "linuxstatic"
    case "darwin":
      return "macos"
    case "win32":
      return "win"
    default:
      abort(`Unsupported platform: ${platform}`)
  }
}

function detectArch(): string {
  let arch = os.arch()
  const is64Bit =
    os.arch() === "x64" || os.arch() === "arm64"

  if (os.platform() === "win32") {
    return is64Bit ? "x64" : "i686"
  }

  switch (arch) {
    case "x64":
    case "amd64":
      arch = "x64"
      break
    case "arm":
    case "arm64":
    case "aarch64":
      arch = is64Bit ? "arm64" : "arm"
      break
  }

  if (arch !== "x64" && arch !== "arm64") {
    abort(
      "Sorry! pnpm currently only provides pre-built binaries for x86_64/arm64 architectures."
    )
  }

  return arch
}

async function downloadAndInstall(): Promise<void> {
  const platform = detectPlatform()
  const arch = detectArch()

  const versionJson = await download(
    "https://registry.npmjs.org/@pnpm/exe"
  )
  const versionData = JSON.parse(versionJson)

  let version: string
  const preferredVersion =
    process.env.PNPM_VERSION || "latest"

  if (versionData["dist-tags"][preferredVersion]) {
    version = versionData["dist-tags"][preferredVersion]
  } else if (versionData.versions[preferredVersion]) {
    version = preferredVersion
  } else {
    abort(
      `Version '${preferredVersion}' not found. Available versions: ${Object.keys(
        versionData.versions
      ).join(", ")}`
    )
  }

  const pnpmName = platform === "win" ? "pnpm.exe" : "pnpm"
  let archiveUrl = `https://github.com/pnpm/pnpm/releases/download/v${version}/pnpm-${platform}-${arch}`
  if (platform === "win") {
    archiveUrl += ".exe"
  }

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "pnpm-")
  )
  const tmpFile = path.join(tmpDir, pnpmName)

  try {
    ohai(`Downloading pnpm binaries ${version}`)
    const response = await axios.get(archiveUrl, {
      responseType: "arraybuffer",
    })
    await fs.writeFile(tmpFile, response.data)

    if (platform !== "win") {
      await fs.chmod(tmpFile, 0o755)
    }

    const kitPnpmHome =
      process.env.KIT_PNPM_HOME ||
      (platform === "win"
        ? path.join(process.env.USERPROFILE || "", ".kit")
        : path.join(os.homedir(), ".kit"))
    const newExecPath = path.join(kitPnpmHome, pnpmName)

    if (
      path.resolve(newExecPath) !== path.resolve(tmpFile)
    ) {
      console.log(
        `Copying pnpm CLI from ${tmpFile} to ${newExecPath}`
      )
      await fs.mkdir(kitPnpmHome, { recursive: true })
      await fs.copyFile(tmpFile, newExecPath)
    }

    ohai(`Successfully installed pnpm to ${newExecPath}`)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

// ... (keep the existing main function)
