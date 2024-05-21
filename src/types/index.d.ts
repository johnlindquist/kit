import { GlobalsApi } from "@johnlindquist/globals"
import { AppApi } from "./kitapp"
import { KitApi, Run } from "./kit"
import { PackagesApi } from "./packages"
import { PlatformApi } from "./platform"
import { ProAPI } from "./pro"

export type GlobalApi = Omit<GlobalsApi, "path"> &
  KitApi &
  PackagesApi &
  PlatformApi &
  AppApi &
  ProAPI

declare global {
  type Metadata = import("./core").Metadata;

  var kit: GlobalApi & Run

  namespace NodeJS {
    interface Global extends GlobalApi {}
  }
}

export * from "./core"
export default kit
