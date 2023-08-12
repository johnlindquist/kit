/*
# Find a Script

Search and select scripts by contents
*/

// Name: Find Script
// Description: Search the Contents of Scripts
// Keyword: f
// Shortcut: cmd+f
// Pass: true

import "@johnlindquist/kit"
import {
  escapeShortcut,
  cmd,
  getKenvs,
  keywordInputTransformer,
} from "../core/utils.js"
import { highlightJavaScript } from "../api/kit.js"
let kenvs = await getKenvs()
let allKenvs = [kenvPath(), ...kenvs]
let searchDirs = [
  ...allKenvs.map(k => path.resolve(k, "scripts")),
  //   ...allKenvs.map(k => path.resolve(k, "logs")),
]
let searchExistingDirs = []
for await (let dir of searchDirs) {
  if (await isDir(dir)) {
    searchExistingDirs.push(dir + path.sep + "*")
  }
}

let pleaseType = [
  {
    info: true,
    miss: true,
    name: "Please type more than 2 characters",
  },
]

let inputTransformer = keywordInputTransformer(arg?.keyword)

let filePath = await arg(
  {
    input: (flag?.pass as string) || "",
    ...(!arg?.pass && { initialChoices: pleaseType }),
    placeholder: "Search Scripts",
    debounceInput: 400,
    enter: "Run",
    preventCollapse: true,

    onEscape: async () => {
      submit(``)
      await mainScript()
    },
    shortcuts: [
      escapeShortcut,
      {
        name: `Edit`,
        visible: true,
        key: `${cmd}+o`,
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "edit-script.js"),
            focused.value
          )
        },
        bar: "right",
      },
    ],
  },
  async input => {
    input = inputTransformer(input)
    try {
      if (!input || input?.length < 3) {
        setChoices(pleaseType)
        return
      }

      let filePaths = searchExistingDirs
        .flatMap(dir => {
          try {
            let { stdout } = grep("-il", input, dir)
            return stdout.split("\n")
          } catch (error) {
            return []
          }
        })
        .filter(Boolean)

      let results = filePaths.map(filePath => {
        return {
          name: path.basename(filePath),
          description: filePath.replace(home(), "~"),
          value: filePath,
          preview: async () => {
            return highlightJavaScript(filePath)
          },
        }
      })

      if (results.length === 0) {
        return [
          {
            info: true,
            name: `No Results for ${input}`,
          },
        ]
      } else {
        return results
      }
    } catch (error) {
      setChoices([])
      setPanel(
        md(`## No Results
      
<code>grep for ${input}</code> failed`)
      )
    }
  }
)
if (filePath) await run(filePath)
