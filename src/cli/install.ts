import {
  formatDistanceToNow,
  parseISO,
} from "@johnlindquist/kit-internal/date-fns"
import { KIT_FIRST_PATH } from "../core/utils.js"

let install = async packageNames => {
  let cwd = kenvPath()

  if (process.env.SCRIPTS_DIR) {
    cwd = kenvPath(process.env.SCRIPTS_DIR)
  }

  let isYarn = await isFile(kenvPath("yarn.lock"))
  let [tool, command] = (
    isYarn
      ? `yarn${global.isWin ? `.cmd` : ``} add`
      : `npm${global.isWin ? `.cmd` : ``} i`
  ).split(" ")

  if (
    global.isWin &&
    process.env.KIT_CONTEXT !== "workflow"
  ) {
    let contents = `## Installing ${packageNames.join(
      " "
    )}...\n\n`

    let progress = ``
    let divP = div(md(contents))
    let { stdout, stderr } = exec(
      `${tool} ${command} -D ${packageNames.join(
        " "
      )} --loglevel verbose`,
      {
        env: {
          ...global.env,
          PATH: KIT_FIRST_PATH,
        },
        cwd,
      }
    )
    let writable = new Writable({
      write(chunk, encoding, callback) {
        progress += chunk.toString()
        setDiv(md(contents + `~~~bash\n${progress}\n~~~`))
        callback()
      },
    })
    stdout.pipe(writable)
    stderr.pipe(writable)
    await divP
    return
  }

  return await term({
    command: `${tool} ${command} -D ${packageNames.join(
      " "
    )}`.trim(),
    enter: "",
    shortcuts: [
      {
        name: "Continue Script",
        key: `ctrl+c`,
        bar: "right",
      },
    ],
    env: {
      ...global.env,
      PATH: KIT_FIRST_PATH,
    },
    cwd,
  })
  // return await new Promise((res, rej) => {
  //   console.log(tool, command, ...packageNames)
  //   let PATH =
  //     KIT_NODE_PATH + path.delimiter + process.env.PATH
  //   let npm = spawn(
  //     tool,
  //     [command, "--quiet", ...packageNames],
  //     {
  //       stdio: "pipe",
  //       cwd: kenvPath(),
  //       env: {
  //         PATH,
  //       },
  //     }
  //   )

  //   npm.on("error", error => {
  //     console.log({ error })
  //     rej(error)
  //   })

  //   npm.on("exit", exit => {
  //     console.log(`Installed ${packageNames}`)
  //     res(exit)
  //   })
  // })
}

let packages = await arg(
  {
    placeholder:
      "Which npm package/s would you like to install?",
  },
  async input => {
    if (!input || input?.length < 3)
      return md(`## Type to search npm packages`)
    type pkgs = {
      objects: {
        package: {
          name: string
          description: string
          date: string
        }
      }[]
    }
    let response = await get<pkgs>(
      `http://registry.npmjs.com/-/v1/search?text=${input}&size=20`
    )
    let packages = response.data.objects
    return packages.map(o => {
      return {
        name: o.package.name,
        value: o.package.name,
        description: `${
          o.package.description
        } - ${formatDistanceToNow(
          parseISO(o.package.date)
        )} ago`,
      }
    })
  }
)

let installNames = [...packages.split(" ")]
global.setChoices([])
await install([...installNames, ...argOpts])

export { packages }
