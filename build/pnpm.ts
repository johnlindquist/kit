import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import axios from 'axios'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

const log = {
  info: (message: string) => {
    console.log(message)
  },
  error: (message: string) => {
    console.error(message)
  },
  warn: (message: string) => {
    console.warn(message)
  }
}

function abort(message: string): never {
  log.error(message)
  process.exit(1)
}

function isGlibcCompatible(): boolean {
  try {
    exec('getconf GNU_LIBC_VERSION')
    return true
  } catch {
    try {
      exec('ldd --version')
      return true
    } catch {
      return false
    }
  }
}

type VersionData = {
  distTags: Record<string, string>
  versions: Record<string, string>
}

async function getVersionData(url: string): Promise<VersionData> {
  const response = await axios.get(url)
  return response.data
}

export async function downloadAndInstallPnpm(): Promise<void> {
  const platform = detectPlatform()
  const arch = detectArch()

  const versionData = await getVersionData('https://registry.npmjs.org/@pnpm/exe')

  let version: string
  
  //   read the version from the package.json
  const packageJson = await fs.readFile('package.json', 'utf8')
  const packageJsonData = JSON.parse(packageJson)
  const PNPM_VERSION = packageJsonData.packageManager.split('pnpm@')[1]

  const preferredVersion = process.env?.PNPM_VERSION || PNPM_VERSION

  if (versionData['dist-tags'][preferredVersion]) {
    version = versionData['dist-tags'][preferredVersion]
  } else if (versionData.versions[preferredVersion]) {
    version = preferredVersion
  } else {
    abort(
      `Version '${preferredVersion}' not found. Available versions: ${Object.keys(versionData.versions).join(', ')}`
    )
  }

  const pnpmName = platform === 'win' ? 'pnpm.exe' : 'pnpm'
  let archiveUrl = `https://github.com/pnpm/pnpm/releases/download/v${version}/pnpm-${platform}-${arch}`
  if (platform === 'win') {
    archiveUrl += '.exe'
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pnpm-'))
  const tmpFile = path.join(tmpDir, pnpmName)

  try {
    log.info(`Downloading pnpm binaries ${version}`)
    const response = await axios.get(archiveUrl, {
      responseType: 'arraybuffer'
    })
    await fs.writeFile(tmpFile, response.data)

    if (platform !== 'win') {
      await fs.chmod(tmpFile, 0o755)
    }

    const kitPnpmHome =
      process.env.KIT_PNPM_HOME ||
      (platform === 'win' ? path.join(process.env.USERPROFILE || '', '.kit') : path.join(os.homedir(), '.kit'))
    const newExecPath = path.join(kitPnpmHome, pnpmName)

    if (path.resolve(newExecPath) !== path.resolve(tmpFile)) {
      log.info(`Copying pnpm CLI from ${tmpFile} to ${newExecPath}`)
      await fs.mkdir(kitPnpmHome, { recursive: true })
      await fs.copyFile(tmpFile, newExecPath)
    }

    log.info(`Successfully installed pnpm to ${newExecPath}`)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

function detectPlatform(): string {
  const platform = os.platform()
  switch (platform) {
    case 'linux':
      return isGlibcCompatible() ? 'linux' : 'linuxstatic'
    case 'darwin':
      return 'macos'
    case 'win32':
      return 'win'
    default:
      abort(`Unsupported platform: ${platform}`)
  }
}

function detectArch(): string {
  let arch = os.arch()
  const is64Bit = os.arch() === 'x64' || os.arch() === 'arm64'

  if (os.platform() === 'win32') {
    return is64Bit ? 'x64' : 'i686'
  }

  switch (arch) {
    case 'x64':
    case 'amd64':
      arch = 'x64'
      break
    case 'arm':
    case 'arm64':
    case 'aarch64':
      arch = is64Bit ? 'arm64' : 'arm'
      break
    default:
      abort(`Unsupported architecture: ${arch}`)
  }
  return arch
}
