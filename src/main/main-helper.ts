import { cmd, kitMode } from "../core/utils.js"
import { PromptConfig } from "../types/core.js"
import { GuideSection } from "../types/kitapp.js"

export let createGuideConfig =
  (config: Partial<PromptConfig>) =>
  async (sections: GuideSection[]) => {
    let getCodeblocks = (name: string): string => {
      let fileMarkdown = sections.find(
        s => s.name === name
      ).raw
      let lexer = new marked.Lexer()
      let nodes = lexer.lex(fileMarkdown)
      // Grab all of the code blocks
      let codeBlocks = nodes
        .filter(node => node.type === "code")
        .map((node: any) => (node?.text ? node.text : ``))
        .join("\n\n")

      return codeBlocks
    }

    let shortcuts = [
      {
        name: `Try It!`,
        key: `${cmd}+n`,
        bar: "right",
        onPress: async (input, { focused }) => {
          let contents = getCodeblocks(focused?.name)
          // replace any non-alphanumeric characters in focused?.name with a dash
          let name = focused?.name.replace(
            /[^a-zA-Z0-9]/g,
            "-"
          )

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
// Description: Generated from ${focused?.name} docs
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
      {
        name: `Copy Examples`,
        key: `${cmd}+c`,
        bar: "right",
        onPress: async (input, { focused }) => {
          let codeBlocks = getCodeblocks(focused?.name)
          copy(codeBlocks)
          setName("Copied to Clipboard!")
        },
      },
      {
        name: `Scroll`,
        key: `${cmd}+down`,
        bar: "right",
        onPress: async (input, { focused }) => {},
      },
    ]

    return {
      ...config,
      shortcuts,
    } as PromptConfig
  }
