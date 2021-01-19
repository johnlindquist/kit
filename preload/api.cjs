globalApi = {
  cd: "shelljs",
  cp: "shelljs",
  chmod: "shelljs",
  echo: "shelljs",
  exec: "shelljs",
  exit: "shelljs",
  grep: "shelljs",
  ln: "shelljs",
  ls: "shelljs",
  mkdir: "shelljs",
  mv: "shelljs",
  sed: "shelljs",
  tempdir: "shelljs",
  test: "shelljs",
  which: "shelljs",
  spawn: "child_process",
  spawnSync: "child_process",
  fork: "child_process",
  get: "axios",
  put: "axios",
  post: "axios",
  patch: "axios",
  readFile: "fs/promises",
  writeFile: "fs/promises",
  createWriteStream: "fs",
  readdir: "fs/promises",
  compile: "handlebars",
}
;({ cwd, pid, stderr, stdin, stdout, uptime } = process)

Object.entries(globalApi).forEach(([key, value]) => {
  global[key] = (...args) => {
    return require(value)[key](...args)
  }
})

path = require("path")

_ = new Proxy(
  {},
  {
    get(o, p) {
      return require("lodash")[p]
    },
  }
)
chalk = (...args) => require("chalk")(...args)

paste = (...args) => require("clipboardy").read(...args)
copy = (...args) => require("clipboardy").write(...args)

rm = () => {
  echo(
    chalk`{yellow rm} doesn't exist. You're probably looking for {yellow trash}`
  )
}
trash = async (...trashArgs) => {
  trashArgs
    .flatMap(x => x)
    .forEach(trashArg => {
      echo(
        chalk`{yellow ${trashArg}} moved to {yellow trash}`
      )
    })
  return await require("trash")(...trashArgs)
}

send = (...args) => {
  if (process && process.send) {
    process.send(...args)
  } else {
    console.log(
      chalk`{yellow.bold No parent process found}. Logging instead:`
    )
    console.log(...args)
  }
}

wait = async time =>
  new Promise(res => setTimeout(res, time))

checkProcess = pid => {
  let { stdout, stderr } = exec(`kill -0 ` + pid)
  //if running, stdout has text. If not, stdout is an empty string
  return stdout
}

assignPropsTo = (source, target) => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}
