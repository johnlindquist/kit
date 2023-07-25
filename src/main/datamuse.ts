/*
# DataMuse API

Find Similar Words, Rhymes, Sounds Like, etc.
*/

// Name: Word
// Description: Find Word Alternatives
// Keyword: word

import { keywordInputTransformer } from "../core/utils.js"
let transformer = keywordInputTransformer(arg?.keyword)

let queryWords = (api, type) => async input => {
  input = transformer(input)
  if (!input || input?.length < 3) {
    return [
      {
        name: `Type at least 3 characters`,
        info: true,
      },
    ]
  }
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
      name: word,
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
      enter: "Paste",
      input,
    },
    queryWords(api, type)
  )

  if (word) setSelectedText(word.replace(/ /g, "+"))
}

let spell = async input => {
  await wordApi("sug", "s", input)
}

let syn = async input => {
  await wordApi("words", "ml", input)
}

let noun = async input => {
  await wordApi("words", "rel_jja", input)
}

let adj = async input => {
  await wordApi("words", "rel_jjb", input)
}

let sounds = async input => {
  await wordApi("words", "sl", input)
}

let rhyme = async input => {
  await wordApi("words", "rel_rhy", input)
}

let consonant = async input => {
  await wordApi("words", "rel_cns", input)
}

if (arg?.fn) {
  let fns = {
    spell,
    syn,
    noun,
    adj,
    sounds,
    rhyme,
    consonant,
  }

  await fns[arg.fn]("")
} else {
  onTab("Spell", spell)

  onTab("Synonym", syn)

  onTab("Nouns", noun)

  onTab("Adjectives", adj)

  onTab("Sounds Like", sounds)

  onTab("Rhyme", rhyme)

  onTab("Consonant", consonant)
}

export {}
