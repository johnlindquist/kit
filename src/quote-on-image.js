let { chromium } = await need("playwright")
await need("textfit")

let textfit = path.join(
  env.SIMPLE_PATH,
  "node_modules",
  "textfit",
  "textFit.js"
)

let author = await arg("Enter author:")
let quote = await arg("Enter the quote to overlay:")
let date = await arg("Enter the date:")
let image = await arg("Link to image:")
let font = await arg("Font name:")
let fileName = author.replaceAll("@", "") + ".png"
let fontName = font.replaceAll(" ", "+")

let makeTemplate = async quote =>
  `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=${fontName}&display=swap" rel="stylesheet">

<style>
body{
    margin: 0; 
    padding:0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    flex-direction: column;
}
.image{
  width: 100vh;
  height: 100vw;
  position: absolute;
  background-image: url("${image}");
  background-repeat: no-repeat;
  background-size: 100vw 100vh;
  filter: brightness(40%);
}

.resize{
    width: 80vw;
    height: 75vh;
    font-family: '${font}', sans-serif;
    color: #ffffff;
}


.author{
    width: 50vw;
    height: 10vh;
    font-family: '${font}', sans-serif;
    color: #ffffff;
}
.date{
    width: 50vw;
    height: 5vh;
    font-family: '${font}', sans-serif;
    color: #ffffff;
}
</style>

<div class="image"></div>
<div class="resize">${quote}</div>
<div class="author">${author}</div>
<div class="date">${date}</div>
<script src="${textfit}"></script>
<script>
setTimeout(()=> {
    textFit(document.querySelector('.resize'), {alignHoriz: true, alignVert: true, multiLine: true})
    textFit(document.querySelector('.author'), {alignHoriz: true, alignVert: true})
    textFit(document.querySelector('.date'), {alignHoriz: true, alignVert: true})
},500)

</script>
</body>
</html>
`.trim()

let i = 0

let browser = await chromium.launch({
  // headless: false,
})
let context = await browser.newContext()

let page = await context.newPage()
await page.setViewportSize({
  width: 540,
  height: 540,
})
let template = await makeTemplate(quote)
let htmlPath = path.join(
  env.SIMPLE_TMP_PATH,
  "template.html"
)

await writeFile(htmlPath, template)
await page.goto("file://" + htmlPath)
await wait(1000)
let screenshotPath = path.join(
  env.SIMPLE_PATH,
  "out",
  fileName
)
await page.screenshot({
  path: screenshotPath,

  // clip: {
  //   x: 20,
  //   y: 0,
  //   width: 520,
  //   height: 480,
  // },
})
edit(screenshotPath)

await browser.close()
