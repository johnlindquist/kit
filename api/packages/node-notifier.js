let { default: notifier } = await import("node-notifier");
global.notify = notifier.notify;
export {};
