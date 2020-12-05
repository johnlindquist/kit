#!js
let response = await axios.get(
  `http://openlibrary.org/search.json?q=${$1}`
)

let titles = await jq.run(
  "[.docs[].title]",
  response.data,
  {
    input: "json",
    output: "json",
  }
)

//filter duplicates
console.log([...new Set(Array.from(titles))])
