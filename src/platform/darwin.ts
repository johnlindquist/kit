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
  do script "${formattedScript}"
  activate
  end tell
  `

  return await global.applescript(command)
}

global.iterm = async command => {
  command = `"${command.replace(/"/g, '\\"')}"`
  let script = `
    tell application "iTerm"
        if application "iTerm" is running then
            try
                tell the first window to create tab with default profile
            on error
                create window with default profile
            end try
        end if
    
        delay 0.1
    
        tell the first window to tell current session to write text ${command}
        activate
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

global.selectKitEditor = async (reset = false) => {
  let globalBins = []
  let binPaths = KIT_DEFAULT_PATH.split(":")
  for await (let binPath of binPaths) {
    let bins = await readdir(binPath)
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

## Don't see your editor?

Set up your editor's command-line tools:

- [Visual Studio Code](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line)
- [WebStorm](https://www.jetbrains.com/help/webstorm/working-with-the-ide-features-from-command-line.html)
- [Sublime](https://www.sublimetext.com/docs/command_line.html)
- [Atom](https://flight-manual.atom.io/getting-started/sections/installing-atom/#installing-atom-on-mac)

## Customized your editor command?

If you edited your ~/.zshrc (or similar) for a custom command then sync your PATH to Script Kit's .env:

Run the following in your terminal:
~~~bash
~/.kit/bin/kit sync-path
~~~

## Still not working?

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
  let command = `atom "${file}"${dir ? ` "${dir}"` : ``}`
  exec(command, execConfig())
}

let code = async (file, dir, line = 0, col = 0) => {
  let codeArgs = ["--goto", `${file}:${line}:${col}`]
  if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
  let command = `code ${codeArgs.join(" ")}`

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
      let defs = await readdir(kitPath("types"))
      let content = ``
      for (let def of defs) {
        content += await readFile(
          kitPath("types", def),
          "utf8"
        )
      }

      let globalTypesDir = kitPath(
        "node_modules",
        "@johnlindquist",
        "globals",
        "types"
      )
      let globalTypeDirs = (
        await readdir(globalTypesDir)
      ).filter(dir => !dir.endsWith(".ts"))

      content += await readFile(
        path.resolve(globalTypesDir, "index.d.ts"),
        "utf8"
      )

      content = content.replace(
        /import {(.|\n)*?} from ".*?"/gim,
        ""
      )
      content = content.replace(/export {(.|\n)*?}/gim, "")

      //       content = `declare module '@johnlindquist/kit' {

      // ${content}

      // }`

      for (let typeDir of globalTypeDirs) {
        content += await readFile(
          path.resolve(
            globalTypesDir,
            typeDir,
            "index.d.ts"
          ),
          "utf8"
        )
      }

      extraLibs.push({
        content,
        filePath: `file:///node_modules/@johnlindquist/kit/index.d.ts`,
      })
    }

    let openMain = false
    let onEscape = async (input, state) => {
      openMain =
        state?.history[0]?.filePath === mainScriptPath
      submit(input || "")
    }
    let onAbandon = async (input, state) => {
      submit(input || "")
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
      let editCommand = `"${KIT_EDITOR}" ${file}`

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
