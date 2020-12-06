#!js

let typeMap = {
  describe: "rel_jjb",
  trigger: "rel_trg",
  noun: "rel_jja",
  follow: "lc",
  rhyme: "rel_rhy",
  spell: "sp",
  synonym: "ml",
  sounds: "rel_nry",
}

let type = typeMap[$1]

let query = $2.replace(/ /g, "+")

let url = `https://api.datamuse.com/words?${type}=${query}&md=d`
if ($1 == "suggest")
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
