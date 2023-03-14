import { KIT_FIRST_PATH } from "../core/utils.js"

let file = JSON.parse(
  await readFile(kenvPath("package.json"), {
    encoding: "utf8",
  })
)

let packages = (await arg(
  {
    placeholder: chalk`Which packages do you want to {red uninstall}`,
    enter: "Uninstall",
  },
  [
    ...Object.keys(file?.dependencies || []),
    ...Object.keys(file?.devDependencies || []),
  ].filter(k => !k.startsWith("@johnlindquist"))
)) as string[]

//grab all the args you used `kit un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}

let isYarn = await isFile(kenvPath("yarn.lock"))
let [tool, command] = (
  isYarn
    ? `yarn${global.isWin ? `.cmd` : ``} remove`
    : `npm${global.isWin ? `.cmd` : ``} un`
).split(" ")

let cwd = kenvPath()

if (process.env.SCRIPTS_DIR) {
  cwd = kenvPath(process.env.SCRIPTS_DIR)
}

let PATH = isWin ? "" : `PATH=${knodePath("bin")}:$PATH `

await term({
  command: `${PATH}${tool} ${command} ${packages.join(
    " "
  )}`.trim(),
  env: {
    ...global.env,
    PATH: KIT_FIRST_PATH,
  },
  cwd,
})

export {}
