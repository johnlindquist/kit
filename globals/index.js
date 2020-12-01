process.argv.slice(2).forEach((arg, index) => {
  global["$" + String(index + 1)] = arg
})

global.fs = require("fs")
global.fetch = require("node-fetch")
global.axios = require("axios")
global.jq = require("node-jq")

JSON.log = async (object, selector = ".") => {
  let out = await jq.run(selector, object, {
    input: "json",
    output: "json",
  })

  console.log(out)
}
