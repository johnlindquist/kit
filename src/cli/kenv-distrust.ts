// Name: Testing Extreme Caution

import { getTrustedKenvsKey } from "../core/utils.js"

let trustedKenvsKey = getTrustedKenvsKey()

let currentTrustedKenvs = process.env[trustedKenvsKey]
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

// Removes the kenv from the .env
let kenv = await arg(
  {
    placeholder: "Distrust which kenv",
  },
  trustedKenvs
)

if (typeof process?.env?.[trustedKenvsKey] === "string") {
  let newValue = process.env[trustedKenvsKey]
    .split(",")
    .filter(Boolean)
    .filter(k => k !== kenv)
    .join(",")

  await global.cli("set-env-var", trustedKenvsKey, newValue)
}

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
