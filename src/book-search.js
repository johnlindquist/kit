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

if (arg[1]) {
  echo(
    `FYI: Please use "quotes" like "${arg[0]} ${arg[1]}" when passing strings.
     I noticed 2 separate args, but I only search for the 1st. 
    `
  )
}
