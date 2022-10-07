import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("GUIDE.md"),
  createGuideConfig({
    name: "Guide",
    itemHeight: 48,
    input: arg?.input || "",
    placeholder: "Browse Guide",
    enter: `Suggest Edit`,
  })
)

// if selected docs is a url, then open it
if (selectedDoc.startsWith("http")) {
  open(selectedDoc)
} else {
  await run(kitPath("cli", selectedDoc))
  await mainScript("", "Guide")
}

export {}
