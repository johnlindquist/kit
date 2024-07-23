import ava from "ava"
import "../../test-sdk/config.js"
import { pathToFileURL } from "node:url"

ava.serial("kit duplicate", async t => {
  let command = "browse-scriptkit"
  let duplicate = `${command}-duplicated`
  let scriptPath = kenvPath("scripts", `${duplicate}.js`)
  let binPath = kenvPath("bin", `${duplicate}`)

  await ensureDir(kenvPath("scripts"))
  await ensureDir(kenvPath("bin"))

  await exec(`kit duplicate ${command} ${duplicate} main --no-edit`, {
    env: {
      ...process.env,
      KIT_MODE: "js"
    }
  })

  let scripts = await readdir(kenvPath("scripts"))
  let bins = await readdir(kenvPath("bin"))

  

  t.log({
    scripts,
    bins,
    KENV: process.env.KENV,
    kenvPath: kenvPath(),
    scriptPath,
    binPath
  })

  if (process.platform === 'win32') {
    binPath += '.cmd';
  }
  
  let scriptCreated = await readFile(scriptPath, "utf8")
  let binCreated = await readFile(binPath, "utf8")

  t.log({scriptCreated, binCreated})

  t.truthy(scriptCreated, `Duplicated ${command} script`)
  t.truthy(binCreated, `Duplicated ${command} bin`)
})

ava.serial("kit duplicate a typescript file", async t => {
  let command = `browse-scriptkit-typescript`
  await exec(`kit new ${command} main --no-edit`, {
    env: {
      ...process.env,
      KIT_MODE: "ts"
    }
  })
  let duplicate = `${command}-duplicated`
  let scriptPath = kenvPath("scripts", `${duplicate}.ts`)
  let binPath = kenvPath("bin", `${duplicate}`)

  await exec(`kit duplicate ${command} ${duplicate} main --no-edit`, {
    env: {
      ...process.env,
      KIT_MODE: "ts"
    }
  })


  if(process.platform === 'win32') {
    binPath += '.cmd';
  }

  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)

  t.true(scriptCreated, `Duplicated ${command} script`)
  t.true(binCreated, `Duplicated ${command} bin`)
})
