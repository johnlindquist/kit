import { createGuideConfig } from "./main-helper.js"

await guide(
  kitPath("GUIDE.md"),
  createGuideConfig({
    itemHeight: 48,
  })
)

export {}
