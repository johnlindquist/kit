let { default: notifier } = await import("node-notifier");
global.notifier = notifier;
global.notify = notifier.notify;
export {};
