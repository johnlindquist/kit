/*
# Find a Script

Search and select scripts by contents
*/

// Name: Find Script
// Description: Search the Contents of Scripts
// Pass: true
import "@johnlindquist/kit"
import {
  backToMainShortcut,
  cmd,
  getKenvs,
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
let filePath = await arg(
  {
    input: (flag?.pass as string) || "",
    placeholder: "Search Scripts",
    debounceInput: 400,
    enter: "Run",
    onEscape: async () => {
      submit(``)
      await mainScript()
    },
    shortcuts: [
      backToMainShortcut,
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
    try {
      if (!input || input?.length < 3) {
        setChoices([
          {
            info: true,
            miss: true,
            name: "Please type more than 2 characters",
          },
        ])
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
