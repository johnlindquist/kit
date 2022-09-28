import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("API.md"),
  createGuideConfig({
    itemHeight: 48,
    input: arg?.input || "",
    placeholder: "Browse API",
    enter: `Suggest Edit`,
  })
)

// if selected docs is a url, then open it
if (selectedDoc.startsWith("http")) {
  open(selectedDoc)
} else {
  await run(kitPath("cli", selectedDoc))
  await mainScript("", "API")
}

export {}
