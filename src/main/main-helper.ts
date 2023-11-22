// Exclude: true

import { cmd, kitMode } from "../core/utils.js"
import { PromptConfig, Shortcut } from "../types/core.js"
import { GuideSection } from "../types/kitapp.js"

export let createGuideConfig =
  (
    config: Partial<PromptConfig> & { guidePath?: string }
  ) =>
  async (sections: GuideSection[]) => {
    let getCodeblocks = (name: string): string => {
      let fileMarkdown = sections.find(
        s => s.name === name
      )?.raw
      if (!fileMarkdown) return ""
      let lexer = new marked.Lexer()
      let nodes = lexer.lex(fileMarkdown)
      // Grab all of the code blocks
      let codeBlocks = nodes
        .filter(node => node.type === "code")
        .map((node: any) => (node?.text ? node.text : ``))
        .join("\n\n")

      return codeBlocks
    }

    let shortcuts: Shortcut[] = [
      {
        name: `Playground`,
        key: `${cmd}+p`,
        bar: "right",
        visible: true,
        condition: focused => {
          let codeblocks = getCodeblocks(focused?.name)
          return codeblocks.trim().length > 0
        },

        onPress: async (input, { focused }) => {
          let contents = getCodeblocks(focused?.name)
          // replace any non-alphanumeric characters in focused?.name with a dash
          let name = focused?.name.replace(
            /[^a-zA-Z0-9]/g,
            "-"
          )

          // remove any emoji
          name = name.replace(/:.+?:/g, "")

          name = `playground-${name}`

          // comment out every line of contents that has text
          contents = contents
            .split("\n")
            .map(line => {
              if (line.trim().length > 0) {
                return `// ${line}`
              } else {
                return line
              }
            })
            .join("\n")

          contents = `// Name: ${name}
// Description: Generated from ${focused?.name} ${
            config?.guidePath
              ? path.basename(config.guidePath)
              : "docs"
          }${
            config?.guidePath
              ? `\n// Path: ${config.guidePath}`
              : ""
          }
                             
import "@johnlindquist/kit"

${contents}`

          let scriptPath = kenvPath(
            "scripts",
            `${name}.${kitMode()}`
          )

          await writeFile(scriptPath, contents)
          await cli("create-bin", "scripts", name)

          await run(
            kitPath("cli", "edit-script.js"),
            scriptPath
          )
        },
      },
      // {
      //   name: `Copy Examples`,
      //   key: `${cmd}+c`,
      //   bar: "right",
      //   condition: focused => {
      //     let codeblocks = getCodeblocks(focused?.name)
      //     return codeblocks.trim().length > 0
      //   },
      //   onPress: async (input, { focused }) => {
      //     let codeBlocks = getCodeblocks(focused?.name)
      //     copy(codeBlocks)
      //     setName("Copied to Clipboard!")
      //   },
      // },
      {
        name: `Scroll`,
        key: `${cmd}+down`,
        bar: "right",
        visible: true,
        onPress: async (input, { focused }) => {},
      },
    ]

    return {
      ...config,
      shortcuts,
    } as PromptConfig
  }

export let createTipsConfig =
  (
    config: Partial<PromptConfig> & { guidePath?: string }
  ) =>
  async (sections: GuideSection[]) => {
    let getCodeblocks =
      global.getCodeblocksFromSections(sections)

    return {
      ...config,
      shortcuts: [
        {
          name: "Copy Tip",
          key: `${cmd}+c`,
          bar: "right",
          visible: true,
          onPress: async (input, { focused }) => {
            let codeBlocks = getCodeblocks(focused?.name)
            await copy(codeBlocks)
            toast("Copied to Clipboard!")
          },
        },
      ],
      onSubmit: async (input, { focused }) => {
        let contents = getCodeblocks(focused?.name)

        if (arg?.keyword) {
          delete arg.keyword
        }
        arg.tip = contents
        await cli("new")
      },
    } as PromptConfig
  }
