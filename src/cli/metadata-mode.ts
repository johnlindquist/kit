import { getEnvVar, setEnvVar } from "../api/kit.js"
import { Env } from "../core/enum.js"

export const METADATA_MODE_ENV_KEY = "METADATA_MODE" as const

export async function getUserDefaultMetadataMode(forcePrompt: boolean = false) {
  if (forcePrompt) {
    await setEnvVar(METADATA_MODE_ENV_KEY, Env.REMOVE)
  }

  const tsOrJsCodeExample = await getEnvVar("KIT_MODE", "ts") === "ts" ? `
export const metadata: Metadata = {
  name: "My Script",
  description: "A script that does something",
}` : `
/** @type Metadata */
export const metadata = {
  name: "My Script",
  description: "A script that does something",
}
`


  const COMMENT_BASED_EXPLANATION = `you specify your metadata in comments at the top of the script.
<br>For example:<br>
~~~ts
// Name: My Script
// Description: A script that does something

import "@johnlindquist/kit"
~~~

This is the classic mode. You will not have any autocompletion, but it is a little less code to type and easier to 
write a parser for.
`

// TODO: Differentiate the text based on the JS/TS default setting and use jsdoc annotation
  const CONVENTION_BASED_EXPLANATION = `you specify your metadata in an export named \`metadata\`.
<br>For example:<br>
~~~ts
import "@johnlindquist/kit"
${tsOrJsCodeExample}
~~~

You will have autocompletion and type safety, but it is more difficult to write a parser for.`

  const buildPreview = (mode: 'comment' | 'convention') => {
    if (!mode) {
      return undefined
    }
    return md(
      `There are two metadata modes: 
  **Comment** based and **Convention** based.<br><br>
  Using the ${mode}-based approach, ${mode === "comment" ? COMMENT_BASED_EXPLANATION : CONVENTION_BASED_EXPLANATION}
  `)
  }

  return (await env("METADATA_MODE", {
    placeholder: "Please choose",
    hint: "Choose your preferred metadata mode",
    choices: [
      {
        name: 'Comment-based',
        value: 'comment',
        preview: buildPreview('comment')
      },
      {
        name: 'Convention-based',
        value: 'convention',
        preview: buildPreview('convention')
      }
    ],
    strict: true
  })) as 'comment' | 'convention'
}