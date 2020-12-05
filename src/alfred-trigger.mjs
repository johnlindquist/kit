#!js

let query = $1.replace(/ /g, "+")

let response = await get(
  `https://api.datamuse.com/words?rel_trg=${query}&md=d`
)

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
