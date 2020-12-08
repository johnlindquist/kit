//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .mjs if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

assignPropsTo(require("shelljs"), global)
args = process.argv.slice(2)
//map named args to global args. e.g. --foo is mapped to args.foo
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
assignPropsTo(
  yargs(hideBin(process.argv)).help(false).argv,
  args
)

_ = require("lodash")
path = require("path")
inquirer = require("inquirer")
inquirer.registerPrompt(
  "search-list",
  require("inquirer-search-list")
)
prompt = inquirer.prompt
Separator = inquirer.Separator
chalk = require("chalk")

axios = require("axios")
get = axios.get
post = axios.post
put = axios.put
patch = axios.patch

const fsPromises = require("fs/promises")

readFile = fsPromises.readFile
writeFile = fsPromises.writeFile
readdir = fsPromises.readdir

const copyPaste = require("copy-paste")
copy = copyPaste.copy
paste = copyPaste.paste

env.TMP_DIR = require("os").tmpdir()

const symFilePath = process.argv[1]
const scriptName = /[^/]*$/.exec(symFilePath)[0]
const jsSrcPath = path.join(env.JS_PATH, "src")
const jsBinPath = path.join(env.JS_PATH, "bin")

info = message => {
  console.log(chalk.yellow(message))
}

const createSymFilePath = name => path.join(jsBinPath, name)

const createSourceFilePath = name =>
  path.join(jsSrcPath, name + ".mjs")

commandExists = command => {
  return exec(`type ${command}`, {
    silent: true,
  }).stdout.trim()
}

code = (file, dir, line = 0) => {
  if (!commandExists(env.EDITOR)) {
    console.log(
      chalk.red(`Couldn't find a configured editor`)
    )
    return
  }
  if (env.EDITOR == "code") {
    exec(
      `code --goto ${file}:${line} ${
        dir && `--folder-uri ${dir}`
      }`
    )
  }

  exec(env.EDITOR + " " + file)
}

applescript = script =>
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`)

say = string => {
  applescript(`say "${string}" speaking rate 250`)
}

notify = (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

preview = file => {
  exec(`qlmanage -p "${file}"`, { silent: true })
}

if (args.help) {
  console.log(
    `
Options:    
--edit opens the script in your editor: joke --edit
--cp duplicates the script: joke --cp dadjoke
--mv renames the script: joke --mv dadjoke
--rm removes the script: joke --rm
  `.trim()
  )
}

if (args.edit) {
  //usage: my-script --edit
  code(createSourceFilePath(scriptName), env.JS_PATH)
  exit()
}

renameScript = async (oldName, newName) => {
  const oldPath = createSourceFilePath(oldName)
  const oldSym = createSymFilePath(oldName)
  const newPath = createSourceFilePath(newName)
  const newSym = createSymFilePath(newName)
  rm(oldSym)
  mv(oldPath, newPath)
  ln("-s", newPath, newSym)
  exit()
}

if (args.mv) {
  //usage: my-script --mv renamed-script
  renameScript(scriptName, args.mv)
}

copyScript = async (source, target) => {
  //usage: my-script --cp new-script
  let result = exec(`type ${target}`, {
    silent: true,
  })
  if (result.stdout) {
    console.log(`${target} already exists. 
  ${result.stdout.trim()}
  Aborting...`)
    exit()
  }

  const newSrcFilePath = path.join(
    jsSrcPath,
    target + ".mjs"
  )

  const sourceFilePath = createSourceFilePath(source)
  cp(sourceFilePath, newSrcFilePath)
  ln("-s", newSrcFilePath, path.join(jsBinPath, target))
  code(newSrcFilePath, env.JS_PATH)
  exit()
}

if (args.cp) {
  copyScript(scriptName, args.cp)
}

removeScript = async name => {
  rm(createSymFilePath(name))
  rm(createSourceFilePath(name))
  info(`Removed script: ${name}`)
  exit()
}

if (args.rm) {
  removeScript(scriptName)
  //usage: my-script --rm
}

if (args.ln) {
  //usage: my-script.mjs --ln
  const filePath = symFilePath
  ln(
    "-s",
    filePath,
    path.join(jsBinPath, scriptName.slice(0, -4))
  )
  exit()
}

createScript = async name => {
  let result = exec(`type ${name}`, { silent: true })
  if (result.stdout) {
    console.log(`${name} already exists. 
${result.stdout.trim()}
Aborting...`)
    exit()
  }

  let template = `#!js

`
  if (!env.DISABLE_TEMPLATE_COMMENTS) {
    template = `#!js
//👋 The "shebang" line above is required for scripts to run

/*
 * Congratulations! 🎉 You made a \`${name}\` script! 🎈
 * You can now run this script with \`${name}\` in your terminal
 */

console.log(\`${env.USER} made a ${name} script!\`)

/*
 * First, let's accept an argument and log it out:
 */

// let user = await arg(0)

// console.log(user)

/*
 * Second, let's query the github api with our argument
 * Uncomment the following lines and run \`${name} ${env.USER}\` (assuming this is your github username)
*/

// let response = await get(\`https://api.github.com/users/\${user}\`)

// console.log(response.data)

/*
 * Finally, let's write the data to a file 
 * Uncomment the following lines and re-run the command
*/

// await writeFile(user + ".json", JSON.stringify(response.data))

/*
 * Congratulations! You're ready to explore the wonderful world of JavaScript Scripts.
 * You've probably noticed the helper functions (arg, get, and writeFile). 
 * Run \`js globals\` to explore all the helpers available.
*/

/*
 * Disable these comments in the future by running "js env" then adding the following link to the .env:
 * DISABLE_TEMPLATE_COMMENTS=true
 * 
 * Happy Scripting! 🤓 - John Lindquist
 */
    `.trim()
  }

  if (args.paste) {
    template = paste()
  }

  let symFilePath = createSymFilePath(name)
  let filePath = createSourceFilePath(name)

  await writeFile(filePath, template)
  chmod(755, filePath)

  ln("-s", filePath, symFilePath)

  code(filePath, env.JS_PATH, 3)
}

nextTime = command => {
  console.log(
    chalk.yellow.italic(`Next time try:`),
    chalk.green.bold(command)
  )
}

promptForArg = async message => {
  let input = await prompt({ name: "name", message })

  nextTime(scriptName + " " + input.name)

  return input.name
}

arg = async (index, message = "Input: ") => {
  return args[index] || (await promptForArg(message))
}

getScripts = async () => {
  return (
    await readdir(path.join(env.JS_PATH, "bin"), {
      encoding: "utf8",
      withFileTypes: true,
    })
  ).filter(file => file.isSymbolicLink())
}
