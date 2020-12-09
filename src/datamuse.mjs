#!/usr/bin/env js

let typeMap = {
  describe: "rel_jjb",
  trigger: "rel_trg",
  noun: "rel_jja",
  follow: "lc",
  rhyme: "rel_rhy",
  spell: "sp",
  synonym: "ml",
  sounds: "rel_nry",
  suggest: "suggest",
}

let word = await arg(0, "Type a word:")
let typeArg = await arg(
  1,
  "What would you like to find?",
  Object.keys(typeMap)
)

let type = typeMap[typeArg]
word = word.replace(/ /g, "+")

let url = `https://api.datamuse.com/words?${type}=${word}&md=d`
if (typeArg == "suggest")
  url = `https://api.datamuse.com/sug?s=${word}&md=d`

let response = await get(url)

if (!args.alfred) {
  console.log(response.data.map(result => result.word))
}

if (args.alfred) {
  let items = response.data.map(
    ({ word, score, tags, defs }) => {
      return {
        title: word,
        subtitle:
          defs
            ?.map(def => def.replace(/.*\t/, ""))
            .join("; ") || "",
        arg: word,
        variables: { word, score, tags, defs },
      }
    }
  )

  let out = {
    variables: {
      query,
    },
    items,
  }
  console.log(JSON.stringify(out))
}
