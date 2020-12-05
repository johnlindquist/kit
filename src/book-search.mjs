#!js
/**
 * Searches for Book titles using Open Library
 *
 * Usage:
 * book-search "Mistborn"
 */

let response = await get(
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
console.log(Array.from(titles))
