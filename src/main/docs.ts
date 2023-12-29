// Name: Docs: API, Guide, Tips, Community, Announcements
// Description: Script Kit Docs
// Enter: Open Docs
// Keyword: docs
// Pass: true

delete arg?.pass
delete arg?.keyword
setInput("")

onTab("API", async () => {
  await main("api")
})

onTab("Guide", async () => {
  await main("guide")
})

onTab("Tips", async () => {
  await main("tips")
})

onTab("Community Scripts", async () => {
  await main("community")
})

onTab("Announcements", async () => {
  await main("announcements")
})
