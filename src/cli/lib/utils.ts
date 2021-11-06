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

export let findDoc = async (dir, path: any) => {
  let docs = await readJson(kitPath("data", "docs.json"))
  let doc = docs?.find(d => {
    let token = `<meta path=\"${dir}/${
      path?.value || path
    }\">`

    return d?.content?.includes(token)
  })

  return doc
}

export let addPreview = async (
  choices: Choice[],
  dir: string,
  containerClasses = "p-5 leading-loose prose dark:prose-dark"
) => {
  let docs = await readJson(kitPath("data", "docs.json"))
  let dirDocs = docs.filter(d => {
    let token = `<meta path=\"${dir}`
    return d?.content?.includes(token)
  })

  let enhancedChoices = choices.map(c => {
    if (c?.preview) return c
    let docIndex = dirDocs?.findIndex(d => {
      let token = `<meta path=\"${dir}/${c.value}\">`

      return d?.content?.includes(token)
    })
    let doc = dirDocs[docIndex]
    dirDocs.splice(docIndex, 1)

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

  let remaningDocs = dirDocs.map(d => {
    return {
      name: d?.title,
      description: "Discuss topic",
      value: d?.discussion,
      preview: async () => {
        return await highlight(d?.content, containerClasses)
      },
    }
  })

  return [...enhancedChoices, ...remaningDocs]
}
