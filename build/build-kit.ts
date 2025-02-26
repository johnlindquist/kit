import shelljs from 'shelljs'
import path from 'node:path'
import { homedir, platform } from 'node:os'
import { existsSync, readFileSync } from 'node:fs'
import { rimraf } from 'rimraf'
import { chmod as fsChmod, writeFile } from 'node:fs/promises'
import { execaCommand as exec, type Options } from 'execa'
import { ensureDir, move, pathExists } from 'fs-extra'
import { downloadAndInstallPnpm } from './pnpm.ts'

global.log = console.log
global.warn = console.warn
global.error = console.error
global.info = console.info

let kitPath = (...pathParts) => path.resolve(process.env.KIT || path.resolve(homedir(), '.kit'), ...pathParts)

let options = {
  cwd: kitPath(),
  shell: true,
  stdio: 'inherit'
} as Options

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:')
  console.error(formatError(error))
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise)
  console.error('Reason:', formatError(reason))
})

function formatError(error) {
  if (error instanceof Error) {
    const lines = error.stack?.split('\n') || []
    const filteredLines = lines.filter((line) => !line.includes('node_modules') && !isMinifiedCode(line))
    return filteredLines.join('\n')
  }
  return String(error)
}

function isMinifiedCode(line) {
  // This is a simple heuristic. Adjust as needed.
  return line.length > 200 || line.split(',').length > 10
}

let originalDir = process.cwd()

let { cd, cp } = shelljs

// Log which node is running this script using process.version and the node path
console.log(
  `build-kit
  
Running with ${process.argv[0]} version ${process.version}
Path to this script: ${process.argv[1]}
  `
)

// Add more detailed environment logging
console.log(`
ENVIRONMENT INFO:
----------------
Current directory: ${process.cwd()}
Kit path: ${kitPath()}
Platform: ${process.platform}
Node executable: ${process.execPath}
`)

const oldKitPath = kitPath() + '-old'
let packageJsonChanged = true // Default to true for the first run

// Check if we're running from a binary located in kitPath()
const kitPathStr = kitPath()
const nodeExePath = process.execPath
const isRunningFromKit = nodeExePath.includes(kitPathStr)

console.log(`Checking if running from kit directory...
Node executable path: ${nodeExePath}
Kit path: ${kitPathStr}
Is running from kit: ${isRunningFromKit}
`)

if (isRunningFromKit) {
  console.error(`
ERROR: This script is being executed with Node.js from the .kit directory
Current Node.js path: ${nodeExePath}

Even though you're using a global pnpm command, it's still using Node.js from .kit.
Please run this script with a globally installed Node.js by using one of these methods:

1. Use node directly:
   node ./build/build-kit.ts

2. Force pnpm to use your global Node.js:
   set PNPM_SCRIPT_RUNTIME_ARGS="--nodeArg=-r --nodeArg=tsx/register"
   pnpm node ./build/build-kit.ts

3. Install tsx globally and use it (RECOMMENDED):
   npm install -g tsx
   tsx ./build/build-kit.ts

RECOMMENDED SOLUTION:
-----------------
1. Open a new command prompt
2. Run: npm install -g tsx
3. After installation completes, run: tsx ./build/build-kit.ts
`)
  process.exit(1)
}

if (existsSync(kitPath())) {
  console.log(`Found kit at ${kitPath()}, renaming to ${oldKitPath}...`)
  //   check if it exists first

  if (await pathExists(oldKitPath)) {
    console.log(`Old kit directory exists at ${oldKitPath}, removing it...`)
    try {
      await rimraf(oldKitPath) // Ensure old directory is cleared
      console.log('Successfully removed old kit directory')
    } catch (error) {
      console.error('ERROR: Failed to remove old kit directory:', error)
      process.exit(1)
    }
  }

  console.log(`Moving ${kitPath()} to ${oldKitPath}...`)
  try {
    // Create a promise that rejects after a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout moving kit directory')), 10000)
    })

    // Try the move operation with a timeout
    try {
      await Promise.race([move(kitPath(), oldKitPath), timeoutPromise])
      console.log('Successfully moved kit directory')
    } catch (moveError) {
      console.error('Move operation failed:', moveError)

      // Fallback: Try to copy files instead of moving them
      console.log('Attempting fallback: copy files instead of moving...')

      // Create the destination directory if it doesn't exist
      if (!existsSync(oldKitPath)) {
        await ensureDir(oldKitPath)
      }

      // Use shelljs to copy files (more robust for Windows)
      console.log('Copying files...')
      cp('-R', `${kitPath()}/*`, oldKitPath)

      try {
        // Copy hidden files (may fail if none exist)
        cp('-R', `${kitPath()}/.*`, oldKitPath)
      } catch (hiddenCopyError) {
        console.log('Note: No hidden files to copy or error copying hidden files')
      }

      console.log('Files copied successfully. Attempting to remove original directory...')

      try {
        // Try to remove the original directory
        await rimraf(kitPath())
        console.log('Original directory removed successfully')
      } catch (removeError) {
        console.error('Failed to remove original directory:', removeError)
        console.log('Will continue with build process anyway')
      }
    }
  } catch (error) {
    console.error('ERROR: Failed to move/copy kit directory:', error)
    console.log(`Checking if directories exist:
    - Source (${kitPath()}) exists: ${existsSync(kitPath())}
    - Destination (${oldKitPath}) exists: ${existsSync(oldKitPath)}
    `)
    process.exit(1)
  }

  // Compare package.json
  try {
    console.log('Comparing package.json files...')
    const oldPackageJson = readFileSync(path.join(oldKitPath, 'package.json'), 'utf-8')
    const newPackageJson = readFileSync(path.join(originalDir, 'package.json'), 'utf-8')
    packageJsonChanged = oldPackageJson !== newPackageJson
    if (!packageJsonChanged) {
      console.log('package.json has not changed. Using existing node modules.')
    } else {
      console.log('package.json has changed. Will reinstall dependencies.')
    }
  } catch (error) {
    console.error('Error comparing package.json files:', error)
    packageJsonChanged = true // Force reinstallation if comparison fails
  }
}

console.log(`Creating kit directory at ${kitPath()}...`)
try {
  await ensureDir(kitPath())
  console.log('Successfully created kit directory')
} catch (error) {
  console.error('ERROR: Failed to create kit directory:', error)
  process.exit(1)
}

console.log(`Copying files to ${kitPath()}...`)
cp('-R', './root/.', kitPath())
cp('-R', './build', kitPath())
cp('-R', './src/types', kitPath())

cp('.npmrc', kitPath())
cp('*.md', kitPath())
cp('package*.json', kitPath())
cp('pnpm-lock.yaml', kitPath())
cp('LICENSE', kitPath())
console.log('Finished copying base files')

const kitEditorDtsPath = path.resolve('src', 'editor', 'types', 'kit-editor.d.ts')
if (existsSync(kitEditorDtsPath)) {
  console.log(`Copying editor types from ${kitEditorDtsPath}`)
  const editorTypesPath = kitPath('editor', 'types', 'kit-editor.d.ts')
  console.log(`Copying to ${editorTypesPath}`)
  await ensureDir(path.dirname(editorTypesPath))
  cp(kitEditorDtsPath, editorTypesPath)
  console.log('Finished copying editor types')
}

console.log(`Building ESM to ${kitPath()}`)
try {
  await exec(`pnpm exec tsc --outDir ${kitPath()}`).catch((e) => {
    console.error('Error building ESM:', e)
    process.exit(1)
  })
  console.log('ESM build completed successfully')
} catch (error) {
  console.error('Unexpected error during ESM build:', error)
  process.exit(1)
}

console.log(`Building declarations to ${kitPath()}`)
try {
  await exec(`pnpm exec tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`).catch((e) => {
    console.error('Error building declarations:', e)
    process.exit(1)
  })
  console.log('Declarations build completed successfully')
} catch (error) {
  console.error('Unexpected error during declarations build:', error)
  process.exit(1)
}

// Move node_modules, pnpm, and node from .kit-old if package.json is the same
if (!packageJsonChanged && existsSync(oldKitPath)) {
  try {
    console.log('Moving node_modules, pnpm, and node from .kit-old...')

    console.log('Moving node_modules...')
    const oldNodeModulesPath = path.join(oldKitPath, 'node_modules')
    const newNodeModulesPath = kitPath('node_modules')
    if (existsSync(oldNodeModulesPath)) {
      await move(oldNodeModulesPath, newNodeModulesPath, {
        overwrite: true
      })
      console.log('Successfully moved node_modules')
    } else {
      console.log('No node_modules found in old kit directory')
    }

    console.log('Moving pnpm...')
    const oldPnpmPath = path.join(oldKitPath, 'pnpm')
    const newPnpmPath = kitPath('pnpm')
    if (existsSync(oldPnpmPath)) {
      await move(oldPnpmPath, newPnpmPath, {
        overwrite: true
      })
      console.log('Successfully moved pnpm')
    } else {
      console.log('No pnpm found in old kit directory')
    }

    console.log('Moving nodejs...')
    const oldNodejsPath = path.join(oldKitPath, 'nodejs')
    const newNodejsPath = kitPath('nodejs')
    if (existsSync(oldNodejsPath)) {
      await move(oldNodejsPath, newNodejsPath, {
        overwrite: true
      })
      console.log('Successfully moved nodejs')
    } else {
      console.log('No nodejs found in old kit directory')
    }

    console.log('Moved node_modules, pnpm, and node successfully.')
  } catch (error) {
    console.error('Error moving node_modules, pnpm, or node:', error)
    packageJsonChanged = true // Force reinstallation if move fails
  }
}

// Install dependencies only if package.json has changed
if (packageJsonChanged) {
  console.log('Installing dependencies...')
  try {
    console.log('Downloading and installing pnpm...')
    await downloadAndInstallPnpm()
    console.log('pnpm installation completed')

    console.log(`Checking node path with pnpm node -e at ${kitPath('pnpm')}`)
    await exec(`${kitPath('pnpm')} node -e "console.log(process.execPath)"`, {
      cwd: kitPath(),
      stdio: 'inherit',
      env: {
        PNPM_HOME: kitPath(),
        PATH: ''
      }
    })
    console.log('Node path check completed')

    const pnpmPath = kitPath('pnpm')
    console.log(`Installing production dependencies using ${pnpmPath}...`)
    await exec(`"${pnpmPath}" i --prod`, options)
    console.log('Production dependencies installed successfully')

    console.log('Installing development tools (esbuild, vite, tsx)...')
    await exec(`"${pnpmPath}" i esbuild vite tsx`, options)
    console.log('Development tools installed successfully')
  } catch (error) {
    console.error('Error installing dependencies:', error)
    process.exit(1)
  }
}

console.log('Download docs')
await ensureDir(kitPath('data'))
console.log('Created data directory')
const { default: download } = await import('./download.ts')
console.log('Imported download module')

try {
  console.log('Downloading docs.json...')
  const docsBuffer = await download('https://www.scriptkit.com/data/docs.json')
  console.log('Writing docs.json to disk...')
  await writeFile(kitPath('data', 'docs.json'), docsBuffer)
  console.log('docs.json downloaded and saved successfully')
} catch (e) {
  console.error('Error downloading docs.json:', e)
}

try {
  console.log('Downloading hot.json...')
  const hotBuffer = await download('https://www.scriptkit.com/data/hot.json')
  console.log('Writing hot.json to disk...')
  await writeFile(kitPath('data', 'hot.json'), hotBuffer)
  console.log('hot.json downloaded and saved successfully')
} catch (e) {
  console.error('Error downloading hot.json:', e)
}

console.log('Writing .kitignore file...')
await writeFile(kitPath('.kitignore'), '*')
console.log('.kitignore file written successfully')

console.log('Changing back to original directory...')
cd(originalDir)
console.log(`Current directory is now: ${process.cwd()}`)

try {
  if (process.platform === 'win32') {
    console.log('Setting permissions for Windows batch files...')
    await Promise.all([fsChmod(kitPath('bin', 'kit.bat'), 0o755)])
    console.log('Windows batch file permissions set successfully')
  } else {
    console.log('Setting executable permissions for Unix scripts...')
    await Promise.all([
      fsChmod(kitPath('script'), 0o755),
      fsChmod(kitPath('kar'), 0o755),
      fsChmod(kitPath('bin', 'k'), 0o755),
      fsChmod(kitPath('bin', 'kit'), 0o755),
      fsChmod(kitPath('bin', 'sk'), 0o755),
      fsChmod(kitPath('override', 'code', 'python'), 0o755)
    ])
    console.log('Unix script permissions set successfully')
  }

  console.log('Build completed successfully!')
  process.exit(0)
} catch (e) {
  console.error('Error setting file permissions:', e)
  process.exit(1)
}
