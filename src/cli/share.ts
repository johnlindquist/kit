// Name: Share Script
// Description: Open the Share Menu

import { CLI } from "../cli"
import { Script } from "../types"

let { filePath } = (await selectScript({
  placeholder: `Share which script?`,
  enter: "Open the Share Menu",
})) as Script

let how: keyof CLI = await arg(
  {
    placeholder: "Share",
    resize: true,
  },
  [
    {
      name: "Create Github Discussion",
      description:
        "Post script as gist and open Github discussion in browser",
      value: "share-script-as-discussion",
    },
    {
      name: "Copy",
      description: "Copy the script to the clipboard",
      value: "share-copy",
    },
    {
      name: "Copy as Markdown",
      description:
        "Copies script contents in fenced JS Markdown",
      value: "share-script-as-markdown",
    },
    {
      name: "Post as a gist",
      description: "Post the script as a gist",
      value: "share-script",
    },
    {
      name: "Create Install URL",
      description:
        "Create a link which will install the script",
      value: "share-script-as-link",
    },
    {
      name: "Share as kit:// link",
      description:
        "Create a link which will install the script",
      value: "share-script-as-kit-link",
    },
  ]
)

await cli(how, filePath)

export {}
