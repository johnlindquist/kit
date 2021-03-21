// Menu: Main
// Description: Script Kit
// Shortcut: cmd ;

//Note: Feel free to edit this file!
let { menu, scripts, validate } = await cli("fns")

tab("Run", async () => {
  await cli("run")
})

tab("Edit", async () => {
  await cli("edit")
})

tab("New", async () => {
  await cli("new")
})

tab("Share", async () => {
  let script = await arg(
    {
      message: `Which script do you want to share?`,
    },
    menu
  )

  let how = await arg("How would you like to share?", [
    {
      name: "Copy script to clipboard",
      value: "share-copy",
    },
    {
      name: "Post as a gist",
      value: "share-script",
    },
    {
      name: "Create install link",
      value: "share-script-as-link",
    },
  ])

  console.log({ how, script })
  console.log({ args })

  await cli(how, script)
})

tab("Settings", async () => {})
