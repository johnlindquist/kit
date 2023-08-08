/*
# Find a Script

Search and select scripts by contents
*/

// Name: Find Script
// Description: Search the Contents of Scripts
// Keyword: f

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
    initialChoices: pleaseType,
    placeholder: "Search Scripts",
    debounceInput: 400,
    enter: "Run",
    onEscape: async () => {
      submit(``)
      await mainScript()
    },
    shortcuts: [
      escapeShortcut,
      {
        name: `Edit`,
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

      return filePaths.map(filePath => {
        return {
          name: path.basename(filePath),
          description: filePath.replace(home(), "~"),
          value: filePath,
          preview: async () => {
            return highlightJavaScript(filePath)
          },
        }
      })
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
