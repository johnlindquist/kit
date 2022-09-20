import { cmd } from "../core/utils.js"
import { PromptConfig } from "../types/core.js"
import { GuideSection } from "../types/kitapp.js"

export let createGuideConfig =
  (config: Partial<PromptConfig>) =>
  async (sections: GuideSection[]) => {
    let getCodeblocks = (name: string) => {
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
          let codeBlocks = getCodeblocks(focused?.name)

          let c =
            Buffer.from(codeBlocks).toString("base64url")
          open(`kit://snippet?content=${c}`)
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
