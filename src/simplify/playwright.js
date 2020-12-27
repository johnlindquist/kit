let { chromium } = await need("playwright")

export let browser = await chromium.launch()
export let context = await browser.newContext()
export let page = await context.newPage()

let selectEval = selector => {
  return Array.from(
    document.querySelectorAll(selector)
  ).map(el => el.innerText)
}

export let select = async (url, selector) => {
  if (!url.startsWith("http")) url = "https://" + url
  await page.goto(url)
  let results = await page.evaluate(selectEval, selector)

  await browser.close()
  return results
}
