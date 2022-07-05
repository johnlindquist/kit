// Description: Add Local Kenv Repo

import { getLastSlashSeparated } from "../core/utils.js"
import os from "os"
import slugify from "slugify"
import { ChannelHandler } from "../types/core.js"

let createKenvPathFromName = async (name: string) => {
  let addKenvPath = ""
  if (name === "") return ""

  if (name.startsWith(path.sep)) {
    addKenvPath = name
  } else {
    if (name.startsWith("~")) {
      addKenvPath = path.resolve(
        os.homedir(),
        name.slice(2)
      )
    } else {
      addKenvPath = path.resolve(os.homedir(), name)
    }
  }

  return addKenvPath
}

let onPathChange: ChannelHandler = async (
  _,
  {
    focused = {
      name: "",
      value: "",
    },
  }
) => {
  let resolvedPath = path.resolve(focused?.value, "scripts")
  let exists = await isDir(resolvedPath)

  if (!exists) {
    setHint(`⚠️ No "scripts" dir in ${focused?.name}`)
  } else {
    setHint(`✅ found "scripts" dir in ${focused?.name}`)
  }
}

let existingKenvPath = await path({
  hint: "Select a directory containing a scripts folder",
  onInput: onPathChange,
  onChoiceFocus: onPathChange,
  onlyDirs: true,
})

// let existingKenvPath = await arg(
//   {
//     placeholder: "Path to kenv:",
//     validate: async input => {
//       let attemptPath = await createKenvPathFromName(input)
//       let exists = await isDir(
//         path.join(attemptPath, "scripts")
//       )
//       if (!exists) {
//         return `${attemptPath} doesn't look like a kenv dir...`
//       }

//       return true
//     },
//   },
//   async input => {
//     let attemptPath = await createKenvPathFromName(input)
//     let resolvedPath = path.resolve(attemptPath, "scripts")
//     let exists = await isDir(resolvedPath)

//     if (!input) {
//       setHint(`Type path to kenv`)
//     } else if (!exists) {
//       setHint(`⚠️ No "scripts" dir in ${input}`)
//     } else {
//       setHint(`✅ found "scripts" dir`)
//     }

//     return md(attemptPath)
//   }
// )

if (!existingKenvPath || !(await isDir(existingKenvPath))) {
  exit()
}

let base = path.basename(existingKenvPath)
let input = slugify(base, {
  lower: true,
  trim: true,
})

let kenvName = await arg(
  {
    placeholder: `Enter a kenv name`,
    input,
    hint: `Enter a name for ${base}`,
    validate: async input => {
      let exists = await isDir(kenvPath("kenvs", input))
      if (exists) {
        return `${input} already exists`
      }

      return true
    },
  },
  async input => {
    let exists = await isDir(kenvPath("kenvs", input))
    let out = ``
    if (!input) {
      out = `A kenv name is required`
    } else if (exists) {
      out = `A kenv named "${input}" already exists`
    } else {
      out = `
          <p>Submit to symlink</p>
          <p class="font-mono">${existingKenvPath}</p>
          <p>to</p>
          <p class="font-mono">${kenvPath(
            "kenvs",
            input
          )}</p>`
    }

    return md(out.trim())
  }
)

let kenvDir = kenvPath("kenvs", kenvName)

ln("-s", existingKenvPath, kenvDir)

await cli("create-all-bins-no-trash")

await mainScript()

export {}
