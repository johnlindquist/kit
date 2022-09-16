import { backToMainShortcut } from "../core/utils.js"

let apiMd = await readFile(kitPath("API.md"), "utf-8")

let apiChoices = apiMd
  .split(/\n##[^#]/g)
  .slice(1)
  .map(content => {
    let [title, ...body] = content.split("\n")
    return {
      name: title,
      preview: async () => highlight(body.join("\n")),
      value: title,
    }
  })

await arg(
  {
    placeholder: "Browse API",
    enter: "Discuss on Github",
    shortcuts: [backToMainShortcut],
  },
  apiChoices
)

open(`https://github.com/johnlindquist/kit/discussions`)
export {}
