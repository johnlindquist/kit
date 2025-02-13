import ava from 'ava'
import '../../test-sdk/config.js'
import { pathToFileURL } from 'node:url'

ava.serial('env should work with different params', async (t) => {
  let name = 'mock-env-message'
  let content = `
    await env("MOCK_ENV_MESSAGE", "Enter a value:")    
    `
  let type = 'js'

  await exec(`kit new ${name} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: type
    }
  })

  await appendFile(kenvPath('scripts', `${name}.js`), content)

  if (process.platform === 'win32') {
    name += '.cmd'
  }

  let p = exec(`${kenvPath('bin', name)}`)

  p.stdin.write('Some value\n')

  let { stdout } = await p

  t.regex(stdout, /env/)
})

ava.serial('All globals exist', async (t) => {
  // TODO: Make platform independent...
  /** @type {import("../platform/darwin")} */
  await import(pathToFileURL(kitPath('core', 'utils.js')).href)
  await import(pathToFileURL(kitPath('platform', 'darwin.js')).href)
  await import(pathToFileURL(kitPath('target', 'app.js')).href)
  await import(pathToFileURL(kitPath('api', 'pro.js')).href)
  await import(pathToFileURL(kitPath('index.js')).href)

  let files = await readdir(kitPath('types'))
  let content = ``
  for await (let f of files) {
    content += await readFile(kitPath('types', f), 'utf-8')
  }

  let matches = content.match(/(?<=^\s*var ).*?(?=:)/gim).filter((m) => !m.includes('projectPath'))

  for (let m of matches) {
    t.log(`Checking if ${m} exists on global...`)
    t.true(typeof global[m] !== 'undefined', `${m} is missing`)
  }
})
