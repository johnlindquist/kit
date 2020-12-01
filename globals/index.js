process.argv.slice(2).forEach((arg, index) => {
  global["$" + String(index + 1)] = arg
})

global.fs = require("fs")
global.fetch = require("node-fetch")
global.axios = require("axios")
global.jq = require("node-jq")
global.titleCase = require("title-case").titleCase
global.paramCase = require("param-case").paramCase
global.readFile = require("fs/promises").readFile
global.writeFile = require("fs/promises").writeFile
global.readdir = require("fs/promises").readdir
global.access = require("fs/promises").access
global.exec = require("child_process").exec

JSON.log = async (object, selector = ".") => {
  let out = await jq.run(selector, object, {
    input: "json",
    output: "json",
  })

  console.log(out)
}
