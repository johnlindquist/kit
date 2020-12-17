let { chromium } = await need("playwright")

let browser = await chromium.launch()
let context = await browser.newContext()
let page = await context.newPage()

let selectEval = selector => {
  return Array.from(
    document.querySelectorAll(selector)
  ).map(el => el.innerText)
}

export let select = async (url, selector) => {
  await page.goto("https://" + url)
  let results = await page.evaluate(selectEval, selector)

  await browser.close()
  return results
}
