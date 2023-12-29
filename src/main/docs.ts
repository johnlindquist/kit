// Name: Docs
// Description: Script Kit Docs
// Enter: Open Docs
// Keyword: docs
// Pass: true

delete arg?.pass
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
