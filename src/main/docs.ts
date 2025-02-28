// Name: Docs: API, Guide, Tips, Community, Announcements
// Description: Script Kit Docs
// Enter: Open Docs
// Keyword: docs
// Index: 0

delete arg?.pass
delete arg?.keyword
setInput("")

onTab("API", async (input = "") => {
  await main("api", "--input", input)
})

onTab("Scriptlets", async (input = "") => {
  await main("scriptlets", "--input", input)
})

onTab("Guide", async (input = "") => {
  await main("guide", "--input", input)
})

onTab("Tips", async (input = "") => {
  await main("tips", "--input", input)
})

onTab("Announcements", async (input = "") => {
  await main("announcements", "--input", input)
})
