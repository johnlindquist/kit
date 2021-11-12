import { Bin } from "../../core/enum"
import { kitDocsPath } from "../../core/utils.js"
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

  await ensureTemplate("default.js")
  await ensureTemplate("default.ts")
}

export let createBinFromScript = async (
  type: Bin,
  { command, filePath }: Script
) => {
  let template = jsh ? "stackblitz" : "terminal"

  let binTemplate = await readFile(
    kitPath("templates", "bin", template),
    "utf8"
  )

  let binTemplateCompiler = compile(binTemplate)
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type,
    ...global.env,
    TARGET_PATH: filePath,
  })

  let binDirPath = path.resolve(
    filePath,
    "..",
    "..",
    ...(jsh ? ["node_modules", ".bin"] : ["bin"])
  )
  let binFilePath = path.resolve(binDirPath, command)

  global.mkdir("-p", path.dirname(binFilePath))
  await global.writeFile(binFilePath, compiledBinTemplate)
  global.chmod(755, binFilePath)
}

export let findDoc = async (dir, file: any) => {
  let docs = await readJson(kitPath("data", "docs.json"))
  let doc = docs?.find(d => {
    return d.dir === dir && (file?.value || file) === d.file
  })

  return doc
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
}

export let addPreview = async (
  choices: Choice[],
  dir: string,
  containerClasses = "p-5 prose dark:prose-dark"
) => {
  let docs: Doc[] = await readJson(
    kitPath("data", "docs.json")
  )
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

    return c
  })

  let filteredDocs = dirDocs.filter(dirDoc => {
    return !choices.find(m => {
      // console.log({ file: dirDoc.file, value: m.value })
      return dirDoc.file === m.value
    })
  })
  // console.log(filteredDocs.map(f => f.title))
  let docOnlyChoices = filteredDocs.map(doc => {
    return {
      name: doc.title,
      value: doc.file,
      preview: async () => {
        return await highlight(
          doc.content,
          containerClasses
        )
      },
    }
  })

  return [...enhancedChoices, ...docOnlyChoices]
}

export const prependImport = contents => {
  let foundImport = contents.match(
    /import.*('|")@johnlindquist\/kit('|")/
  )

  if (!foundImport) {
    return `import "@johnlindquist/kit"
    
${contents}`
  }

  return contents
}
