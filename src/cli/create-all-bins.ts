import { getScripts } from '../core/db.js'
import { getKenvs, processInBatches } from '../core/utils.js'

let scripts = await getScripts(false)
let kenvs = await getKenvs()

log(` Found kenvs`, kenvs)

// Parallelize cleanup operations
const cleanupOperations = [
  trash([`!${kenvPath('bin', '.gitignore')}`, kenvPath('bin', '*')]),
  ...kenvs.map((kenv) => trash([`!${path.resolve(kenv, 'bin', '.gitignore')}`, path.resolve(kenv, 'bin', '*')]))
]

await Promise.all(cleanupOperations)

// Create directories in parallel
const dirCreationOperations = [ensureDir(kenvPath('bin')), ...kenvs.map((kenv) => ensureDir(path.resolve(kenv, 'bin')))]

await Promise.all(dirCreationOperations)

let jsh = process.env?.SHELL?.includes('jsh')
let template = jsh ? 'stackblitz' : 'terminal'
let useCmd = process.platform === 'win32' && !process.env?.KIT_WSL

if (useCmd) {
  template = 'cmd'
}
let binTemplate = await readFile(kitPath('templates', 'bin', template), 'utf8')

let binTemplateCompiler = compile(binTemplate)

// Create bin files in parallel batches
const binCreationOperations = scripts.map(async ({ command, filePath }) => {
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type: 'scripts',
    KIT: kitPath(),
    KIT_NODE_PATH: process.env.KIT_NODE_PATH,
    ...global.env,
    TARGET_PATH: filePath
  })

  let binDirPath = path.resolve(filePath, '..', '..', ...(jsh ? ['node_modules', '.bin'] : ['bin']))
  let binFilePath = path.resolve(binDirPath, command)
  if (useCmd) {
    binFilePath += '.cmd'
  }

  await global.writeFile(binFilePath, compiledBinTemplate)
  return global.chmod(755, binFilePath)
})

// Process bin creation in batches of 100
await processInBatches(binCreationOperations, 100)

export {}
