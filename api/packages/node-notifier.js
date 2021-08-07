let { default: notifier } = await import("node-notifier");
global.notify = notification => {
    return typeof notification === "string"
        ? notifier.notify({ message: notification })
        : notifier.notify(notification);
};
export {};
