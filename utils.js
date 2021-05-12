export let assignPropsTo = (source, target) => {
    Object.entries(source).forEach(([key, value]) => {
        target[key] = value;
    });
};
