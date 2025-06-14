import "@johnlindquist/kit"

let result = await arg("What is your name?")

declare global {
  var core: any
}
core.setOutput("result", result)