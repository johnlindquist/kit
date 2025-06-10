import shelljs from 'shelljs'
import path from 'node:path'
import { homedir, platform } from 'node:os'
import { existsSync, readFileSync } from 'node:fs'
import { rimraf } from 'rimraf'
import { chmod as fsChmod, writeFile } from 'node:fs/promises'
import { execaCommand as exec, type Options } from 'execa'
import { ensureDir, move, pathExists } from 'fs-extra'

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

const originalDir = process.cwd()
const { cd, cp } = shelljs

console.log('LIMITED BUILD - Skipping downloads due to firewall')
console.log(`
Running limited build-kit
Current directory: ${process.cwd()}
Kit path: ${kitPath()}
Platform: ${platform()}
Node executable: ${process.execPath}
`)

// Check if kit directory exists
if (!existsSync(kitPath())) {
  console.log(`Creating kit directory at ${kitPath()}...`)
  await ensureDir(kitPath())
}

console.log(`Copying files to ${kitPath()}...`)
cp('-R', './root/.', kitPath())
cp('-R', './build', kitPath())
cp('-R', './src/types', kitPath())

cp('.npmrc', kitPath())
cp('run.js', kitPath())
cp('API.md', kitPath())
cp('README.md', kitPath())
cp('LICENSE', kitPath())
console.log('Finished copying base files')

const kitEditorDtsPath = path.resolve('src', 'editor', 'types', 'kit-editor.d.ts')
if (existsSync(kitEditorDtsPath)) {
  console.log(`Copying editor types from ${kitEditorDtsPath}`)
  const editorTypesPath = kitPath('editor', 'types', 'kit-editor.d.ts')
  console.log(`Copying to ${editorTypesPath}`)
  await ensureDir(path.dirname(editorTypesPath))
  cp(kitEditorDtsPath, editorTypesPath)
}
console.log('Finished copying editor types')

console.log('Building ESM to', kitPath())
cd(kitPath())

try {
  await exec('npm run build-kit-esm', options)
  console.log('ESM build completed successfully')
} catch (error) {
  console.error('Error building ESM:', error)
  process.exit(1)
}

console.log('Building declarations to', kitPath())
try {
  await exec('npm run build-kit-declarations', options)
  console.log('Declarations build completed successfully')
} catch (error) {
  console.error('Error building declarations:', error)
  process.exit(1)
}

// Skip downloads
console.log('SKIPPING: Download docs and hot.json due to firewall')

// Create empty data files
await ensureDir(kitPath('data'))
await writeFile(kitPath('data', 'docs.json'), JSON.stringify([]))
await writeFile(kitPath('data', 'hot.json'), JSON.stringify([]))

console.log('Writing .kitignore file...')
await writeFile(kitPath('.kitignore'), '*')
console.log('.kitignore file written successfully')

console.log('Changing back to original directory...')
cd(originalDir)
console.log(`Current directory is now: ${process.cwd()}`)

try {
  if (process.platform === 'win32') {
    console.log('Setting permissions for Windows batch files...')
    await Promise.all([
      fsChmod(kitPath('bin', 'kit.bat'), 0o755),
      fsChmod(kitPath('bin', 'mcp.bat'), 0o755)
    ])
    console.log('Windows batch file permissions set successfully')
  } else {
    console.log('Setting executable permissions for Unix scripts...')
    await Promise.all([
      fsChmod(kitPath('script'), 0o755),
      fsChmod(kitPath('kar'), 0o755),
      fsChmod(kitPath('bin', 'k'), 0o755),
      fsChmod(kitPath('bin', 'kit'), 0o755),
      fsChmod(kitPath('bin', 'sk'), 0o755),
      fsChmod(kitPath('bin', 'mcp'), 0o755),
      fsChmod(kitPath('override', 'code', 'python'), 0o755)
    ])
    console.log('Unix script permissions set successfully')
  }

  console.log('Limited build completed successfully!')
  process.exit(0)
} catch (e) {
  console.error('Error setting file permissions:', e)
  process.exit(1)
}