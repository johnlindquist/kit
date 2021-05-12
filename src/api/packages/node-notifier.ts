let { default: notifier }: any = await import(
  "node-notifier"
)
global.notify = notifier.notify

export {}
