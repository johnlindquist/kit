//Description: Scrape headlines from news.google.com then pick headline to read

let chromium
try {
  ;({ chromium } = await import("playwright"))
} catch {
  //experimenting with "autoinstall" and "re-run if missing"
  echo(
    `Automatically installing ${chalk.yellow(
      "playwright"
    )} and re-running.`
  )
  let child = spawn(`simple`, ["i", "playwright"], {
    stdio: "inherit",
  })
  await new Promise(res => child.on("exit", res))
  child = spawn(`read-news`, [], { stdio: "inherit" })
  await new Promise(res => child.on("exit", res))
  exit()
}

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
