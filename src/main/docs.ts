// Name: Docs
// Description: Script Kit Docs
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
