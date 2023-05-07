import { getKenvs } from "../core/utils.js"

let kenvs = (await getKenvs()).map(value => ({
  name: path.basename(value),
  value,
}))

kenvs.unshift({
  name: "main",
  value: kenvPath(),
})

let dir = await arg("Open which kenv", kenvs)

cd(dir)

setDescription(`Kenv: ${path.basename(dir)}`)
await term({
  cwd: dir,
})

await getScripts(false)

await mainScript()

export {}
