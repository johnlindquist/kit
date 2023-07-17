// Name: Get Editor History

import "@johnlindquist/kit"

let history = await getEditorHistory()

await arg(
  {
    placeholder: "Editor history",
    onNoChoices: async input => {
      setPanel(
        md(`## No History Found
    
Open a file in the editor to add to the history.`)
      )
    },
  },
  history.map(({ content, timestamp }) => {
    return {
      name: content.slice(0, 15),
      description: timestamp
        ?.replace("T", "-")
        .replace(/:/g, "-")
        .split(".")[0],
      preview: async () => {
        let { default: highlight } =
          global.__kitHighlight ||
          (await import("highlight.js"))
        if (!global.__kitHighlight)
          global.__kitHighlight = { default: highlight }

        let result = highlight.highlightAuto(content).value

        return `<style>
        code{
            white-space: pre;
        }
        </style>
        <code>${result}</code>`
      },
    }
  })
)
