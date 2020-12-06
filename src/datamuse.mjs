#!js

let typeMap = {
  describe: "rel_jjb",
  trigger: "rel_trg",
  follow: "lc",
  rhyme: "rel_rhy",
  spell: "sp",
  synonym: "ml",
  sounds: "rel_nry",
}

let type = typeMap[$1]

let query = $2.replace(/ /g, "+")

let response = await get(
  `https://api.datamuse.com/words?${type}=${query}&md=d`
)

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
