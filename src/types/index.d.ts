import { GlobalsApi } from "@johnlindquist/globals"
import { AppApi } from "./kitapp"
import { KitApi } from "./kit"
import { PackagesApi } from "./packages"
import { PlatformApi } from "./platform"
import { ProAPI } from "./pro"

declare global {
  type GlobalApi = AppApi &
    KitApi &
    ProAPI &
    PackagesApi &
    PlatformApi &
    GlobalsApi
  namespace NodeJS {
    interface Global extends GlobalApi {}
  }
}

export * from "./core"
