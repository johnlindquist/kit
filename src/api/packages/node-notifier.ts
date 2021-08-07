let { default: notifier }: any = await import(
  "node-notifier"
)

global.notify = notification => {
  return typeof notification === "string"
    ? notifier.notify({ message: notification })
    : notifier.notify(notification)
}

export {}
