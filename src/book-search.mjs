/**
 * Description: Searches for book titles using Open Library
 *
 * Usage:
 * book-search "Mistborn"
 */

let query = await arg("What do you want to search for?")

let response = await get(
  `http://openlibrary.org/search.json?q=${query}`
)

let titles = response.data.docs.map(doc => doc.title)
titles = _.uniq(titles)

console.log(titles)
