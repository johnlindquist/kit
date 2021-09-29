let { default: notifier }: any = await import(
  "node-notifier"
)

type Notification =
  | string
  | Parameters<typeof import("node-notifier").notify>[0]

export let notify = (notification: Notification) => {
  hide()
  return typeof notification === "string"
    ? notifier.notify({ message: notification })
    : notifier.notify(notification)
}

global.notify = notify

export {}
