import notifier from "node-notifier"
import { Notification } from "node-notifier"

type KitNotification = string | Notification
interface Notify {
  (notification: KitNotification)
}

global.notify = notification => {
  return typeof notification === "string"
    ? notifier.notify({ message: notification })
    : notifier.notify(notification)
}
declare global {
  var notify: Notify

  namespace NodeJS {
    interface Global {
      notify: Notify
    }
  }
}
