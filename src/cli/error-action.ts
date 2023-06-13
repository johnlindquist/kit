// Name: Error
// Description: An error has occurred

import { cmd, extensionRegex } from "../core/utils.js"
import { ErrorAction } from "../core/enum.js"

let script = await arg()
let stackFile = await arg()
let errorFile = await arg()
let line = await arg()
let col = await arg()

let stack = await readFile(stackFile, "utf-8")

stack = stack.replace(/\?uuid.*/g, "")

// if errorFile a ".mjs" file, convert the path to the .ts file
if (errorFile.endsWith(".mjs")) {
  errorFile = errorFile
    .replace(".scripts", "scripts")
    .replace(/\.mjs$/, ".ts")
}

let errorMessage = stack.split("\n")[0]

// if errorMessage contains "_ is not defined"
// Tell user that lodash is no longer global, they need to import it
if (errorMessage.includes("_ is not defined")) {
  await div({
    enter: "Add Lodash to Script",
    html: md(`# ⚠️ Global Lodash is No Longer Supported

To save on Kit SDK filesize, Lodash is no longer global. 

Press enter to add \`import _ from "lodash"\` to the top of your script.

~~~js
import _ from "lodash"
~~~
`),
  })

  // insert import _ from "lodash" under the import "@johnlindquist/kit" line
  let contents = await readFile(errorFile, "utf-8")
  let lines = contents.split("\n")
  let kitImportLine = lines.findIndex(line =>
    line.match(/import.*['"]@johnlindquist\/kit['"]/)
  )
  lines.splice(
    kitImportLine + 1,
    0,
    `import _ from "lodash"`
  )
  await writeFile(errorFile, lines.join("\n"))

  await edit(errorFile, kenvPath(), line, col)
  exit()
}

// if errorMessage contains "Cannot find package"
if (errorMessage.includes("Cannot find package")) {
  let pkg = errorMessage.match(
    /(?<=Cannot find package ').*(?=' imported)/g
  )[0]

  await installMissingPackage(pkg)
  await wait(500)
  await writeFile(kitPath("run.txt"), errorFile)
} else {
  let errorLog = `${path
    .basename(errorFile)
    .replace(extensionRegex, "")}.log`

  let errorLogPath = kenvPath("logs", errorLog)

  let errorActions: {
    [key in ErrorAction]: () => Promise<void>
  } = {
    [ErrorAction.Open]: async () => {
      edit(errorFile, kenvPath(), line, col)
    },
    [ErrorAction.KitLog]: async () => {
      edit(kitPath("logs", "kit.log"), kenvPath())
    },
    [ErrorAction.Log]: async () => {
      edit(errorLogPath, kenvPath())
    },
    [ErrorAction.Ask]: async () => {
      copy(stack)
      exec(
        `open "https://github.com/johnlindquist/kit/discussions/categories/errors"`
      )
    },
    [ErrorAction.CopySyncPath]: async () => {
      await cli("sync-path-instructions")
    },
  }

  // console.log(stack)

  let hint = stack.split("\n")[0]
  let showCopyCommand = false
  if (hint?.includes("command not found")) {
    showCopyCommand = true
    hint = `${hint}.<br/><br/>
  Running "~/.kit/bin/kit sync-path" in the terminal may help find expected commands.`
  }

  let errorAction: ErrorAction = await arg(
    {
      placeholder: `🤕 Error in ${script}`,
      ignoreBlur: true,
      hint,
      onEscape: async () => {
        await mainScript()
      },
      shortcuts: [
        {
          name: "Close",
          key: `${cmd}+w`,
          onPress: async (input, state) => {
            exit()
          },
          bar: "right",
        },
        {
          name: "Edit Script",
          key: `${cmd}+o`,
          onPress: async (input, { focused }) => {
            await run(
              kitPath("cli", "edit-script.js"),
              errorFile
            )
          },
          bar: "right",
        },
      ],
      resize: false,
    },
    [
      ...(showCopyCommand
        ? [
            {
              name: "Copy 'sync-path' command to clipboard",
              value: ErrorAction.CopySyncPath,
            },
          ]
        : []),
      {
        name: `Open ${errorFile}`,
        value: ErrorAction.Open,
        enter: "Open Script",
        preview: async () => {
          let logFile = await readFile(
            errorLogPath,
            "utf-8"
          )

          return highlight(
            `## ${errorLog}\n\n    
~~~bash          
${logFile
  .split("\n")
  .map(line => line.replace(/[^\s]+?(?=\s\d)\s/, "["))
  .join("\n")}
~~~`,
            "",
            `.hljs.language-bash {font-size: .75rem; margin-top:0; padding-top:0}`
          )
        },
      },
      {
        name: `Open ${errorLog} in editor`,
        value: ErrorAction.Log,
        enter: "Open Log",
        preview: async () => {
          let logFile = await readFile(
            errorLogPath,
            "utf-8"
          )

          return highlight(
            `## ${errorLog}\n\n    
  ~~~bash          
  ${logFile
    .split("\n")
    .map(line => line.replace(/[^\s]+?(?=\s\d)\s/, "["))
    .reverse()
    .join("\n")}
  ~~~`,
            "",
            `.hljs.language-bash {font-size: .75rem; margin-top:0; padding-top:0}`
          )
        },
      },
      {
        name: `Open log kit.log in editor`,
        value: ErrorAction.KitLog,
        preview: async () => {
          let logFile = await readFile(
            kitPath("logs", "kit.log"),
            "utf-8"
          )

          return highlight(
            `## ${errorLog}\n\n    
  ~~~bash          
  ${logFile
    .split("\n")
    .map(line => line.replace(/[^\s]+?(?=\s\d)\s/, "["))
    .slice(-100)
    .reverse()
    .join("\n")}
  ~~~`,
            "",
            `.hljs.language-bash {font-size: .75rem; margin-top:0; padding-top:0}`
          )
        },
      },
      {
        name: `Ask for help on forum`,
        description: `Copy error to clipboard and open discussions in browser`,
        value: ErrorAction.Ask,
      },
    ]
  )

  await errorActions[errorAction]()
}

export {}
