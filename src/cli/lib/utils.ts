import path from "path"
import shelljs from "shelljs"
import {
  kitPath,
  knodePath,
  home,
} from "../../core/utils.js"
import { compile } from "@johnlindquist/globals"
import {
  ensureDir,
  readFile,
  writeFile,
} from "@johnlindquist/kit-internal/fs-extra"

import { Bin } from "../../core/enum"
import { Choice, Script } from "../../types/core"

export let jsh = process.env?.SHELL?.includes("jsh")

export let ensureTemplates = async () => {
  let templatesPath = (...parts: string[]): string =>
    kenvPath("templates", ...parts)
  let kitTemplatesPath = (...parts: string[]): string =>
    kitPath("templates", "scripts", ...parts)

  await ensureDir(templatesPath())

  let ensureTemplate = async (templateName: string) => {
    let templatePath = templatesPath(templateName)
    if (!(await pathExists(templatePath))) {
      await copyFile(
        kitTemplatesPath(templateName),
        templatePath
      )
    }
  }

  let templates = await readdir(kitTemplatesPath())
  for await (let template of templates) {
    await ensureTemplate(template)
  }
}

export let createBinFromScript = async (
  type: Bin,
  { command, filePath }: Script
) => {
  let template = jsh ? "stackblitz" : "terminal"

  let useCmd =
    process.platform === "win32" && !process.env?.KIT_WSL

  if (useCmd) {
    template = "cmd"
  }

  let binTemplate = await readFile(
    kitPath("templates", "bin", template),
    "utf8"
  )

  let binTemplateCompiler = compile(binTemplate)
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type,
    ...global.env,
    KNODE: knodePath().trim() || home(".knode"),
    KIT: kitPath().trim() || home(".kit"),
    TARGET_PATH: filePath,
  })

  let binDirPath = path.resolve(
    filePath,
    "..",
    "..",
    ...(jsh ? ["node_modules", ".bin"] : ["bin"])
  )
  let binFilePath = path.resolve(binDirPath, command)

  // if windows, add .cmd extension
  if (useCmd) {
    binFilePath += ".cmd"
  }

  await ensureDir(path.dirname(binFilePath))
  await writeFile(binFilePath, compiledBinTemplate)
  shelljs.chmod(755, binFilePath)
}

interface Doc {
  avatar?: string
  twitter?: string
  author?: string
  discussion: string
  url: string
  title: string
  command: string
  content: string
  extension: string
  dir: string
  file: string
  description?: string
  tag: string
}

export let getDocs = async (): Promise<Doc[]> => {
  let docsPath = kitPath("data", "docs.json")
  if (await isFile(docsPath)) {
    return await readJson(docsPath)
  }

  return []
}

export let findDoc = async (dir, file: any) => {
  let docs = await getDocs()
  let doc = docs?.find(d => {
    return d.dir === dir && (file?.value || file) === d.file
  })

  return doc
}

export let addPreview = async (
  choices: Choice[],
  dir: string,
  onlyMatches = false
) => {
  let containerClasses =
    "p-5 prose dark:prose-dark prose-sm"
  let docs: Doc[] = await getDocs()
  let dirDocs = docs.filter(d => {
    return d?.dir === dir
  })

  // let matchChoiceToDoc = choices.map((choice, i) => {
  //   if (choice?.preview) {
  //     return {
  //       choiceIndex: i,
  //       docIndex: -1,
  //       value: choice.value,
  //     }
  //   }

  //   let docIndex = dirDocs?.findIndex(d => {
  //     return d?.file == choice?.value
  //   })

  //   return {
  //     choiceIndex: i,
  //     docIndex,
  //     value: choice.value,
  //   }
  // })

  let enhancedChoices = choices.map(c => {
    if (c?.preview) return c

    let docIndex = dirDocs?.findIndex(d => {
      return d?.file == c?.value
    })

    let doc = dirDocs[docIndex]

    if (doc?.content) {
      c.preview = async () => {
        return await highlight(
          doc.content,
          containerClasses
        )
      }
    }

    if (doc?.description) {
      c.description = doc.description
    }

    c.enter = (doc as any)?.enter || "Select"

    return c
  })

  let filteredDocs = dirDocs.filter(dirDoc => {
    return !choices.find(m => {
      // console.log({ file: dirDoc.file, value: m.value })
      return dirDoc.file === m.value
    })
  })
  // console.log(filteredDocs.map(f => f.title))
  let docOnlyChoices = onlyMatches
    ? []
    : filteredDocs
        .map(doc => {
          return {
            name: doc.title,
            description: doc?.description || "",
            tag: doc?.tag || "",
            value: doc.file,
            preview: async () => {
              return await highlight(
                doc.content,
                containerClasses
              )
            },
            enter: "Discuss Topic",
          }
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1))

  return [...enhancedChoices, ...docOnlyChoices]
}

export let prependImport = (
  contents: string,
  { force = false }: { force?: boolean } = {}
) => {
  let insert = true
  
  if (force) {
    contents = contents.replaceAll(
      /^import\s+['"]@johnlindquist\/kit['"]\s*\n?/gm, ''
    )
  } else {
    let foundImport = contents.match(
      /import\s+['"]@johnlindquist\/kit['"]/
    )
    if (foundImport) {
      insert = false
    }
  }

  if (insert) {
    return `import "@johnlindquist/kit"
    
${contents}`
  }

  return contents
}

export let runUserHandlerIfExists = async (
  mainScript: string,
  ...args: string[]
) => {
  let handlerPathJS = kenvPath(
    "scripts",
    `${global.kitCommand}.js`
  )
  let handlerPathTS = kenvPath(
    "scripts",
    `${global.kitCommand}.ts`
  )

  let isHandlerJS = await isFile(handlerPathJS)
  let isHandlerTS = await isFile(handlerPathTS)
  if (isHandlerJS) {
    await run(handlerPathJS)
  } else if (isHandlerTS) {
    await run(handlerPathTS)
  } else {
    await run(kitPath("main", mainScript + ".js"), ...args)
  }
}
