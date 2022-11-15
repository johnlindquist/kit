// Name: Word API
// Description: Find Word Alternatives

let queryWords = (api, type) => async input => {
  if (!input || input?.length < 3)
    return md(`## Type at least 3 characters`)

  let url = `https://api.datamuse.com/${api}?${type}=${input}&md=d`

  let response = await get<{ word: string; defs: any[] }[]>(
    url
  )
  let words = response.data.map(({ word, defs }) => {
    let description = ""
    if (defs) {
      let [type, meaning] = defs[0].split("\t")
      description = `(${type}): ${meaning}`
    }
    return {
      name: `${word}`,
      value: word,
      description,
      preview:
        api === "sug"
          ? async () => {
              let api = "words"
              let type = "ml"
              let url = `https://api.datamuse.com/${api}?${type}=${word}&md=d$max=1`
              let response = await get(url)
              if (response?.data?.[0]?.defs?.[0]) {
                let { defs } = response.data[0]
                return md(
                  defs
                    .map(def => {
                      let [type, meaning] = def.split("\t")
                      return `* (${type}): ${meaning}`
                    })
                    .join("\n")
                )
              }

              return ""
            }
          : "",
    }
  })

  return words.length ? words : [`No results for ${input}`]
}

let wordApi = async (api, type, input = "") => {
  let word = await arg(
    {
      placeholder: "Type a word:",
      input,
      onEscape: async () => {
        submit(false)
        await mainScript()
      },
    },
    queryWords(api, type)
  )

  if (word) setSelectedText(word.replace(/ /g, "+"))
}

onTab("Spell", async input => {
  await wordApi("sug", "s", input)
})

onTab("Synonym", async input => {
  await wordApi("words", "ml", input)
})

onTab("Nouns", async input => {
  await wordApi("words", "rel_jja", input)
})

onTab("Adjectives", async input => {
  await wordApi("words", "rel_jjb", input)
})

onTab("Sounds Like", async input => {
  await wordApi("words", "sl", input)
})

onTab("Rhyme", async input => {
  await wordApi("words", "rel_rhy", input)
})

onTab("Consonant", async input => {
  await wordApi("words", "rel_cns", input)
})
