let { chromium } = await npm("playwright")

let selectEval = selector => {
  return Array.from(
    document.querySelectorAll(selector)
  ).map(el => el.innerText)
}

export let select = async (url, selector) => {
  let browser = await chromium.launch()
  let context = await browser.newContext()
  let page = await context.newPage()

  if (!url.startsWith("http")) url = "https://" + url
  await page.goto(url)
  let results = await page.evaluate(selectEval, selector)

  await browser.close()
  return results
}
