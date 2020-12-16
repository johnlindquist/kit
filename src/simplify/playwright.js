let { chromium } = await need("playwright")

let browser = await chromium.launch()
let context = await browser.newContext()
let page = await context.newPage()

let selectEval = ({ selector, props }) => {
  return Array.from(
    document.querySelectorAll(selector)
  ).map(el =>
    props.reduce(
      (acc, prop) => ({ ...acc, [prop]: el[prop] }),
      {}
    )
  )
}

export let select = async (url, selector, props) => {
  await page.goto("https://" + url)
  let results = await page.evaluate(selectEval, {
    selector,
    props,
  })
  await browser.close()
  return results
}
