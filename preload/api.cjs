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
  appendFile: "fs/promises",
  createWriteStream: "fs",
  readdir: "fs/promises",
  compile: "handlebars",
  v4: "uuid",
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
uuid = () => v4()
chalk = (...args) => require("chalk")(...args)
paste = (...args) => require("clipboardy").read(...args)
copy = (...args) => require("clipboardy").write(...args)
db = (key, defaults) => {
  let low = require("lowdb")
  let FileSync = require("lowdb/adapters/FileSync")
  let _db = low(new FileSync(kenvPath("db", `${key}.json`)))

  _db._.mixin(require("lodash-id"))
  _db.defaults(defaults).write()

  return _db
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

rm = async (...rmArgs) => {
  echo(
    chalk`{yellow rm} doesn't exist. You're probably looking for {yellow trash}`
  )
  await trash(...rmArgs)
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

home = (...pathParts) => {
  let path = require("path")
  let os = require("os")
  return path.resolve(os.homedir(), ...pathParts)
}
isFile = async file => {
  return test("-f", file)
}

isDir = async dir => {
  return test("-d", dir)
}

isBin = async bin => {
  return Boolean(
    exec(`command -v ${bin}`, {
      silent: true,
    }).stdout
  )
}
