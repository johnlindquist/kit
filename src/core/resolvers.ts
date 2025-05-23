import { homedir } from "node:os"
import * as path from "node:path"

const windowsSlashRE = /\\/g
export function slash(p: string): string {
  return p.replace(windowsSlashRE, "/")
}

export let createPathResolver =
  (parentDir: string) =>
    (...parts: string[]) => {
      return path.resolve(parentDir, ...parts)
    }

export let home = (...pathParts: string[]) => {
  return createPathResolver(homedir())(...pathParts)
}

const getEnvOrDefault = (
  envVar: string | undefined,
  defaultValue: string
): string => {
  return envVar && envVar !== "undefined"
    ? envVar
    : defaultValue
}

export let kitPath = (...parts: string[]) =>
  createPathResolver(
    getEnvOrDefault(process.env.KIT, home(".kit"))
  )(...parts.filter(Boolean))

export let kenvPath = (...parts: string[]) => {
  // Check for global mock first (used in tests)
  if (global.__kenvPathMock && typeof global.__kenvPathMock === 'function') {
    return global.__kenvPathMock(...parts)
  }

  return createPathResolver(
    getEnvOrDefault(process.env.KENV, home(".kenv"))
  )(...parts.filter(Boolean))
}

export let kitPnpmPath = (...parts: string[]) => {
  return createPathResolver(
    getEnvOrDefault(process.env.KIT_PNPM_PATH, kitPath())
  )(...parts.filter(Boolean))
}

export let kitDotEnvPath = () => {
  // Check for global mock first (used in tests)
  if (global.__kitDotEnvPathMock && typeof global.__kitDotEnvPathMock === 'function') {
    return global.__kitDotEnvPathMock()
  }

  return createPathResolver(
    getEnvOrDefault(
      process.env.KIT_DOTENV_PATH,
      kenvPath(".env")
    )
  )()
}
