// Name: Spell
// Description: Lookup the spelling of a word
// Keyword: spell

import { keywordInputTransformer } from "../core/utils.js"

let macDictionaryInstalled = await isDir(
  kitPath(
    "node_modules",
    "@johnlindquist",
    "mac-dictionary"
  )
)

if (macDictionaryInstalled) {
  let { lookup } = await import(
    // @ts-ignore
    "@johnlindquist/mac-dictionary"
  )

  let beginTyping = [
    {
      name: `Begin typing to search for a word`,
      info: true,
    },
  ]
  let transformer = keywordInputTransformer(arg?.keyword)
  let word = await arg(
    {
      debounceInput: 0,
      placeholder: "Search for a word",
      enter: "Copy to Clipboard",
      shortcuts: [
        {
          name: "Paste",
          key: `${cmd}+enter`,
          onPress: async (input, state) => {
            await setSelectedText(state?.focused?.value)
            exit()
          },
          bar: "right",
        },
      ],
      initialChoices: beginTyping,
    },
    async input => {
      input = transformer(input)

      if (input) {
        try {
          let results = lookup(input)
          return results.map(r => {
            return {
              name: r.suggestion,
              description: r.definition,
              value: r.suggestion,
            }
          })
        } catch (error) {
          log(error)
          return []
        }
      }

      return beginTyping
    }
  )
  if (word) copy(word)
} else {
  await run(kitPath("main", "datamuse.js"), "--fn", "spell")
}

export {}
