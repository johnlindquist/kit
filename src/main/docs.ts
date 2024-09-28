// Name: Docs: API, Guide, Tips, Community, Announcements
// Description: Script Kit Docs
// Enter: Open Docs
// Keyword: docs
// Pass: true

delete arg?.pass
delete arg?.keyword
setInput("")

onTab("API", async (input = "") => {
  await main("api", "--input", input)
})

onTab("Guide", async (input = "") => {
  await main("guide", "--input", input)
})

onTab("Tips", async (input = "") => {
  await main("tips", "--input", input)
})

onTab("Community Scripts", async (input = "") => {
  await main("community", "--input", input)
})

onTab("Announcements", async (input = "") => {
  await main("announcements", "--input", input)
})
