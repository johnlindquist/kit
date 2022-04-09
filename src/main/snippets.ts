// Description: Snippets

setName(``)

let { items, write } = await db("snippets", [])

type Choice = {
  name: string
  description: string
}

let snippet = await arg<Choice | string>(
  {
    placeholder: "Select snippet",
    strict: false,
    onNoChoices: async input => {
      if (input === "")
        setPlaceholder("Create your first snippet")
      else setPlaceholder("Select Snippet")
      setPanel(
        md(`Create snippet for 
~~~bash
${input}
~~~
`)
      )
    },
  },
  items
)

let item = items.find(
  i => i.description === (snippet as Choice)?.description
)
if (item) {
  setSelectedText(item.description)
} else {
  let snippetName = await arg({
    placeholder: "Name snippet",
    hint: `Create a name for: ${snippet}`,
  })

  if (snippetName) {
    items.push({
      name: snippetName,
      description: snippet,
    })
    await write()
  }

  await run(kitPath("cli", "snippet-handler.js"))
}

export {}
