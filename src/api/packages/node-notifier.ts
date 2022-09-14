import notifier from "node-notifier"
import { Notification } from "node-notifier"

type KitNotification = string | Notification
interface Notify {
  (notification: KitNotification)
}

global.notify = notification => {
  let options =
    typeof notification === "string"
      ? { message: notification }
      : notification
  return notifier.notify({ timeout: false, ...options })
}
declare global {
  var notify: Notify

  namespace NodeJS {
    interface Global {
      notify: Notify
    }
  }
}
