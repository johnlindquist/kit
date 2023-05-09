// Name: Testing Extreme Caution

import { highlightJavaScript } from "../api/kit.js"
import { getKenvs } from "../core/utils.js"

let trustedKenvKey = `KIT_${
  process.env?.USER ||
  process.env?.USERNAME ||
  "NO_USER_ENV_FOUND"
}_DANGEROUSLY_TRUST_KENVS`

let currentTrustedKenvs = process.env[trustedKenvKey]
  ?.split(",")
  .filter(Boolean)

let hasTrustedKenvs = currentTrustedKenvs?.length > 0

let trustedKenvs: any[] = [
  {
    info: "always",
    name: hasTrustedKenvs
      ? "Select a kenv to distrust"
      : "No trusted kenvs",
    description: hasTrustedKenvs
      ? `Prevent scripts from this kenv from running automatically`
      : `Use "Trust Kenv" to manually trust a kenv`,
  },
  ...currentTrustedKenvs,
]

let kenv = await arg(
  {
    placeholder: "Distrust which kenv",
  },
  trustedKenvs
)

if (typeof process?.env?.[trustedKenvKey] === "string") {
  let newValue = process.env[trustedKenvKey]
    .split(",")
    .filter(Boolean)
    .filter(k => k !== kenv)
    .join(",")

  await global.cli("set-env-var", trustedKenvKey, newValue)
}

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
