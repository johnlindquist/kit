import path from 'node:path'
import { existsSync, lstatSync } from 'node:fs'
import { readJson } from '../globals/fs-extra.js'
import { readFile } from '../globals/fs.js'
import * as os from 'node:os'
import { pathToFileURL } from 'node:url'
import * as JSONSafe from 'safe-stable-stringify'
import { QuickScore, quickScore, createConfig, type Options, type ConfigOptions } from 'quick-score'
import { formatDistanceToNow } from '../utils/date.js'
import type {
  Action,
  Choice,
  FlagsObject,
  FlagsWithKeys,
  PromptConfig,
  ScoredChoice,
  Script,
  Scriptlet,
  Shortcut
} from '../types/core'
import { Channel, PROMPT } from '../core/enum.js'

import {
  kitPath,
  kenvPath,
  resolveScriptToCommand,
  run,
  home,
  isFile,
  getKenvs,
  groupChoices,
  formatChoices,
  parseScript,
  processInBatches,
  highlight,
  md as mdUtil,
  tagger
} from '../core/utils.js'
import { getScripts, getScriptFromString, getUserJson, getTimestamps, type Stamp, setUserJson } from '../core/db.js'

import { default as stripAnsi } from 'strip-ansi'

import type { Kenv } from '../types/kit'
import type { Fields as TraceFields } from 'chrome-trace-event'
import dotenv from 'dotenv'
import type { kenvEnv } from '../types/env'
import { getRecentLimit } from './recent.js'

global.__kitActionsMap = new Map<string, Action | Shortcut>()

export async function initTrace() {
  if (process.env.KIT_TRACE || (process.env.KIT_TRACE_DATA && !global?.trace?.enabled)) {
    let timestamp = Date.now()
    let { default: Trace } = await import('chrome-trace-event')
    let tracer = new Trace.Tracer({
      noStream: true
    })

    await ensureDir(kitPath('trace'))

    let writeStream = createWriteStream(kitPath('trace', `trace-${timestamp}.json`))

    tracer.pipe(writeStream)

    const tidCache = new Map()

    function updateFields(channel) {
      let tid
      if (channel) {
        let cachedTid = tidCache.get(channel)
        if (cachedTid === undefined) {
          cachedTid = Object.entries(Channel).findIndex(([, value]) => value === channel)
          tidCache.set(channel, cachedTid)
        }
        tid = cachedTid
      }
      return tid
    }

    function createTraceFunction(eventType: 'B' | 'E' | 'I') {
      return function (fields: TraceFields) {
        fields.tid = updateFields(fields?.channel) || 1
        if (!process.env.KIT_TRACE_DATA) {
          fields.args = undefined
        }
        return tracer.mkEventFunc(eventType)(fields)
      }
    }

    global.trace = {
      begin: createTraceFunction('B'),
      end: createTraceFunction('E'),
      instant: createTraceFunction('I'),
      flush: () => {
        tracer.flush()
      },
      enabled: true
    }

    global.trace.instant({
      name: 'Init Trace',
      args: {
        timestamp
      }
    })
  }
}

global.trace ||= {
  begin: () => { },
  end: () => { },
  instant: () => { },
  flush: () => { },
  enabled: false
}

global.isWin = os.platform().startsWith('win')
global.isMac = os.platform().startsWith('darwin')
global.isLinux = os.platform().startsWith('linux')
global.cmd = global.isMac ? 'cmd' : 'ctrl'

let isErrored = false
export let errorPrompt = async (error: Error) => {
  if (isErrored) {
    return
  }
  isErrored = true
  if (global.__kitAbandoned) {
    let { name } = path.parse(global.kitScript)
    let errorLog = path.resolve(path.dirname(path.dirname(global.kitScript)), 'logs', `${name}.log`)

    await appendFile(errorLog, `\nAbandonned. Exiting...`)
    exit()
  }
  if (process.env.KIT_CONTEXT === 'app') {
    global.warn(`☠️ ERROR PROMPT SHOULD SHOW ☠️`)
    let stackWithoutId = error?.stack?.replace(/\?[^:]*/g, '') || 'No Error Stack'
    global.warn(stackWithoutId)

    let errorFile = global.kitScript
    let line = '1'
    let col = '1'

    let secondLine = stackWithoutId.split('\n')?.[1] || ''

    // TODO: This is broken on Windows...
    if (secondLine?.match('at file://')) {
      if (isWin) {
        errorFile = path.normalize(secondLine.replace('at file:///', '').replace(/:\d+/g, '').trim())
          ;[, , line, col] = secondLine.replace('at file:///', '').split(':')
      } else {
        errorFile = secondLine.replace('at file://', '').replace(/:.*/, '').trim()
          ;[, line, col] = secondLine.replace('at file://', '').split(':')
      }
    }

    // END TODO

    let script = global.kitScript.replace(/.*\//, '')
    let errorToCopy = `${error.message}\n${error.stack}`
    let dashedDate = () => new Date().toISOString().replace('T', '-').replace(/:/g, '-').split('.')[0]
    let errorJsonPath = global.tmp(`error-${dashedDate()}.txt`)
    await global.writeFile(errorJsonPath, errorToCopy)

    try {
      if (global?.args.length > 0) {
        log({ args })
        args = []
      }
      global.warn(`Running error action because of`, {
        script,
        error
      })
      await run(kitPath('cli', 'error-action.js'), script, errorJsonPath, errorFile, line, col)
    } catch (error) {
      global.warn(error)
    }
  } else {
    global.console.log(error)
  }
}

export let outputTmpFile = async (fileName: string, contents: string) => {
  let outputPath = path.resolve(os.tmpdir(), 'kit', fileName)
  await outputFile(outputPath, contents)
  return outputPath
}

export let copyTmpFile = async (fromFile: string, fileName: string) =>
  await outputTmpFile(fileName, await global.readFile(fromFile, 'utf-8'))

export let buildWidget = async (scriptPath, outPath = '') => {
  let outfile = outPath || scriptPath

  let templateContent = await readFile(kenvPath('templates', 'widget.html'), 'utf8')

  let REACT_PATH = kitPath('node_modules', 'react', 'index.js')
  let REACT_DOM_PATH = kitPath('node_modules', 'react-dom', 'index.js')

  let REACT_CONTENT = `
  let { default: React } = await import(
    kitPath("node_modules", "react", "umd", "react.development.js")
  )
  let { default: ReactDOM } = await import(
    kitPath("node_modules", "react-dom", "umd", "react-dom.deveolpment.js")
  )
  
  let __renderToString = (x, y, z)=> Server.renderToString(React.createElement(x, y, z))  
  `

  let templateCompiler = compile(templateContent)
  let result = templateCompiler({
    REACT_PATH,
    REACT_DOM_PATH,
    REACT_CONTENT
  })

  let contents = await readFile(outfile, 'utf8')

  await writeFile(outfile, result)
}

let getMissingPackages = (e: string): string[] => {
  let missingPackage = []
  if (e.includes('Cannot find package')) {
    missingPackage = e.match(/(?<=Cannot find package ['"]).*(?=['"])/g)
  } else if (e.includes('Could not resolve')) {
    missingPackage = e.match(/(?<=Could not resolve ['"]).*(?=['"])/g)
  } else if (e.includes('Cannot find module')) {
    missingPackage = e.match(/(?<=Cannot find module ['"]).*(?=['"])/g)
  }

  return (missingPackage || []).map((s) => s.trim()).filter(Boolean)
}

global.attemptImport = async (scriptPath, ..._args) => {
  let cachedArgs = args.slice(0)
  let importResult = undefined
  try {
    global.updateArgs(_args)

    let href = pathToFileURL(scriptPath).href
    let kitImport = `${href}?now=${Date.now()}.kit`
    importResult = await import(kitImport)
  } catch (error) {
    let e = error.toString()
    global.warn(e)
    if (process.env.KIT_CONTEXT === 'app') {
      await errorPrompt(error)
    } else {
      throw error
    }
  }

  return importResult
}

global.silentAttemptImport = async (scriptPath, ..._args) => {
  let cachedArgs = args.slice(0)
  let importResult = undefined
  try {
    global.updateArgs(_args)

    let href = pathToFileURL(scriptPath).href
    let kitImport = `${href}?now=${Date.now()}.kit`
    importResult = await import(kitImport)
  } catch (error) { }

  return importResult
}

global.__kitAbandoned = false
global.send = (channel: Channel, value?: any) => {
  if (global.__kitAbandoned) return null
  if (process?.send) {
    try {
      let payload = {
        pid: process.pid,
        promptId: global.__kitPromptId,
        kitScript: global.kitScript,
        channel,
        value
      }

      global.trace.instant({
        name: `Send ${channel}`,
        channel,
        args: payload
      })

      process.send(payload)
    } catch (e) {
      global.warn(e)
    }
  } else {
    // console.log(from, ...args)
  }
}

global.sendResponse = (body: any, headers: Record<string, string> = {}) => {
  let statusCode = 200
  if (headers['Status-Code']) {
    statusCode = Number.parseInt(headers['Status-Code'], 10)
    headers['Status-Code'] = undefined
  }

  const responseHeaders = { ...headers }
  if (!responseHeaders['Content-Type']) {
    responseHeaders['Content-Type'] = 'application/json'
  }

  const response = {
    body,
    statusCode,
    headers: responseHeaders
  }

  return global.sendWait(Channel.RESPONSE, response)
}

let _consoleLog = global.console.log.bind(global.console)
let _consoleWarn = global.console.warn.bind(global.console)
let _consoleClear = global.console.clear.bind(global.console)
let _consoleError = global.console.error.bind(global.console)
let _consoleInfo = global.console.info.bind(global.console)

global.log = (...args) => {
  if (process?.send && process.env.KIT_CONTEXT === 'app') {
    global.send(Channel.KIT_LOG, args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' '))
  } else {
    _consoleLog(...args)
  }
}
global.warn = (...args) => {
  if (process?.send && process.env.KIT_CONTEXT === 'app') {
    global.send(Channel.KIT_WARN, args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' '))
  } else {
    _consoleWarn(...args)
  }
}
global.clear = () => {
  if (process?.send && process.env.KIT_CONTEXT === 'app') {
    global.send(Channel.KIT_CLEAR)
  } else {
    _consoleClear()
  }
}

if (process?.send && process.env.KIT_CONTEXT === 'app') {
  global.console.log = (...args) => {
    let log = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    global.send(Channel.CONSOLE_LOG, log)
  }

  global.console.warn = (...args) => {
    let warn = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_WARN, warn)
    } else {
      _consoleWarn(...args)
    }
  }

  global.console.clear = () => {
    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_CLEAR)
    } else {
      _consoleClear()
    }
  }

  global.console.error = (...args) => {
    let error = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_ERROR, error)
    } else {
      _consoleError(...args)
    }
  }

  global.console.info = (...args) => {
    let info = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_INFO, info)
    } else {
      _consoleInfo(...args)
    }
  }
}

global.dev = async (data) => {
  await global.sendWait(Channel.DEV_TOOLS, data)
}
global.devTools = global.dev

global.showImage = async (html, options) => {
  await global.widget(
    md(`## \`showImage\` is Deprecated

Please use the new \`widget\` function instead.

[https://github.com/johnlindquist/kit/discussions/745](https://github.com/johnlindquist/kit/discussions/745)
`)
  )
  // global.send(Channel.SHOW, { options, html })
}

global.setPlaceholder = async (text) => {
  await global.sendWait(Channel.SET_PLACEHOLDER, stripAnsi(text))
}

global.setEnter = async (text) => {
  await global.sendWait(Channel.SET_ENTER, text)
}

global.main = async (scriptPath: string, ..._args) => {
  let kitScriptPath = kitPath('main', scriptPath) + '.js'
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.lib = async (lib: string, ..._args) => {
  let libScriptPath = path.resolve(global.kitScript, '..', '..', 'lib', lib) + '.js'
  return await global.attemptImport(libScriptPath, ..._args)
}

global.cli = async (cliPath, ..._args) => {
  let cliScriptPath = kitPath('cli', cliPath) + '.js'

  return await global.attemptImport(cliScriptPath, ..._args)
}

global.setup = async (setupPath, ..._args) => {
  global.setPlaceholder(`>_ setup: ${setupPath}...`)
  let setupScriptPath = kitPath('setup', setupPath) + '.js'
  return await global.attemptImport(setupScriptPath, ..._args)
}

global.kenvTmpPath = (...parts) => {
  let command = resolveScriptToCommand(global.kitScript)
  let scriptTmpDir = kenvPath('tmp', command, ...parts)

  mkdir('-p', path.dirname(scriptTmpDir))
  return scriptTmpDir
}

export let tmpPath = (...parts: string[]) => {
  let command = global?.kitScript ? resolveScriptToCommand(global.kitScript) : ''

  let tmpCommandDir = path.resolve(os.tmpdir(), 'kit', command)

  let scriptTmpDir = path.resolve(tmpCommandDir, ...parts)

  let kenvTmpCommandPath = kenvPath('tmp', command)

  global.ensureDirSync(tmpCommandDir)
  // symlink to kenvPath("command")
  // Check if tmpCommandDir exists and is not a symlink before creating the symlink
  if (!existsSync(kenvTmpCommandPath) || lstatSync(kenvTmpCommandPath).isSymbolicLink()) {
    global.ensureSymlinkSync(tmpCommandDir, kenvTmpCommandPath)
  }

  return scriptTmpDir
}

global.tmpPath = tmpPath
/**
 * @deprecated use `tmpPath` instead
 */
global.tmp = global.tmpPath
global.inspect = async (data, fileName) => {
  let dashedDate = () => new Date().toISOString().replace('T', '-').replace(/:/g, '-').split('.')[0]

  let formattedData = data
  let tmpFullPath = ''

  if (typeof data !== 'string') {
    formattedData = JSONSafe.stringify(data, null, '\t')
  }

  if (fileName) {
    tmpFullPath = tmpPath(fileName)
  } else if (typeof data === 'object') {
    tmpFullPath = tmpPath(`${dashedDate()}.json`)
  } else {
    tmpFullPath = tmpPath(`${dashedDate()}.txt`)
  }

  await global.writeFile(tmpFullPath, formattedData)

  await global.edit(tmpFullPath)
}

global.compileTemplate = async (template, vars) => {
  let templateContent = await global.readFile(kenvPath('templates', template), 'utf8')
  let templateCompiler = global.compile(templateContent)
  return templateCompiler(vars)
}

global.currentOnTab = null
global.onTabs = []
global.onTabIndex = 0
global.onTab = (name, tabFunction) => {
  let fn = async (...args) => {
    await tabFunction(...args)
  }
  global.onTabs.push({ name, fn })
  if (global.flag?.tab) {
    if (global.flag?.tab === name) {
      let tabIndex = global.onTabs.length - 1
      global.onTabIndex = tabIndex
      global.send(Channel.SET_TAB_INDEX, tabIndex)
      global.currentOnTab = fn()
    }
  } else if (global.onTabs.length === 1) {
    global.onTabIndex = 0
    global.send(Channel.SET_TAB_INDEX, 0)
    global.currentOnTab = fn()
  }
}

global.kitPrevChoices = []

global.groupChoices = groupChoices
global.formatChoices = formatChoices

global.addChoice = async (choice: string | Choice) => {
  if (typeof choice !== 'object') {
    choice = {
      name: String(choice),
      value: String(choice)
    }
  }

  choice.id ||= global.uuid()
  return await global.sendWait(Channel.ADD_CHOICE, choice)
}

global.appendChoices = async (choices: string[] | Choice[]) => {
  return await global.sendWait(Channel.APPEND_CHOICES, choices)
}

// TODO: Add an option to avoid sorting
global.createChoiceSearch = async (
  choices: Choice[],
  config: Partial<Omit<Options, 'keys'> & ConfigOptions & { keys: string[] }> = {
    minimumScore: 0.3,
    maxIterations: 3,
    keys: ['name']
  }
) => {
  if (!config?.minimumScore) config.minimumScore = 0.3
  if (!config?.maxIterations) config.maxIterations = 3
  if (config?.keys && Array.isArray(config.keys)) {
    config.keys = config.keys.map((key) => {
      if (key === 'name') return 'slicedName'
      if (key === 'description') return 'slicedDescription'
      return key
    })
  }

  let formattedChoices = await global.___kitFormatChoices(choices)
  function scorer(string: string, query: string, matches: number[][]) {
    return quickScore(string, query, matches as any, undefined, undefined, createConfig(config))
  }

  const keys = (config?.keys || ['slicedName']).map((name) => ({
    name,
    scorer
  }))

  let qs = new QuickScore<Choice>(formattedChoices, {
    keys,
    ...config
  })

  return (query: string) => {
    let result = qs.search(query) as ScoredChoice[]
    if (result.find((c) => c?.item?.group)) {
      let createScoredChoice = (item: Choice): ScoredChoice => {
        return {
          item,
          score: 0,
          matches: {},
          _: ''
        }
      }
      const groups: Set<string> = new Set()
      const keepGroups: Set<string> = new Set()
      const filteredBySearch: ScoredChoice[] = []

      // Build a map for constant time access
      const resultMap = new Map(result.map((r) => [r.item.id, r]))

      for (const choice of formattedChoices) {
        if (choice?.skip) {
          const scoredSkip = createScoredChoice(choice)
          filteredBySearch.push(scoredSkip)
          if (choice?.group) groups.add(choice.group)
        } else {
          const scored = resultMap.get(choice?.id)
          if (scored) {
            filteredBySearch.push(scored)
            if (choice?.group && groups.has(choice.group)) {
              keepGroups.add(choice.group)
            }
          }
        }
      }

      result = filteredBySearch.filter((sc) => {
        if (sc?.item?.skip) {
          if (!keepGroups.has(sc?.item?.group)) return false
        }

        return true
      })
    }

    return result
  }
}

global.setScoredChoices = async (choices: ScoredChoice[]) => {
  return await global.sendWait(Channel.SET_SCORED_CHOICES, choices)
}

global.___kitFormatChoices = async (choices, className = '') => {
  if (!Array.isArray(choices)) {
    return choices
  }
  let formattedChoices = formatChoices(choices, className)
  let { __currentPromptConfig } = global as any
  let { shortcuts: globalShortcuts } = __currentPromptConfig || {}

  if (globalShortcuts && choices?.[0]) {
    let shortcuts = globalShortcuts.filter((shortcut) => {
      if (shortcut?.condition) {
        return shortcut.condition(choices?.[0])
      }
      return true
    })

    global.send(Channel.SET_SHORTCUTS, shortcuts)
  }
  global.kitPrevChoices = formattedChoices

  global.setLoading(false)
  return formattedChoices
}

global.setChoices = async (choices, config) => {
  let formattedChoices = await global.___kitFormatChoices(choices, config?.className || '')
  global.send(Channel.SET_CHOICES, {
    choices: formattedChoices,
    skipInitialSearch: config?.skipInitialSearch,
    inputRegex: config?.inputRegex || '',
    generated: Boolean(config?.generated)
  })

  performance.measure('SET_CHOICES', 'run')
}

global.flag ||= {}
global.prepFlags = (flagsOptions: FlagsObject): FlagsObject => {
  for (let key of Object.keys(global?.flag)) {
    delete global?.flag?.[key]
  }

  if (!flagsOptions || Object.entries(flagsOptions)?.length === 0) {
    return false
  }

  let validFlags = {
    sortChoicesKey: (flagsOptions as FlagsWithKeys)?.sortChoicesKey || [],
    order: (flagsOptions as FlagsWithKeys)?.order || []
  }
  let currentFlags = Object.entries(flagsOptions)
  for (let [key, value] of currentFlags) {
    if (key === 'order') continue
    if (key === 'sortChoicesKey') continue

    let validFlag = {
      ...value,
      name: value?.name || key,
      shortcut: value?.shortcut || '',
      description: value?.description || '',
      value: key,
      bar: value?.bar || '',
      preview: value?.preview || '',
      hasAction: Boolean(value?.onAction)
    }
    validFlags[key] = validFlag

    if (value?.group) {
      validFlags[key].group = value.group
    }
  }

  for (const [key, value] of currentFlags) {
    if (key === 'order') continue
    if (key === 'sortChoicesKey') continue
    const choice = {
      id: key,
      name: value?.name || key,
      value: key,
      description: value?.description || '',
      preview: value?.preview || '<div></div>',
      shortcut: value?.shortcut || '',
      onAction: value?.onAction || null
    } as Choice

    if (value?.group) {
      choice.group = value.group
    }

    global.__kitActionsMap.set(value?.name || key, choice)
  }

  return validFlags
}

global.setFlags = async (flags: FlagsObject, options = {}) => {
  let flagsMessage = {
    flags: global.prepFlags(flags),
    options: {
      name: options?.name || '',
      placeholder: options?.placeholder || '',
      active: options?.active || 'Actions'
    }
  }
  // TODO: Move props from FlagsObject like "order", "sortChoicesKey" to the options
  await global.sendWait(Channel.SET_FLAGS, flagsMessage)
}

function sortArrayByIndex(arr) {
  const sortedArr = []
  const indexedItems = []

  // Separate indexed items from non-indexed items
  arr.forEach((item, i) => {
    if (item.hasOwnProperty('index')) {
      indexedItems.push({ item, index: item.index })
    } else {
      sortedArr.push(item)
    }
  })

  // Sort indexed items based on their index
  indexedItems.sort((a, b) => a.index - b.index)

  // Insert indexed items into the sorted array at their respective positions
  for (const { item, index } of indexedItems) {
    sortedArr.splice(index, 0, item)
  }

  return sortedArr
}

export let getFlagsFromActions = (actions: PromptConfig['actions']) => {
  let flags: FlagsObject = {}
  let indices = new Set()
  for (let a of actions as Action[]) {
    if (a?.index) {
      indices.add(a.index)
    }
  }
  let groups = new Set()
  if (Array.isArray(actions)) {
    const sortedActions = sortArrayByIndex(actions)
    for (let i = 0; i < sortedActions.length; i++) {
      let action = sortedActions[i]
      if (typeof action === 'string') {
        action = {
          name: action,
          flag: action
        }
      }
      if (action?.group) {
        groups.add(action.group)
      }

      let flagAction = {
        flag: action.flag || action.name,
        index: i,
        close: true,
        ...action,
        hasAction: !!action?.onAction,
        bar: action?.visible ? 'right' : ''
      } as Action
      flags[action.flag || action.name] = flagAction
    }
  }

  flags.sortChoicesKey = Array.from(groups).map((g) => 'index')

  return flags
}

global.setActions = async (actions: Action[], options = {}) => {
  let flags = getFlagsFromActions(actions)
  await setFlags(flags, options)
}

global.openActions = async () => {
  await sendWait(Channel.OPEN_ACTIONS)
}

global.closeActions = async () => {
  await sendWait(Channel.CLOSE_ACTIONS)
}

global.setFlagValue = (value: any) => {
  return global.sendWait(Channel.SET_FLAG_VALUE, value)
}

global.hide = async (hideOptions = {}) => {
  await global.sendWait(Channel.HIDE_APP, hideOptions)
  if (process.env.KIT_HIDE_DELAY) {
    await wait(-process.env.KIT_HIDE_DELAY)
  }
}

global.show = async () => {
  await global.sendWait(Channel.SHOW_APP)
}

global.blur = async () => {
  await global.sendWait(Channel.BLUR_APP, {})
}

global.run = run

let wrapCode = (html: string, containerClass: string, codeStyles = '') => {
  return `<pre class="${containerClass}">
  <style type="text/css">
      code{
        font-size: 0.9rem !important;
        width: 100%;
        ${codeStyles}
      }
      pre{
        display: flex;
      }
      p{
        margin-bottom: 1rem;
      }
  </style>
  <code>
${html.trim()}
  </code>
</pre>`
}

let getLanguage = (language: string) => {
  if (language.includes('python')) return 'python'
  if (language.includes('ruby')) return 'ruby'
  if (language.includes('php')) return 'php'
  if (language.includes('perl')) return 'perl'

  switch (language) {
    case 'node':
      language = 'javascript'
      break

    case 'sh':
    case 'zsh':
      language = 'bash'
      break

    case 'irb':
      language = 'ruby'
      break

    case 'raku':
    case 'perl6':
      language = 'perl'
      break

    case 'ps1':
    case 'pwsh':
      language = 'powershell'
      break

    case 'tclsh':
      language = 'tcl'
      break

    case 'erl':
    case 'escript':
      language = 'erlang'
      break

    case 'iex':
      language = 'elixir'
      break

    case 'rscript':
    case 'r':
      language = 'r'
      break

    case 'ghci':
    case 'hugs':
      language = 'haskell'
      break

    default:
      // If the language is not recognized or already has the correct syntax, leave it as is.
      break
  }

  return language
}

export let highlightJavaScript = async (filePath: string, shebang = ''): Promise<string> => {
  let isPathAFile = await isFile(filePath)
  let contents = ``
  if (isPathAFile) {
    contents = await readFile(filePath, 'utf8')
  } else {
    contents = filePath.trim()
  }

  let { default: highlight } = global.__kitHighlight || (await import('highlight.js'))
  if (!global.__kitHighlight) global.__kitHighlight = { default: highlight }
  let highlightedContents = ``
  if (shebang) {
    // split shebang into command and args
    let [command, ...shebangArgs] = shebang.split(' ')

    let language = command.endsWith('env') ? shebangArgs?.[0] : command.split('/').pop() || 'bash'

    language = getLanguage(language)
    highlightedContents = highlight.highlight(contents, {
      language
    }).value
  } else {
    highlightedContents = highlight.highlight(contents, {
      language: 'javascript'
    }).value
  }

  let wrapped = wrapCode(highlightedContents, 'px-5')
  return wrapped
}

let order = [
  'Script Actions',
  'New',
  'Copy',
  'Debug',
  'Kenv',
  'Git',
  'Share',
  'Export',
  // "DB",
  'Run'
]

export let actions: Action[] = [
  // {
  //   name: "New Menu",
  //   key: `${cmd}+shift+n`,
  //   onPress: async () => {
  //     await run(kitPath("cli", "new-menu.js"))
  //   },
  // },
  {
    name: 'New Script',
    description: 'Create a new script',
    shortcut: `${cmd}+n`,
    onAction: async () => {
      await run(kitPath('cli', 'new.js'))
    },
    group: 'New'
  },
  {
    name: 'Generate Script with AI',
    description: 'Generate a new script with AI',
    shortcut: `${cmd}+shift+n`,
    onAction: async () => {
      await run(kitPath('cli', 'generate-script.js'))
    },
    group: 'New'
  },
  {
    name: 'New Scriptlet',
    description: 'Create a new scriptlet',
    shortcut: `${cmd}+shift+n`,
    onAction: async () => {
      await run(kitPath('cli', 'new-scriptlet.js'))
    },
    group: 'New'
  },
  {
    name: 'New Snippet',
    description: 'Create a new snippet',
    shortcut: `${cmd}+opt+n`,
    onAction: async () => {
      await run(kitPath('cli', 'new-snippet.js'))
    },
    group: 'New'
  },
  {
    name: 'New Theme',
    description: 'Create a new theme',
    onAction: async () => {
      await run(kitPath('cli', 'new-theme.js'))
    },
    group: 'New'
  },
  {
    name: 'Sign In',
    description: 'Log in to GitHub to Script Kit',
    flag: 'sign-in-to-script-kit',
    shortcut: `${cmd}+shift+opt+s`,
    onAction: async () => {
      await run(kitPath('main', 'account-v2.js'))
    },
    group: 'Settings'
  },
  {
    name: 'List Processes',
    description: 'List running processes',
    shortcut: `${cmd}+p`,
    onAction: async () => {
      let processes = await getProcesses()
      if (processes.filter((p) => p?.scriptPath)?.length > 1) {
        await run(kitPath('cli', 'processes.js'))
      } else {
        toast('No running processes found...')
      }
    },
    group: 'Debug'
  },
  {
    name: 'Find Script',
    description: 'Search for a script by contents',
    shortcut: `${cmd}+f`,
    onAction: async () => {
      global.setFlags({})
      await run(kitPath('cli', 'find.js'))
    },
    group: 'Script Actions'
  },
  {
    name: 'Reset Prompt',
    shortcut: `${cmd}+0`,
    onAction: async () => {
      await run(kitPath('cli', 'kit-clear-prompt.js'))
    },
    group: 'Script Actions'
  },
  // TODO: Figure out why setFlags is being called twice and overridden here
  // {
  //   name: "Share",
  //   description: "Share {{name}}",
  //   shortcut: `${cmd}+s`,
  //   condition: c => !c.needsDebugger,
  //   onAction: async (input, { focused }) => {
  //     let shareFlags = {}
  //     for (let [k, v] of Object.entries(scriptFlags)) {
  //       if (k.startsWith("share")) {
  //         shareFlags[k] = v
  //         delete shareFlags[k].group
  //       }
  //     }
  //     await setFlags(shareFlags)
  //     await setFlagValue(focused?.value)
  //   },
  //   group: "Script Actions",
  // },
  {
    name: 'Debug',
    shortcut: `${cmd}+enter`,
    condition: (c) => c.needsDebugger,
    onAction: async (input, { focused }) => {
      flag.cmd = true
      submit(focused)
    },
    group: 'Debug'
  },
  {
    name: 'Support',
    shortcut: `${cmd}+i`,
    close: false,
    onAction: async () => {
      let userJson = await getUserJson()
      let loggedIn = userJson?.login
      let helpActions: Action[] = [
        ...(loggedIn
          ? [
            {
              name: 'Sign Out',
              description: 'Sign out of Script Kit',
              onAction: async () => {
                await deauthenticate()
              }
            }
          ]
          : [
            {
              name: 'Sign In',
              description: 'Sign in to Script Kit',
              onAction: async () => {
                await run(kitPath('main', 'account-v2.js'))
              }
            }
          ]),
        {
          name: 'Read Docs',
          description: 'Read the docs',
          onAction: async () => {
            await open('https://scriptkit.com/docs')
            exit()
          }
        },
        {
          name: 'Ask a Question',
          description: 'Open GitHub Discussions',
          onAction: async () => {
            await open(`https://github.com/johnlindquist/kit/discussions`)
            exit()
          }
        },
        {
          name: 'Report a Bug',
          description: 'Open GitHub Issues',
          onAction: async () => {
            await open(`https://github.com/johnlindquist/kit/issues`)
            exit()
          }
        },
        {
          name: 'Join Discord Server',
          description: 'Hang out on Discord',
          onAction: async () => {
            let response = await get('https://scriptkit.com/api/discord-invite')
            await open(response.data)
            exit()
          }
        }
      ]
      await setActions(helpActions, {
        name: `Script Kit ${process.env.KIT_APP_VERSION}`,
        placeholder: 'Support',
        active: 'Script Kit Support'
      })
      openActions()
    },
    group: 'Support'
  }
]

export let modifiers = {
  cmd: 'cmd',
  shift: 'shift',
  opt: 'opt',
  ctrl: 'ctrl'
}

export let scriptFlags: FlagsObject = {
  order,
  sortChoicesKey: order.map((o) => ''),
  // open: {
  //   name: "Script Actions",
  //   description: "Open {{name}} in your editor",
  //   shortcut: `${cmd}+o`,
  //   action: "right",
  // },
  // ["new-menu"]: {
  //   name: "New",
  //   description: "Create a new script",
  //   shortcut: `${cmd}+n`,
  //   action: "left",
  // },
  ['edit-script']: {
    name: 'Edit',
    shortcut: `${cmd}+o`,
    group: 'Script Actions',
    description: 'Open {{name}} in your editor',
    preview: async (input, state) => {
      let flaggedFilePath = state?.flaggedValue?.filePath
      if (!flaggedFilePath) return

      // Get last modified time
      let { size, mtime, mtimeMs } = await stat(flaggedFilePath)
      let lastModified = new Date(mtimeMs)

      let stamps = await getTimestamps()
      let stamp = stamps.stamps.find((s) => s.filePath === flaggedFilePath)

      let composeBlock = (...lines) => lines.filter(Boolean).join('\n')

      let compileMessage = stamp?.compileMessage?.trim() || ''
      let compileStamp = stamp?.compileStamp
        ? `Last compiled: ${formatDistanceToNow(new Date(stamp?.compileStamp), {
          addSuffix: false
        })} ago`
        : ''
      let executionTime = stamp?.executionTime ? `Last run duration: ${stamp?.executionTime}ms` : ''
      let runCount = stamp?.runCount ? `Run count: ${stamp?.runCount}` : ''

      let compileBlock = composeBlock(compileMessage && `* ${compileMessage}`, compileStamp && `* ${compileStamp}`)

      if (compileBlock) {
        compileBlock = `### Compile Info\n${compileBlock}`.trim()
      }

      let executionBlock = composeBlock(runCount && `* ${runCount}`, executionTime && `* ${executionTime}`)

      if (executionBlock) {
        executionBlock = `### Execution Info\n${executionBlock}`.trim()
      }

      let lastRunBlock = ''
      if (stamp) {
        let lastRunDate = new Date(stamp.timestamp)
        lastRunBlock = `### Last Run
  - ${lastRunDate.toLocaleString()}
  - ${formatDistanceToNow(lastRunDate, { addSuffix: false })} ago
  `.trim()
      }

      let modifiedBlock = `### Last Modified 
- ${lastModified.toLocaleString()}      
- ${formatDistanceToNow(lastModified, { addSuffix: false })} ago`

      let info = md(
        `# Stats

#### ${flaggedFilePath}

${compileBlock}
  
${executionBlock}
  
${modifiedBlock}
  
${lastRunBlock}
  
`.trim()
      )
      return info
    }
  },
  [cmd]: {
    group: 'Debug',
    name: 'Debug Script',
    description: 'Open inspector. Pause on debugger statements.',
    shortcut: `${cmd}+enter`,
    flag: cmd
  },
  [modifiers.opt]: {
    group: 'Debug',
    name: 'Open Log Window',
    description: 'Open a log window for {{name}}',
    shortcut: 'alt+enter',
    flag: modifiers.opt
  },
  'push-script': {
    group: 'Git',
    name: 'Push to Git Repo',
    description: 'Push {{name}} to a git repo'
  },
  'pull-script': {
    group: 'Git',
    name: 'Pull from Git Repo',
    description: 'Pull {{name}} from a git repo'
  },

  'edit-doc': {
    group: 'Script Actions',
    name: 'Create/Edit Doc',
    shortcut: `${cmd}+.`,
    description: "Open {{name}}'s markdown in your editor"
  },
  'share-script-to-scriptkit': {
    group: 'Share',
    name: 'Share to ScriptKit.com',
    description: 'Share {{name}} to the community script library',
    shortcut: `${cmd}+s`
  },
  'share-script-as-discussion': {
    group: 'Share',
    name: 'Post to Community Scripts',
    description: 'Share {{name}} on GitHub Discussions',
    shortcut: `${cmd}+opt+s`
  },
  'share-script-as-link': {
    group: 'Share',
    name: 'Create Install URL',
    description: 'Create a link which will install the script',
    shortcut: `${cmd}+shift+s`
  },
  'share-script-as-kit-link': {
    group: 'Share',
    name: 'Share as private kit:// link',
    description: 'Create a private link which will install the script'
  },
  'share-script': {
    group: 'Share',
    name: 'Share as Gist',
    description: 'Share {{name}} as a gist'
  },
  'share-script-as-markdown': {
    group: 'Share',
    name: 'Share as Markdown',
    description: 'Copies script contents in fenced JS Markdown'
  },
  'share-copy': {
    group: 'Copy',
    name: 'Copy script contents to clipboard',
    description: 'Copy script contents to clipboard',
    shortcut: `${cmd}+c`
  },
  'copy-path': {
    group: 'Copy',
    name: 'Copy Path',
    description: 'Copy full path of script to clipboard'
  },
  'paste-as-markdown': {
    group: 'Copy',
    name: 'Paste as Markdown',
    description: 'Paste the contents of the script as Markdown',
    shortcut: `${cmd}+shift+p`
  },
  duplicate: {
    group: 'Script Actions',
    name: 'Duplicate',
    description: 'Duplicate {{name}}',
    shortcut: `${cmd}+d`
  },
  rename: {
    group: 'Script Actions',
    name: 'Rename',
    description: 'Rename {{name}}',
    shortcut: `${cmd}+shift+r`
  },
  remove: {
    group: 'Script Actions',
    name: 'Remove',
    description: 'Delete {{name}}',
    shortcut: `${cmd}+shift+backspace`
  },
  'remove-from-recent': {
    group: 'Script Actions',
    name: 'Remove from Recent',
    description: 'Remove {{name}} from the recent list'
  },
  'clear-recent': {
    group: 'Script Actions',
    name: 'Clear Recent',
    description: 'Clear the recent list of scripts'
  },
  // ["open-script-database"]: {
  //   group: "DB",
  //   name: "Open Database",
  //   description: "Open the db file for {{name}}",
  //   shortcut: `${cmd}+b`,
  // },
  // ["clear-script-database"]: {
  //   group: "DB",
  //   name: "Delete Database",
  //   description:
  //     "Delete the db file for {{name}}",
  // },
  'reveal-script': {
    group: 'Script Actions',
    name: 'Reveal',
    description: `Reveal {{name}} in ${isMac ? 'Finder' : 'Explorer'}`,
    shortcut: `${cmd}+shift+f`
  },
  'kenv-term': {
    group: 'Kenv',
    name: 'Open Script Kenv in a  Terminal',
    description: "Open {{name}}'s kenv in a terminal"
  },
  'kenv-trust': {
    group: 'Kenv',
    name: 'Trust Script Kenv',
    description: "Trust {{name}}'s kenv"
  },
  'kenv-view': {
    group: 'Kenv',
    name: 'View Script Kenv',
    description: "View {{name}}'s kenv"
  },
  'kenv-visit': {
    group: 'Kenv',
    name: 'Open Script Repo',
    description: "Visit {{name}}'s kenv in your browser"
  },
  // ["share"]: {
  //   name: "Share",
  //   description: "Share {{name}}",
  //   shortcut: `${cmd}+s`,
  //   bar: "right",
  // },
  // ["share-script"]: {
  //   name: "Share as Gist",
  //   description: "Share {{name}} as a gist",
  //   shortcut: `${cmd}+g`,
  // },
  // ["share-script-as-kit-link"]: {
  //   name: "Share as kit:// link",
  //   description:
  //     "Create a link which will install the script",
  //   shortcut: "option+s",
  // },
  // ["share-script-as-link"]: {
  //   name: "Share as URL",
  //   description:
  //     "Create a URL which will install the script",
  //   shortcut: `${cmd}+u`,
  // },
  // ["share-script-as-discussion"]: {
  //   name: "Share as GitHub Discussion",
  //   description:
  //     "Copies shareable info to clipboard and opens GitHub Discussions",
  // },
  // ["share-script-as-markdown"]: {
  //   name: "Share as Markdown",
  //   description:
  //     "Copies script contents in fenced JS Markdown",
  //   shortcut: `${cmd}+m`,
  // },
  'change-shortcut': {
    group: 'Script Actions',
    name: 'Change Shortcut',
    description: 'Prompts to pick a new shortcut for the script'
  },
  move: {
    group: 'Kenv',
    name: 'Move Script to Kenv',
    description: 'Move the script between Kit Environments'
  },
  'stream-deck': {
    group: 'Export',
    name: 'Prepare Script for Stream Deck',
    description: 'Create a .sh file around the script for Stream Decks'
  },
  'open-script-log': {
    group: 'Debug',
    name: 'Open Log File',
    description: 'Open the log file for {{name}}',
    shortcut: `${cmd}+l`
  },
  [modifiers.shift]: {
    group: 'Run',
    name: 'Run script w/ shift flag',
    shortcut: 'shift+enter',
    flag: 'shift'
  },
  [modifiers.ctrl]: {
    group: 'Run',
    name: 'Run script w/ ctrl flag',
    shortcut: 'ctrl+enter',
    flag: 'ctrl'
  },
  settings: {
    group: 'Settings',
    name: 'Settings',
    description: 'Open the settings menu',
    shortcut: `${cmd}+,`
  }
}

export function buildScriptConfig(message: string | PromptConfig): PromptConfig {
  let scriptsConfig = typeof message === 'string' ? { placeholder: message } : message
  scriptsConfig.scripts = true
  scriptsConfig.resize = false
  scriptsConfig.enter ||= 'Select'
  scriptsConfig.preventCollapse = true
  return scriptsConfig
}

async function getScriptResult(script: Script | string, message: string | PromptConfig): Promise<Script> {
  if (typeof script === 'string' && (typeof message === 'string' || message?.strict === true)) {
    return await getScriptFromString(script)
  }
  return script as Script //hmm...
}

export let getApps = async () => {
  let { choices } = await readJson(kitPath('db', 'apps.json')).catch((error) => ({
    choices: []
  }))

  if (choices.length === 0) {
    return []
  }

  let groupedApps = choices.map((c) => {
    c.group = 'Apps'
    return c
  })

  return groupedApps
}

export let splitEnvVarIntoArray = (envVar: string | undefined, fallback: string[]) => {
  return envVar
    ? envVar
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : fallback
}

let groupScripts = (scripts) => {
  let excludeGroups = global?.env?.KIT_EXCLUDE_KENVS?.split(',').map((k) => k.trim()) || []

  return groupChoices(scripts, {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: splitEnvVarIntoArray(process?.env?.KIT_MAIN_ORDER, ['Favorite', 'Main', 'Scriptlets', 'Kit']),

    endOrder: splitEnvVarIntoArray(process?.env?.KIT_MAIN_END_ORDER, ['Apps', 'Pass']),
    recentKey: 'timestamp',
    excludeGroups,
    recentLimit: getRecentLimit(),
    hideWithoutInput: splitEnvVarIntoArray(process?.env?.KIT_HIDE_WITHOUT_INPUT, []),
    tagger
  })
}

let processedScripts = []
export let getProcessedScripts = async (fromCache = true) => {
  if (fromCache && global.__kitScriptsFromCache && processedScripts.length) {
    return processedScripts
  }

  trace.begin({
    name: 'getScripts'
  })
  let scripts: Script[] = await getScripts(fromCache)
  trace.end({
    name: 'getScripts'
  })

  trace.begin({
    name: 'getTimestamps'
  })
  let timestampsDb = await getTimestamps()
  trace.end({
    name: 'getTimestamps'
  })

  global.__kitScriptsFromCache = true

  trace.begin({
    name: 'processedScripts = await Promise.all'
  })
  processedScripts = await processInBatches(scripts.map(processScript(timestampsDb.stamps)), 100)

  trace.end({
    name: 'processedScripts = await Promise.all'
  })

  return scripts
}

export let getGroupedScripts = async (fromCache = true) => {
  trace.begin({
    name: 'getProcessedScripts'
  })
  let processedscripts = await getProcessedScripts(fromCache)
  trace.end({
    name: 'getProcessedScripts'
  })

  let apps = (await getApps()).map((a) => {
    a.ignoreFlags = true
    return a
  })
  if (apps.length) {
    processedscripts = processedscripts.concat(apps)
  }

  let kitScripts = [
    // kitPath("cli", "new.js"),
    kitPath('cli', 'new-menu.js'),
    kitPath('cli', 'new-scriptlet.js'),
    kitPath('cli', 'new-snippet.js'),
    kitPath('cli', 'new-theme.js'),
    kitPath('cli', 'share.js'),
    kitPath('cli', 'find.js'),
    // kitPath('main', 'docs.js'),
    kitPath('main', 'kit.js'),
    kitPath('cli', 'processes.js'),
    kitPath('cli', 'kenv-manage.js'),
    kitPath('main', 'kit-windows.js'),
    kitPath('main', 'file-search.js')
    // kitPath("main", "google.js"),
  ]

  if (global?.env?.KIT_LOGIN) {
    kitScripts.push(kitPath('main', 'account-v2.js'))
  } else {
    kitScripts.push(kitPath('main', 'sign-in.js'))
  }

  if (global?.env?.KIT_PRO !== 'true') {
    kitScripts.push(kitPath('main', 'sponsor.js'))
  }

  kitScripts = kitScripts.concat([
    kitPath("main", "docs.js"),
    // kitPath("main", "api.js"),
    // kitPath("main", "guide.js"),
    // kitPath("main", "tips.js"),
    // kitPath("main", "suggest.js"),
    kitPath('main', 'datamuse.js'),
    kitPath('main', 'giphy.js'),
    kitPath('main', 'browse.js'),
    kitPath('main', 'app-launcher.js'),
    // kitPath("main", "account.js"),
    kitPath('main', 'dev.js'),
    // kitPath('main', 'hot.js'),
    kitPath('main', 'snippets.js'),
    kitPath('main', 'term.js'),
    kitPath('main', 'sticky.js'),
    kitPath('main', 'spell.js'),
    kitPath('main', 'define.js'),
    kitPath('main', 'rhyme.js'),
    kitPath('cli', 'manage-npm.js'),
    kitPath('main', 'clipboard-history.js'),
    kitPath('main', 'emoji.js'),

    kitPath('pro', 'theme-selector.js')
  ])

  if (isMac) {
    kitScripts.push(kitPath('main', 'system-commands.js'))
    kitScripts.push(kitPath('main', 'focus-window.js'))

    if (!Boolean(global?.env?.KIT_ACCESSIBILITY)) {
      kitScripts.push(kitPath('main', 'accessibility.js'))
    }
  }

  if (process.env.KIT_HIDE_KIT_SCRIPTS) {
    kitScripts = []
  }

  trace.begin({
    name: 'parsedKitScripts'
  })
  let parsedKitScripts = await processInBatches(
    kitScripts.map(async (scriptPath) => {
      let script = await parseScript(scriptPath)

      script.group = 'Kit'
      script.ignoreFlags = true
      script.preview = `<div></div>`

      processPreviewPath(script)

      return script
    }),
    5
  )

  trace.end({
    name: 'parsedKitScripts'
  })

  processedscripts = processedscripts.concat(parsedKitScripts)

  // let getHot = async () => {
  //   let hotPath = kitPath("data", "hot.json")
  //   if (await isFile(hotPath)) {
  //     return await readJson(hotPath)
  //   }

  //   return []
  // }

  // let loadHotChoices = async () => {
  //   try {
  //     let hot = await getHot()

  //     return hot.map(choice => {
  //       choice.preview = async () => {
  //         if (choice?.body) {
  //           return await highlight(choice?.body)
  //         }

  //         return ""
  //       }

  //       choice.group = "Community"
  //       choice.enter = "View Discussion"
  //       choice.lastGroup = true

  //       return choice
  //     })
  //   } catch (error) {
  //     return [error.message]
  //   }
  // }

  // let communityScripts = await loadHotChoices()

  // processedscripts = processedscripts.concat(
  //   communityScripts
  // )

  // let scraps = await parseScraps()
  // processedscripts = processedscripts.concat(scraps)

  trace.begin({
    name: 'groupScripts'
  })
  let groupedScripts = groupScripts(processedscripts)
  trace.end({
    name: 'groupScripts'
  })

  groupedScripts = groupedScripts.map((s) => {
    if (s.group === 'Pass') {
      s.ignoreFlags = true
    }

    return s
  })

  return groupedScripts
}

export let mainMenu = async (message: string | PromptConfig = 'Select a script'): Promise<Script | string> => {
  // if (global.trace) {
  //   global.trace.addBegin({
  //     name: "buildScriptConfig",
  //     tid: 0,
  //     args: `Build main menu`,
  //   })
  // }

  trace.begin({
    name: 'buildScriptConfig'
  })

  let scriptsConfig = buildScriptConfig(message)

  trace.end({
    name: 'buildScriptConfig'
  })

  scriptsConfig.keepPreview = true

  // We preload from an in-memory cache, then replace with the actual scripts
  global.__kitScriptsFromCache = false

  trace.begin({
    name: 'getGroupedScripts'
  })
  let groupedScripts = await getGroupedScripts()
  trace.end({
    name: 'getGroupedScripts'
  })

  process.send({
    channel: Channel.MAIN_MENU_READY,
    scripts: groupedScripts.length
  })
  let script = await global.arg(scriptsConfig, groupedScripts)
  return await getScriptResult(script, message)
}

export let selectScript = async (
  message: string | PromptConfig = 'Select a script',
  fromCache = true,
  xf = (x: Script[]) => x,
  ignoreKenvPattern = /^ignore$/
): Promise<Script> => {
  let scripts: Script[] = xf(await getScripts(fromCache, ignoreKenvPattern))
  let scriptsConfig = buildScriptConfig(message)

  if (process.env.KIT_CONTEXT === 'terminal') {
    let script = await global.arg(scriptsConfig, scripts)
    return await getScriptResult(script, message)
  }
  let groupedScripts = groupScripts(scripts)

  scriptsConfig.keepPreview = true

  let script = await global.arg(scriptsConfig, groupedScripts)
  return await getScriptResult(script, message)
}

export let processPreviewPath = (s: Script) => {
  if (s.previewPath) {
    s.preview = async () => {
      let previewPath = getPreviewPath(s)

      let preview = `<div></div>`

      if (await isFile(previewPath)) {
        preview = md(await readFile(previewPath, 'utf8'))
      }

      return preview
    }
  }
}

export let processScriptPreview =
  (script: Script, infoBlock = '') =>
    async () => {
      if ((script as Scriptlet)?.scriptlet) {
        return script.preview
      }
      let previewPath = getPreviewPath(script)
      let preview = ``

      if (await isFile(previewPath)) {
        preview = await processWithPreviewFile(script, previewPath, infoBlock)
      } else if (typeof script?.preview === 'string') {
        preview = await processWithStringPreview(script, infoBlock)
      } else {
        preview = await processWithNoPreview(script, infoBlock)
      }

      return preview
    }

// TODO: The logic around scripts + stats/timestamps is confusing. Clean it up.
export let processScript =
  (timestamps: Stamp[] = []) =>
    async (s: Script): Promise<Script> => {
      let stamp = timestamps.find((t) => t.filePath === s.filePath)

      let infoBlock = ``
      if (stamp) {
        s.compileStamp = stamp.compileStamp
        s.compileMessage = stamp.compileMessage
        s.timestamp = stamp.timestamp

        if (stamp.compileMessage && stamp.compileStamp) {
          infoBlock = `~~~
⚠️ Last compiled ${formatDistanceToNow(new Date(stamp.compileStamp), {
            addSuffix: false
          })} ago`
        }
      }
      if (!(s as Scriptlet)?.scriptlet) {
        s.preview = processScriptPreview(s, infoBlock) as () => Promise<string>
      }

      return s
    }

export let getPreviewPath = (s: Script): string => {
  if (s?.previewPath) {
    return path.normalize(s.previewPath.replace('~', home()).replace('$KIT', kitPath()))
  }
  return path.resolve(path.dirname(path.dirname(s.filePath)), 'docs', path.parse(s.filePath).name + '.md')
}

export let processWithPreviewFile = async (s: Script, previewPath: string, infoBlock: string): Promise<string> => {
  let processedPreview = ``
  try {
    let preview = await readFile(previewPath, 'utf8')
    let content = await highlightJavaScript(s.filePath, s.shebang)
    processedPreview = md(infoBlock + preview) + content
  } catch (error) {
    processedPreview = md(`Could not find doc file ${previewPath} for ${s.name}`)
    warn(`Could not find doc file ${previewPath} for ${s.name}`)
  }

  return processedPreview
}

export let processWithStringPreview = async (s: Script, infoBlock: string) => {
  let processedPreview = ``
  if (s?.preview === 'false') {
    processedPreview = `<div/>`
  } else {
    try {
      let content = await readFile(path.resolve(path.dirname(s.filePath), s?.preview as string), 'utf-8')
      processedPreview = infoBlock ? md(infoBlock) : `` + md(content)
    } catch (error) {
      processedPreview = `Error: ${error.message}`
    }
  }

  return processedPreview
}

export let processWithNoPreview = async (s: Script, infoBlock: string): Promise<string> => {
  let processedPreview = ``
  let preview = await readFile(s.filePath, 'utf8')

  if (preview.startsWith('/*') && preview.includes('*/')) {
    let index = preview.indexOf('*/')
    let content = preview.slice(2, index).trim()
    let markdown = md(infoBlock + content)
    let js = await highlightJavaScript(preview.slice(index + 2).trim())
    return markdown + js
  }

  let markdown = md(`# ${s.name}

~~~
${path.basename(s?.filePath)}
~~~

<div class="pb-2.5"></div>

${s?.description ? s.description : ''}
${s?.note ? `> ${s.note}` : ''}
`)

  let content = await highlightJavaScript(preview, s?.shebang || '')

  processedPreview = markdown + (infoBlock ? md(infoBlock) : `` + content)
  return processedPreview
}

global.selectScript = selectScript

export let selectKenv = async (
  config = {
    placeholder: 'Select a Kenv',
    enter: 'Select Kenv'
  } as PromptConfig,
  // ignorePattern ignores examples and sponsors
  ignorePattern = /^(examples|sponsors)$/
) => {
  let homeKenv = {
    name: 'main',
    description: `Your main kenv: ${kenvPath()}`,
    value: {
      name: 'main',
      dirPath: kenvPath()
    }
  }
  let selectedKenv: Kenv | string = homeKenv.value

  let kenvs = await getKenvs(ignorePattern)
  if (kenvs.length) {
    let kenvChoices = [
      homeKenv,
      ...kenvs.map((p) => {
        let name = path.basename(p)
        return {
          name,
          description: p,
          value: {
            name,
            dirPath: p
          }
        }
      })
    ]

    selectedKenv = await global.arg(config, kenvChoices)

    if (typeof selectedKenv === 'string') {
      return kenvChoices.find(
        (c) => c.value.name === selectedKenv || path.resolve(c.value.dirPath) === path.resolve(selectedKenv as string)
      ).value
    }
  }
  return selectedKenv as Kenv
}

global.selectKenv = selectKenv

global.highlight = highlight

global.setTab = async (tabName: string) => {
  let i = global.onTabs.findIndex(({ name }) => name === tabName)
  await global.sendWait(Channel.SET_TAB_INDEX, i)
  global.onTabs[i].fn()
}

global.execLog = (command: string, logger = global.log) => {
  let writeableStream = new Writable()
  writeableStream._write = (chunk, encoding, next) => {
    logger(chunk.toString().trim())
    next()
  }

  let child = exec(command, {
    all: true,
    shell: process?.env?.KIT_SHELL || (process.platform === 'win32' ? 'cmd.exe' : 'zsh')
  })

  child.all.pipe(writeableStream)

  return child
}

// global.projectPath = (...args) => {
//   throw new Error(
//     `Script not loaded. Can't use projectPath() until a script is imported`
//   )
// }

global.clearTabs = () => {
  global.send(Channel.CLEAR_TABS)
}

global.md = mdUtil

export let isAuthenticated = async () => {
  let envPath = kenvPath('.kenv')
  let envContents = await readFile(envPath, 'utf8')
  // check if the .env file has a GITHUB_SCRIPTKIT_TOKEN
  return envContents.match(/^GITHUB_SCRIPTKIT_TOKEN=.*/g)
}

export let setEnvVar = async (key: string, value: string) => {
  await global.cli('set-env-var', key, value)
}

export let getEnvVar = async (key: string, fallback = '') => {
  let kenvEnv = dotenv.parse(await readFile(kenvPath('.env'), 'utf8')) as kenvEnv
  return kenvEnv?.[key] || fallback
}

export let toggleEnvVar = async (key: keyof kenvEnv, defaultValue = 'true') => {
  let kenvEnv = dotenv.parse(await readFile(kenvPath('.env'), 'utf8')) as kenvEnv
  // Check if the environment variable `key` exists and if its value is equal to the `defaultState`
  // If it is, toggle the value between "true" and "false"
  // If it isn't, set it to the `defaultState`
  await setEnvVar(
    key,
    kenvEnv?.[key] === defaultValue
      ? defaultValue === 'true'
        ? 'false'
        : 'true' // Toggle the value
      : defaultValue // Set to defaultState if not already set
  )
}

//@ts-ignore
export let authenticate = async (): Promise<Octokit> => {
  // @ts-ignore
  let { Octokit } = await import('../share/auth-scriptkit.js')
  let octokit = new Octokit({
    request: {
      fetch: global.fetch
    },
    auth: {
      scopes: ['gist'],
      env: 'GITHUB_SCRIPTKIT_TOKEN'
    }
  })

  let user = await octokit.rest.users.getAuthenticated()

  let userJson = await getUserJson()
  await setUserJson({
    ...userJson,
    ...user.data
  })

  return octokit
}

export let deauthenticate = async () => {
  await setUserJson({})
  await replace({
    files: kenvPath('.env'),
    from: /GITHUB_SCRIPTKIT_TOKEN=.*/g,
    to: '',
    disableGlobs: true
  })
  process.env.GITHUB_SCRIPTKIT_TOKEN = env.GITHUB_SCRIPTKIT_TOKEN = ``

  await mainScript()
}

global.createGist = async (
  content: string,
  { fileName = 'file.txt', description = 'Gist Created in Script Kit', isPublic = false } = {}
) => {
  let octokit = await authenticate()
  let response = await octokit.rest.gists.create({
    description,
    public: isPublic,
    files: {
      [fileName]: {
        content
      }
    }
  })

  return response.data
}

global.browse = (url: string) => {
  return (global as any).open(url)
}

global.PROMPT = PROMPT

global.preload = (scriptPath?: string) => {
  if (process.send) {
    send(Channel.PRELOAD, scriptPath || global.kitScript)
  }
}

global.metadata = {}
global.headers = {}
