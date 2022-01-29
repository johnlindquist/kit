// Name: Search Scripts and Logs

import "@johnlindquist/kit"
import { getKenvs } from "../core/utils.js"
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
    searchExistingDirs.push(dir)
  }
}

let kenvsString = searchExistingDirs
  .map(d => `'${d}'`)
  .join(" ")

let filePath = await arg(
  {
    placeholder: "Search Scripts",
    debounceInput: 400,
  },
  async (input: string) => {
    let command = `grep -inR '${input}' ${kenvsString}`

    try {
      if (!input || input?.length < 3) {
        setChoices([])
        setPanel(
          md(`## Please type more than 2 characters:`)
        )
        return
      }

      let { stdout } = await exec(command)

      return stdout.split("\n").map(line => {
        let [file, num, ...match] = line
          .split(":")
          .filter(Boolean)
        let filePath = path.resolve(file)

        return {
          name: match.join(":").slice(0, 50),
          description:
            file.replace(home(), "~") + `:${num}`,
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
      
<code>${command}</code> failed`)
      )
    }
  }
)

await edit(filePath)
