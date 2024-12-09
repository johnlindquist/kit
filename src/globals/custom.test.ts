import ava from 'ava'
import '../core/utils.js'
import tmp from 'tmp-promise'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { ensureDir } from 'fs-extra'
import { kenvPath, kitPath } from '../core/utils.js'

// biome-ignore lint/suspicious/useAwait: <explanation>
await tmp.withDir(async (dir) => {
  process.env.KENV = dir.path
  process.env.KIT_CONTEXT = 'workflow'
  
  // Create the base directory first
  await ensureDir(dir.path)
  // Then set KENV to the .kenv subdirectory
  process.env.KENV = path.resolve(dir.path, '.kenv')

  ava.beforeEach(async (t) => {
    global.kitScript = `${randomUUID()}.js`
    global.__kitDbMap = new Map()

    // Create directories after ensuring base directory exists
    await ensureDir(kenvPath())
    await ensureDir(kitPath())

    t.log({
      kenvPath: kenvPath(),
      kitPath: kitPath()
    })
  })

  ava('ensureReadFile creates file with default content if empty', async t => {
    const testPath = path.join(dir.path, 'test.txt')
    const defaultContent = 'default content'
    
    const result = await global.ensureReadFile(testPath, defaultContent)
    t.is(result, defaultContent)
    
    // Verify content persists
    const secondRead = await global.ensureReadFile(testPath)
    t.is(secondRead, defaultContent)
  })

  ava('ensureReadFile preserves existing content', async t => {
    const testPath = path.join(dir.path, 'existing.txt')
    const existingContent = 'existing content'
    
    await global.ensureReadFile(testPath, existingContent)
    const result = await global.ensureReadFile(testPath, 'different default')
    
    t.is(result, existingContent)
  })

  ava('ensureReadJson creates JSON file with default content', async t => {
    const testPath = path.join(dir.path, 'test.json')
    const defaultContent = { test: true, count: 42 }
    
    const result = await global.ensureReadJson(testPath, defaultContent)
    t.deepEqual(result, defaultContent)
    
    // Verify content persists
    const secondRead = await global.ensureReadJson(testPath, { different: 'content' })
    t.deepEqual(secondRead, defaultContent)
  })

  ava('ensureReadJson preserves existing JSON content', async t => {
    const testPath = path.join(dir.path, 'existing.json')
    const existingContent = { existing: true, data: 'test' }
    
    await global.ensureReadJson(testPath, existingContent)
    const result = await global.ensureReadJson(testPath, { different: 'content' })
    
    t.deepEqual(result, existingContent)
  })
})

