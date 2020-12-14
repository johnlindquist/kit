//Description: Scrape headlines from news.google.com then pick headline to read

let { chromium } = await need("playwright")

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
await page.goto("https://news.google.com")

const headlines = await page.evaluate(() =>
  Array.from(document.querySelectorAll("h3")).map(el => ({
    name: el.innerText,
    value: el.firstChild.href,
  }))
)

await browser.close()

let value = await prompt({
  name: "link",
  message: "What do you want to read?",
  choices: headlines,
  type: "search-list",
})

exec(`open ${value.link}`)
