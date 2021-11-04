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

export let addPreview = (
  choices: Choice[],
  docsDir: string,
  containerClasses = "p-5 leading-loose prose dark:prose-dark"
) => {
  return choices.map(c => {
    if (c?.preview) return c
    c.preview = async () => {
      let docsFilePath = path.resolve(
        kitDocsPath,
        "docs",
        docsDir,
        c.value + ".md"
      )
      let exists = await pathExists(docsFilePath)
      if (exists) {
        let helpFileContents = await readFile(
          docsFilePath,
          "utf-8"
        )
        return await highlight(
          helpFileContents,
          containerClasses
        )
      }
      return ""
    }
    return c
  })
}
