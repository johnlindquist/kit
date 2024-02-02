// Description: Creates a script from an entered url

import { highlightJavaScript } from "../api/kit.js"
import { exists, stripMetadata } from "../core/utils.js"
import { prependImport } from "./lib/utils.js"

let url = await arg({
  placeholder: "Enter script url:",
})

if (url.includes("gist.github.com")) {
  url = `${url}/raw `
}

let contents = (await get<any>(url)).data
if (!arg?.keepMetadata)
  contents = stripMetadata(contents, [
    "Menu",
    "Name",
    "Author",
    "Twitter",
    "Alias",
    "Description",
  ])

if (url.endsWith(".js")) {
  let nameFromUrl = url.split("/").pop().replace(".js", "")
  updateArgs([nameFromUrl])
}

let name = await arg({
  placeholder: "Enter a name for your script:",
  validate: exists,
  panel: await highlightJavaScript(contents),
})

let scriptPath = path.join(
  kenvPath("scripts"),
  name + ".js"
)

contents = prependImport(contents)
await writeFile(scriptPath, contents)

await cli("create-bin", "scripts", name)

await run(kitPath("cli", "edit-script.js"), scriptPath)

export {}
