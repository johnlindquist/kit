import { GlobalsApi } from "@johnlindquist/globals"
import { AppApi } from "./kitapp"
import { KitApi } from "./kit"
import { PackagesApi } from "./packages"
import { PlatformApi } from "./platform"
import { ProAPI } from "./pro"

type GlobalOverride = Omit<GlobalsApi, "path">

type GlobalApi = Omit<GlobalsApi, "path"> &
  KitApi &
  PackagesApi &
  PlatformApi &
  AppApi &
  ProAPI

declare global {
  namespace NodeJS {
    interface Global extends GlobalApi {}
  }
}

export * from "./core"
