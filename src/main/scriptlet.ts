import { SHELL_TOOLS } from '../core/constants.js'
import { Channel } from '../core/enum.js'
import { slash } from '../core/resolvers.js'
import { formatScriptlet } from '../core/scriptlets.js'
import { parseShebang } from '../core/shebang.js'
import { kenvPath } from '../core/utils.js'
import type { Flags, Script, Scriptlet } from '../types'
import untildify from 'untildify'

const toolExtensionMap = new Map([
  ['ruby', 'rb'],
  ['python', 'py'],
  ['python3', 'py'],
  ['perl', 'pl'],
  ['php', 'php'],
  ['node', 'js'],
  ['bash', 'sh'],
  ['powershell', 'ps1'],
  ['lua', 'lua'],
  ['r', 'r'],
  ['groovy', 'groovy'],
  ['scala', 'scala'],
  ['swift', 'swift'],
  ['go', 'go'],
  ['rust', 'rs'],
  ['java', 'java'],
  ['clojure', 'clj'],
  ['elixir', 'ex'],
  ['erlang', 'erl'],
  ['ocaml', 'ml'],
  ['osascript', 'scpt'],
  ['deno', 'ts'],
  ['kotlin', 'kt'],
  ['julia', 'jl'],
  ['dart', 'dart'],
  ['haskell', 'hs'],
  ['csharp', 'cs']
])

const toolCommandMap = new Map([
  ['ruby', (scriptPath) => `ruby ${scriptPath}`],
  ['python', (scriptPath) => `python ${scriptPath}`],
  ['python3', (scriptPath) => `python3 ${scriptPath}`],
  ['perl', (scriptPath) => `perl ${scriptPath}`],
  ['php', (scriptPath) => `php ${scriptPath}`],
  ['node', (scriptPath) => `node ${scriptPath}`],
  ['bash', (scriptPath) => `bash ${scriptPath}`],
  ['zsh', (scriptPath) => `zsh ${scriptPath}`],
  ['fish', (scriptPath) => `fish ${scriptPath}`],
  ['sh', (scriptPath) => `sh ${scriptPath}`],
  ['cmd', (scriptPath) => `cmd /s /c ${scriptPath}`],
  ['powershell', (scriptPath) => `powershell -File ${scriptPath}`],
  ['pwsh', (scriptPath) => `pwsh -File ${scriptPath}`],
  ['lua', (scriptPath) => `lua ${scriptPath}`],
  ['r', (scriptPath) => `Rscript ${scriptPath}`],
  ['groovy', (scriptPath) => `groovy ${scriptPath}`],
  ['scala', (scriptPath) => `scala ${scriptPath}`],
  ['swift', (scriptPath) => `swift ${scriptPath}`],
  ['go', (scriptPath) => `go run ${scriptPath}`],
  ['rust', (scriptPath) => `rustc ${scriptPath} -o ${scriptPath}.exe && ${scriptPath}.exe`],
  ['java', (scriptPath) => `java ${scriptPath}`],
  ['clojure', (scriptPath) => `clojure ${scriptPath}`],
  ['elixir', (scriptPath) => `elixir ${scriptPath}`],
  ['erlang', (scriptPath) => `escript ${scriptPath}`],
  ['ocaml', (scriptPath) => `ocaml ${scriptPath}`],
  ['osascript', (scriptPath) => `osascript ${scriptPath}`],
  ['deno', (scriptPath) => `deno run ${scriptPath}`],
  ['kotlin', (scriptPath) => `kotlinc -script ${scriptPath}`],
  ['julia', (scriptPath) => `julia ${scriptPath}`],
  ['dart', (scriptPath) => `dart run ${scriptPath}`],
  ['haskell', (scriptPath) => `runhaskell ${scriptPath}`],
  ['csharp', (scriptPath) => `dotnet script ${scriptPath}`]
])

export let runScriptlet = async (focusedScriptlet: Scriptlet, inputs: string[], flag?: Flags) => {
  global.kitScript = focusedScriptlet?.filePath

  if (!focusedScriptlet.tool) {
    throw new Error(`No tool found for ${focusedScriptlet.value.name}`)
  }

  let { formattedScriptlet, remainingInputs } = formatScriptlet(focusedScriptlet, inputs, flag)

  formattedScriptlet = await replacePlaceholders(formattedScriptlet, focusedScriptlet, remainingInputs)

  if (process.env.KIT_CONTEXT === 'app') {
    send(Channel.STAMP_SCRIPT, focusedScriptlet as Script)
  }

  const formattedFocusedScriptlet = structuredClone(focusedScriptlet)
  formattedFocusedScriptlet.scriptlet = formattedScriptlet

  switch (formattedFocusedScriptlet.tool) {
    case '':
    case 'kit':
    case 'ts':
    case 'js': {
      return await handleJsTsKitScriptlet(formattedFocusedScriptlet, formattedScriptlet)
    }
    case 'transform': {
      return await handleTransformScriptlet(formattedFocusedScriptlet, formattedScriptlet)
    }
    case 'template': {
      await handleTemplateScriptlet(formattedScriptlet)
      break
    }
    case 'open':
    case 'edit':
    case 'paste':
    case 'submit':
    case 'type': {
      await handleActionScriptlet(formattedFocusedScriptlet, formattedScriptlet)
      break
    }
    default: {
      return await handleDefaultScriptlet(formattedFocusedScriptlet, formattedScriptlet)
    }
  }
}

// Replaces placeholders in the scriptlet with user inputs
async function replacePlaceholders(
  formattedScriptlet: string,
  focusedScriptlet: Scriptlet,
  remainingInputs: string[]
): Promise<string> {
  const unixPattern = /\$\{(\d+)\}|\$(\d+)/g
  const windowsPattern = /%(\d+)/g

  const matches = formattedScriptlet.match(unixPattern) || formattedScriptlet.match(windowsPattern)

  const matchesSet = new Set(matches || [])
  const needs = focusedScriptlet?.tool === 'template' ? remainingInputs : [...(matches || []), ...remainingInputs]

  for (let need of needs) {
    let result = await arg(need)
    if (matchesSet.has(need)) {
      // For matches (Unix/Windows patterns), replace directly
      formattedScriptlet = formattedScriptlet.replace(need, result)
    } else {
      // For inputs, wrap in curly braces before replacing
      formattedScriptlet = formattedScriptlet.replaceAll(`{{${need}}}`, result)
    }
  }
  return formattedScriptlet
}

// Handles scriptlets with "kit", "ts", or "js" tools
async function handleJsTsKitScriptlet(formattedFocusedScriptlet: Scriptlet, formattedScriptlet: string) {
  const quickPath = kenvPath('tmp', `scriptlet-${formattedFocusedScriptlet.command}.ts`)
  await writeFile(quickPath, formattedScriptlet)
  return await run(quickPath)
}

// Handles scriptlets with the "transform" tool
async function handleTransformScriptlet(formattedFocusedScriptlet: Scriptlet, formattedScriptlet: string) {
  const quickPath = kenvPath('tmp', `scriptlet-${formattedFocusedScriptlet.command}.ts`)
  const content = `let text = await getSelectedText()
let result = ${formattedScriptlet}
await setSelectedText(result)`
  await writeFile(quickPath, content)
  return await run(quickPath)
}

// Handles scriptlets with the "template" tool
async function handleTemplateScriptlet(formattedScriptlet: string) {
  const result = await template(formattedScriptlet, {
    shortcuts: [
      {
        name: 'Submit',
        key: `${cmd}+s`,
        bar: 'right',
        onPress: (input) => {
          submit(input)
        }
      }
    ]
  })
  await setSelectedText(result)
  process.exit(0)
}

// Handles scriptlets with "open", "edit", "paste", or "type" tools
async function handleActionScriptlet(formattedFocusedScriptlet: Scriptlet, formattedScriptlet: string) {
  await hide()
  if (formattedFocusedScriptlet.tool === 'open') {
    const untildifiedPath = untildify(formattedScriptlet)
    await open(untildifiedPath)
    await wait(1000)
  } else if (formattedFocusedScriptlet.tool === 'edit') {
    await edit(formattedScriptlet)
    await wait(1000)
  } else if (formattedFocusedScriptlet.tool === 'paste') {
    await setSelectedText(formattedScriptlet)
  } else if (formattedFocusedScriptlet.tool === 'type') {
    await keyboard.type(formattedScriptlet)
  } else if (formattedFocusedScriptlet.tool === 'submit') {
    await setSelectedText(formattedScriptlet)
    await keyboard.tap(Key.Enter)
  }
  process.exit(0)
}

// Handles scriptlets with other tools (e.g., "bash", "python", etc.)
async function handleDefaultScriptlet(formattedFocusedScriptlet: Scriptlet, formattedScriptlet: string) {
  const extension = toolExtensionMap.get(formattedFocusedScriptlet.tool) || formattedFocusedScriptlet.tool
  const scriptPath = kenvPath('tmp', `scriptlet-${formattedFocusedScriptlet.command}.${extension}`)
  await writeFile(scriptPath, formattedScriptlet)

  const commandGenerator = toolCommandMap.get(formattedFocusedScriptlet.tool)
  if (!commandGenerator) {
    throw new Error(`Unsupported tool: ${formattedFocusedScriptlet.tool}`)
  }

  let command = commandGenerator(scriptPath)

  if (formattedFocusedScriptlet.prepend) {
    command = `${formattedFocusedScriptlet.prepend} ${command}`
  }

  if (formattedFocusedScriptlet.append) {
    command = `${command} ${formattedFocusedScriptlet.append}`
  }

  const cwd = formattedFocusedScriptlet?.cwd ? slash(untildify(formattedFocusedScriptlet.cwd)) : undefined

  const useExec = SHELL_TOOLS.includes(formattedFocusedScriptlet.tool) && !formattedFocusedScriptlet.term

  if (process.env.KIT_CONTEXT === 'app') {
    if (!useExec) {
      return await term({ command, cwd })
    }

    if (formattedFocusedScriptlet.shebang) {
      const shebang = parseShebang(formattedFocusedScriptlet)
      return await sendWait(Channel.SHEBANG, shebang)
    }
  }

  return await exec(command, {
    shell: true,
    stdio: 'inherit',
    cwd,
    windowsHide: true
  })
}
