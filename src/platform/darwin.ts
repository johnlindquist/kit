import {
  KIT_FIRST_PATH,
  KIT_DEFAULT_PATH,
  mainScriptPath,
  isInDir,
} from "../core/utils.js"

import { refreshScriptsDb } from "../core/db.js"

global.applescript = async (
  script,
  options = { silent: true }
) => {
  let applescriptPath = tmpPath("latest.scpt")
  await writeFile(applescriptPath, script)

  let p = new Promise<string>((res, rej) => {
    let stdout = ``
    let stderr = ``
    let child = spawn(
      `/usr/bin/osascript`,
      [applescriptPath],
      options
    )

    child.stdout.on("data", data => {
      stdout += data.toString().trim()
    })
    child.stderr.on("data", data => {
      stderr += data.toString().trim()
    })

    child.on("exit", () => {
      global.setLoading(false)
      res(stdout)
    })

    child.on("error", () => {
      rej(stderr)
    })
  })

  return p
}

global.terminal = async script => {
  let formattedScript = script.replace(/'|"/g, '\\"')

  let command = `tell application "Terminal"
  activate
  do script "${formattedScript}"
  end tell
  `

  return await global.applescript(command)
}

global.iterm = async command => {
  command = `"${command.replace(/"/g, '\\"')}"`
  let script = `
    tell application "iTerm"
        activate
        if application "iTerm" is running then
            try
                tell the first window to create tab with default profile
            on error
                create window with default profile
            end try
        end if
    
        delay 0.1
    
        tell the first window to tell current session to write text ${command}
        
    end tell
    `.trim()
  return await global.applescript(script)
}

let terminalEditor = editor => async file => {
  //TODO: Hyper? Other terminals?
  let supportedTerminalMap = {
    terminal: global.terminal,
    iterm: global.iterm,
  }

  let possibleTerminals = () =>
    Object.entries(supportedTerminalMap)
      .filter(async ([name, value]) => {
        return fileSearch(name, {
          onlyin: "/",
          kind: "application",
        })
      })
      .map(([name, value]) => ({ name, value: name }))

  let KIT_TERMINAL = await global.env("KIT_TERMINAL", {
    placeholder: `Which Terminal do you use with ${editor}?`,
    choices: possibleTerminals(),
  })

  return supportedTerminalMap[KIT_TERMINAL](
    `${editor} ${file}`
  )
}

let execConfig = () => {
  return {
    shell: true,
    env: {
      HOME: home(),
      PATH: KIT_FIRST_PATH,
    },
  }
}

let macEditors = [
  "atom",
  "code",
  "emacs",
  "nano",
  "ne",
  "nvim",
  "sublime",
  "webstorm",
  "vim",
]

let safeReaddir = async (path: string) => {
  try {
    return await readdir(path)
  } catch (e) {
    return []
  }
}

global.selectKitEditor = async (reset = false) => {
  let globalBins = []
  let binPaths = KIT_DEFAULT_PATH.split(":")
  for await (let binPath of binPaths) {
    let bins = await safeReaddir(binPath)
    for (let bin of bins) {
      let value = path.resolve(binPath, bin)
      globalBins.push({
        name: bin,
        description: value,
        value,
      })
    }
  }

  let possibleEditors = () => {
    let filteredMacEditors = macEditors
      .map(editor =>
        globalBins.find(({ name }) => name === editor)
      )
      .filter(Boolean)

    filteredMacEditors.unshift({
      name: "kit",
      description: "built-in Script Kit editor",
      value: "kit",
    })

    return filteredMacEditors
  }
  return await global.env("KIT_EDITOR", {
    reset,
    placeholder: "Which code editor do you use?",
    preview: md(`
> You can change your editor later in .env

### Don't see your editor?

Set up your editor's command-line tools:

- [Visual Studio Code](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line)
- [WebStorm](https://www.jetbrains.com/help/webstorm/working-with-the-ide-features-from-command-line.html)
- [Sublime](https://www.sublimetext.com/docs/command_line.html)
- [Atom](https://flight-manual.atom.io/getting-started/sections/installing-atom/#installing-atom-on-mac)

### Customized your editor command?

If you edited your ~/.zshrc (or similar) for a custom command then sync your PATH to Script Kit's .env:

Run the following in your terminal:
~~~bash
~/.kit/bin/kit sync-path
~~~

### Still not working?

Kit.app reads the \`KIT_EDITOR\` value from your \`~/.kenv/.env\`. It can either be a command on the PATH
or an absolute path to your editor. This prompt is attempting to set that value for you, but you can also do it manually.

If you need additional help, we're happy to answer questions:

- [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/q-a)
    `),
    choices: () => [
      ...possibleEditors(),
      {
        name: "None. Always copy path to clipboard",
        value: "copy",
      },
    ],
  })
}

let atom = async (file: string, dir: string) => {
  let command = `${global.env.KIT_EDITOR} '${file}' ${
    dir ? ` '${dir}'` : ``
  }`
  exec(command, execConfig())
}

let code = async (file, dir, line = 0, col = 0) => {
  let codeArgs = ["--goto", `'${file}:${line}:${col}'`]
  if (dir)
    codeArgs = [...codeArgs, "--folder-uri", `'${dir}'`]
  let command = `${global.env.KIT_EDITOR} ${codeArgs.join(
    " "
  )}`

  let config = execConfig()

  execaCommandSync(command, config)
}

let vim = terminalEditor("vim")
let nvim = terminalEditor("nvim")
let nano = terminalEditor("nano")
let fullySupportedEditors = {
  code,
  vim,
  nvim,
  nano,
  atom,
}

let addNodeLibs = async (
  extraLibs: { content: string; filePath: string }[]
) => {
  let nodeTypesDir = kitPath(
    "node_modules",
    "@types",
    "node"
  )
  let nodeDirents = await readdir(nodeTypesDir, {
    withFileTypes: true,
  })

  for await (let dirent of nodeDirents) {
    if (dirent.isDirectory()) {
      let { name } = dirent
      let subDirent = await readdir(
        path.resolve(nodeTypesDir, name),
        {
          withFileTypes: true,
        }
      )

      for await (let sub of subDirent) {
        if (sub.isFile() && sub.name.endsWith(".d.ts")) {
          let filePath = path.resolve(
            nodeTypesDir,
            name,
            sub.name
          )
          let content = await readFile(filePath, "utf8")
          extraLibs.push({
            content,
            filePath: `file:///${name}/${sub.name}`,
          })
        }
      }
    } else {
      let { name } = dirent
      if (name.endsWith("d.ts")) {
        let content = await readFile(
          kitPath("node_modules", "@types", "node", name),
          "utf8"
        )
        extraLibs.push({
          content,
          filePath: `file:///${name}`,
        })
      }
    }
  }
}

let addKitLibs = async (
  extraLibs: { content: string; filePath: string }[]
) => {
  let utilsContent = await readFile(
    kitPath("core", "utils.d.ts"),
    "utf8"
  )
  extraLibs.push({
    content: `declare module "@johnlindquist/kit" {
      ${utilsContent}
}`,
    filePath: `file:///node_modules/@types/@johnlindquist/kit/index.d.ts`,
  })

  let kitTypesDir = kitPath("types")
  let kitTypes = await readdir(kitTypesDir)

  for await (let t of kitTypes) {
    let content = await readFile(
      kitPath("types", t),
      "utf8"
    )

    extraLibs.push({
      content,
      filePath: `file:///${t}`,
    })
  }

  let globalTypesDir = kitPath(
    "node_modules",
    "@johnlindquist",
    "globals",
    "types"
  )

  let globalTypeDirs = (
    await readdir(globalTypesDir, { withFileTypes: true })
  ).filter(dir => dir.isDirectory())

  for await (let { name } of globalTypeDirs) {
    let content = await readFile(
      kitPath(
        "node_modules",
        "@johnlindquist",
        "globals",
        "types",
        name,
        "index.d.ts"
      ),
      "utf8"
    )

    // let filePath = `file:///node_modules/@johnlindquist/globals/${name}/index.d.ts`
    let filePath = `file:///node_modules/@johnlindquist/globals/${name}/index.d.ts`

    extraLibs.push({
      content,
      filePath,
    })
  }

  let lodashCommonDir = kitPath(
    "node_modules",
    "@johnlindquist",
    "globals",
    "types",
    "lodash",
    "common"
  )

  let lodashCommon = await readdir(lodashCommonDir)

  for await (let name of lodashCommon) {
    let content = await readFile(
      kitPath(
        "node_modules",
        "@johnlindquist",
        "globals",
        "types",
        "lodash",
        "common",
        name
      ),
      "utf8"
    )

    // let filePath = `file:///node_modules/@johnlindquist/globals/${lib}/index.d.ts`
    let filePath = `file:///node_modules/@johnlindquist/globals/lodash/common/${name}`

    extraLibs.push({
      content,
      filePath,
    })
  }

  // node_modules/@johnlindquist/globals/types/index.d.ts
  let globalsIndexContent = await readFile(
    kitPath(
      "node_modules",
      "@johnlindquist",
      "globals",
      "types",
      "index.d.ts"
    ),
    "utf8"
  )

  //   globalsIndexContent = `declare module "@johnlindquist/globals" {
  // ${globalsIndexContent}
  //   }`

  extraLibs.push({
    content: globalsIndexContent,
    filePath: `file:///node_modules/@johnlindquist/globals/index.d.ts`,
  })

  // let content = await readFile(
  //   kitPath("types", "kit-editor.d.ts"),
  //   "utf8"
  // )
  // extraLibs.push({
  //   content,
  //   filePath: `file:///kit.d.ts`,
  // })

  let shelljsContent = await readFile(
    kitPath(
      "node_modules",
      "@types",
      "shelljs",
      "index.d.ts"
    ),
    "utf8"
  )

  extraLibs.push({
    content: shelljsContent,
    filePath: `file:///node_modules/@types/shelljs/index.d.ts`,
  })

  // let reactContent = await readFile(
  //   kitPath(
  //     "node_modules",
  //     "@types",
  //     "react",
  //     "index.d.ts"
  //   ),
  //   "utf8"
  // )

  // extraLibs.push({
  //   content: reactContent,
  //   filePath: `react`,
  // })

  let nodeNotifierContent = await readFile(
    kitPath(
      "node_modules",
      "@types",
      "node-notifier",
      "index.d.ts"
    ),
    "utf8"
  )

  extraLibs.push({
    content: nodeNotifierContent,
    filePath: `file:///node_modules/@types/node-notifier/index.d.ts`,
  })

  let clipboardyContent = await readFile(
    kitPath("node_modules", "clipboardy", "index.d.ts"),
    "utf8"
  )

  extraLibs.push({
    content: clipboardyContent,
    filePath: `file:///node_modules/@types/clipboardy/index.d.ts`,
  })
}

global.edit = async (f, dir, line = 0, col = 0) => {
  let file = path.resolve(
    f?.startsWith("~") ? f.replace(/^~/, home()) : f
  )
  if (global.flag?.edit === false) return

  let KIT_EDITOR = await global.selectKitEditor(false)

  if (KIT_EDITOR === "kit") {
    setDescription(file)
    let language = global.extname(file).replace(/^\./, "")
    let contents = (await readFile(file, "utf8")) || ""
    let extraLibs = []
    if ((isInDir(kenvPath()), file)) {
      await addNodeLibs(extraLibs)
      await addKitLibs(extraLibs)
    }

    let openMain = false
    let onEscape = async (input, state) => {
      openMain =
        state?.history[0]?.filePath === mainScriptPath
      if (input) submit(input)
    }
    let onAbandon = async (input, state) => {
      if (input) submit(input)
    }

    contents = await editor({
      value: contents,
      language,
      extraLibs,
      onEscape,
      onAbandon,
    })

    await writeFile(file, contents)
    if (openMain) {
      await refreshScriptsDb()

      await mainScript()
    }
  } else {
    hide()

    let execEditor = (file: string) => {
      let editCommand = `"${KIT_EDITOR}" "${file}"`

      let config = execConfig()
      exec(editCommand, config)
    }
    let editorFn =
      fullySupportedEditors[path.basename(KIT_EDITOR)] ||
      execEditor
    global.log(
      `Opening ${file} with ${global.env.KIT_EDITOR}`
    )

    let result = await editorFn(file, dir, line, col)

    if (result?.stderr) {
      global.warn(`STDERR ${result.stderr}`)
      exit()
    }
  }
}

global.openLog = () => {
  let logPath = global.kitScript
    .replace("scripts", "logs")
    .replace(new RegExp(`\${kitMode()}$`), "log")

  console.log(`📂 Open log ${logPath}`)

  global.edit(logPath)
}

global.browse = async (path: string) => {
  return global.exec(`open ${path}`)
}
