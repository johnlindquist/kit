import { KIT_NODE_PATH } from "../core/utils.js"

let file = JSON.parse(
  await readFile(kenvPath("package.json"), {
    encoding: "utf8",
  })
)

let packages = (await arg(
  chalk`Which packages do you want to {red uninstall}`,
  [
    ...Object.keys(file?.dependencies || []),
    ...Object.keys(file?.devDependencies || []),
  ]
)) as string[]

//grab all the args you used `kit un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}
let PATH = KIT_NODE_PATH + path.delimiter + process.env.PATH
let uninstallPackage = spawn(
  kitPath("node", "bin", "npm"),
  [
    "uninstall",
    "--prefix",
    kenvPath(),
    ...packages,
    ...args,
  ],
  {
    stdio: "inherit",
    cwd: env.KENV,
    env: {
      PATH,
    },
  }
)

uninstallPackage.on("error", error => {
  console.log({ error })
})

uninstallPackage.on("exit", () => {
  console.log(`Uninstalled ${packages}`)
})

export { packages }
