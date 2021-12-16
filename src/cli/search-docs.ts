// Name: Search Docs
// Description: Type to Search Docs
// Log: false

let search = async input => {
  if (!input) return
  try {
    let { stdout } =
      await $`grep -ri --include='*.md' '^## .*${input}' ~/.kit/docs`

    let results = stdout.split("\n")
    let choices = Promise.all(
      results.filter(Boolean).map(async result => {
        let [filePath, ...found] = result.split(":")
        let preview = found.join(" ")
        // let { stdout: h1 } =
        //   await $`grep '^# .*' ${filePath}`

        return {
          name: preview.split(`## `)[1],
          value: filePath,
          description: filePath,
        }
      })
    )

    return choices
  } catch {
    return [`${input} not found`]
  }
}

while (true) {
  let doc = await arg(
    {
      placeholder: `Search docs:`,
    },
    search
  )
  let value = md(await readFile(doc, "utf-8"))

  await arg(
    {
      placeholder: `Hit "enter" to start a new search:`,
      className: "kit-docs",
    },
    value
  )
}

export {}
