// Name: Window Manager
// Description: Position and resize windows

import "@johnlindquist/kit"
setName(``)

let activeApp = await getActiveAppInfo()
let activeScreen = await getActiveScreen()
let screens = await getScreens()

let rightScreen = screens
  .filter(
    screen => screen.workArea.x > activeScreen.workArea.x
  )
  .sort((a, b) =>
    a.workArea.x < b.workArea.x ? 1 : -1
  )?.[0]

let leftScreen = screens
  .filter(
    screen => screen.workArea.x < activeScreen.workArea.x
  )
  .sort((a, b) =>
    a.workArea.x > b.workArea.x ? 1 : -1
  )?.[0]

let downScreen = screens
  .filter(
    screen => screen.workArea.y > activeScreen.workArea.y
  )
  .sort((a, b) =>
    a.workArea.y < b.workArea.y ? 1 : -1
  )?.[0]

let upScreen = screens
  .filter(
    screen => screen.workArea.y < activeScreen.workArea.y
  )
  .sort((a, b) =>
    a.workArea.y > b.workArea.y ? 1 : -1
  )?.[0]

let choices = []

if (upScreen) {
  choices.push({
    name: "Up",
    description: `Screen id: ${upScreen.id}`,
    value: upScreen,
  })
}

if (downScreen) {
  choices.push({
    name: "Down",
    description: `Screen id: ${downScreen.id}`,
    value: downScreen,
  })
}

if (leftScreen) {
  choices.push({
    name: "Left",
    description: `Screen id: ${leftScreen.id}`,
    value: leftScreen,
  })
}

if (rightScreen) {
  choices.push({
    name: "Right",
    description: `Screen id: ${rightScreen.id}`,
    value: rightScreen,
  })
}

let activeWorkArea = activeScreen.workArea

choices.push({
  name: "Center",
  description: `Center on screen`,
  value: {
    workArea: {
      x: activeWorkArea.x + activeWorkArea.width / 6,
      y: activeWorkArea.y + activeWorkArea.height / 6,
      width: (activeWorkArea.width * 2) / 3,
      height: (activeWorkArea.height * 2) / 3,
    },
  },
})

let { workArea } = await arg<{
  workArea: {
    x: number
    y: number
    width: number
    height: number
  }
}>(`Move ${activeApp.localizedName}`, choices)

let { x, y, width, height } = workArea

hide()
await setActiveAppPosition({
  x,
  y,
})

await wait(500)

await setActiveAppSize({
  width,
  height,
})
