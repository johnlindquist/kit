import notifier from "node-notifier"

global.notify = (...args) => {
  if (typeof args[0] === "string") {
    let notification = args[0]
    args[0] = {
      title: "Script Kit",
      message: notification,
    }
  }

  // if timeout is not specified, use false
  if ((args[0] as any).timeout === undefined) {
    ;(args[0] as any).timeout = false
  }

  return notifier.notify(...args)
}
