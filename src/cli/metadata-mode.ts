import { setEnvVar } from "../api/kit.js"
import { Env } from "../core/enum.js"

export const METADATA_MODE_ENV_KEY =
  "KIT_METADATA_MODE" as const

export async function getUserDefaultMetadataMode(
  forcePrompt: boolean = false
) {
  if (forcePrompt) {
    await setEnvVar(METADATA_MODE_ENV_KEY, Env.REMOVE)
  }

  const COMMENT_BASED_EXPLANATION = `you specify your metadata in comments at the top of the script.
<br>For example:<br>
~~~ts
// Name: My Script
// Description: A script that does something

import "@johnlindquist/kit"
~~~

This is the classic mode. You will not have any autocompletion, but may prefer it for its simplicity.
`.trim()

  // TODO: Differentiate the text based on the JS/TS default setting and use jsdoc annotation
  const CONVENTION_BASED_EXPLANATION = `you specify your metadata in the strongly-typed \`metadata\` variable.
<br>For example:<br>
~~~ts
import "@johnlindquist/kit"

metadata = {
  name: "My Script",
  description: "A script that does something",
}
~~~

You will have autocompletion and type safety.`

  const buildPreview = (mode: "comment" | "convention") => {
    if (!mode) {
      return undefined
    }
    const modeStr = `${mode}-based`
    return md(
      `There are two metadata modes: 
Comment-based and convention-based.<br><br>
Using the ${fmt.primary(modeStr)} approach, ${
      mode === "comment"
        ? COMMENT_BASED_EXPLANATION
        : CONVENTION_BASED_EXPLANATION
    }
`.trim()
    )
  }

  return (await env("KIT_METADATA_MODE", {
    placeholder: "Please choose",
    hint: "Choose your preferred metadata mode",
    choices: [
      {
        name: "Comment-based",
        value: "comment",
        preview: buildPreview("comment"),
      },
      {
        name: "Convention-based",
        value: "convention",
        preview: buildPreview("convention"),
      },
    ],
    strict: true,
  })) as "comment" | "convention"
}
