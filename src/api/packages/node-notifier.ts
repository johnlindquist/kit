let { default: notifier }: any = await import(
  "node-notifier"
)

global.notify = notification => {
  global.hide()
  return typeof notification === "string"
    ? notifier.notify({ message: notification })
    : notifier.notify(notification)
}

export {}
