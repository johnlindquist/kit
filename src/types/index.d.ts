import { AppApi } from "./kitapp"
import { KitApi } from "./kit"
import { PackagesApi } from "./packages"
import { PlatformApi } from "./platform"

declare global {
  type GlobalApi = AppApi &
    KitApi &
    PackagesApi &
    PlatformApi
  namespace NodeJS {
    interface Global extends GlobalApi {}
  }
}
