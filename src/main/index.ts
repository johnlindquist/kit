// Menu: Main
// Description: Script Kit
// Shortcut: cmd ;

//Note: Feel free to edit this file!

onTab("Run", async () => {
  await cli("run")
})
onTab("Edit", async () => {
  await main("edit")
})
onTab("Share", async () => {
  await main("share")
})
onTab("New", async () => {
  await main("new")
})
onTab("Other", async () => {
  await main("other")
})

export {}
