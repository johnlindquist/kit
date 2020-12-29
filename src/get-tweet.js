//Description: Scrapes the contents of a specific tweet

let { page, browser } = await simplify("playwright")

await page.goto(await arg("Paste link to tweet:"))

await page.waitForSelector("article")

let result = await page.evaluate(() => {
  let tweetDiv = Array.from(
    document.querySelectorAll("article[role=article]")
  ).filter(
    el => el.firstChild.firstChild.firstChild.children[2]
  )[0].firstChild.firstChild.firstChild

  let nameDiv =
    tweetDiv.children[1].children[1].children[0].children[0]
      .children[0].children[0].children[0].children[0]

  let username = nameDiv.children[0].innerText
  let handle = nameDiv.children[1].innerText

  let image =
    tweetDiv.children[1].children[0].children[0].children[0]
      .children[0].children[0].children[1].children[0]
      .children[1].src
  image = image.replace("_bigger", "_400x400")

  let article = tweetDiv.children[2]

  let isReply = article.children[0].innerText.startsWith(
    "Replying to"
  )
    ? 1
    : 0

  let tweet = article.children[isReply].innerText
  let date = article.children[isReply + 2].innerText

  return {
    tweet,
    date,
    image,
    username,
    handle,
  }
})

await browser.close()

console.log(result)
