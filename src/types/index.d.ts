import "./globals.d.ts"
import type { GlobalsApi } from "../globals/index.ts"
import type { AppApi } from "./kitapp.ts"
import type { KitApi, Run } from "./kit.ts"
import type { PackagesApi } from "./packages.ts"
import type { PlatformApi } from "./platform.ts"
import type { ProAPI } from "./pro.ts"

export type GlobalApi = Omit<GlobalsApi, "path"> &
  KitApi &
  PackagesApi &
  PlatformApi &
  AppApi &
  ProAPI

declare global {
  var kit: GlobalApi & Run
  interface Global extends GlobalApi {}
}

export * from "./core"
export * from "../core/utils"

export default kit
