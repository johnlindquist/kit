let { default: notifier } = await import("node-notifier");
global.notify = notification => {
    hide();
    return typeof notification === "string"
        ? notifier.notify({ message: notification })
        : notifier.notify(notification);
};
export {};
