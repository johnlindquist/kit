import test from 'ava'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Helper to import from built .kit output
const importKit = async (...parts) => {
  const base = process.env.KIT
  if (!base) throw new Error('KIT env var not set for tests')
  const fileUrl = pathToFileURL(path.resolve(base, ...parts)).href
  return await import(fileUrl)
}

test.serial('openActionsOverlay calls openActions then setFlagValue when flag provided', async (t) => {
  // Ensure kit globals are available
  await importKit('api', 'kit.js')

  const calls = []
  global.openActions = async () => calls.push({ fn: 'openActions' })
  global.setFlagValue = async (v) => calls.push({ fn: 'setFlagValue', v })

  await global.openActionsOverlay({ source: 'editor', flag: 'abc' })

  t.deepEqual(calls, [
    { fn: 'openActions' },
    { fn: 'setFlagValue', v: 'abc' },
  ])
})

test.serial('closeActionsOverlay calls closeActions', async (t) => {
  await importKit('api', 'kit.js')

  let closed = false
  global.closeActions = async () => { closed = true }

  await global.closeActionsOverlay()
  t.true(closed)
})

test.serial('setActions honors defaultActionsId and defaultClose=false', async (t) => {
  await importKit('api', 'kit.js')

  let sent = null
  global.sendWait = async (channel, payload) => {
    if (channel === (await importKit('core', 'enum.js')).Channel.SET_FLAGS) {
      sent = payload
    }
  }

  const actions = [
    { name: 'Second', flag: 'second', onAction: () => {} },
    { name: 'First', flag: 'first', onAction: () => {} },
  ]

  await global.setActions(actions, { defaultActionsId: 'first', defaultClose: false })

  t.truthy(sent)
  const { flags } = sent
  // default action should be index 0
  t.is(flags.first.index, 0)
  // defaultClose=false should apply unless overridden
  t.is(flags.first.close, false)
  t.is(flags.second.close, false)
})

