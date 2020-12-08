#!/usr/bin/env js

let typeArg = args[0]

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

if (!typeArg) {
  ;({ type: typeArg } = await prompt({
    type: "list",
    name: "type",
    choices: Object.keys(typeMap),
  }))
}

let type = typeMap[typeArg]

let query = args[1]
if (!query) {
  ;({ query } = await prompt({
    type: "input",
    name: "query",
  }))
  nextTime("datamuse " + typeArg + " " + query)
}

query = query.replace(/ /g, "+")

let url = `https://api.datamuse.com/words?${type}=${query}&md=d`
if (typeArg == "suggest")
  url = `https://api.datamuse.com/sug?s=${query}&md=d`

let response = await get(url)

if (!args.alfred) {
  console.log(response.data)
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
